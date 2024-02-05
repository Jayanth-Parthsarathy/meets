import { useNavigate, useParams } from "@solidjs/router";
import { createEffect, onCleanup, createSignal } from "solid-js";
import { socket } from "../lib/socket";
import { IoCall } from "solid-icons/io";
import { BsCameraVideoFill } from "solid-icons/bs";
import { BsCameraVideoOffFill } from "solid-icons/bs";
import { FiMicOff } from "solid-icons/fi";
import { FiMic } from "solid-icons/fi";
import { configuration } from "../utils/webrtc";
import { ExtendedRTCPeerConnection } from "../types/webrtc";
import { User } from "../types";
import {
  checkAuthentication,
  checkIfRoomExists,
  cleanUpOnLeaveRoom,
  handleCameraOff,
  handleMute,
  joinRoomAndSetupMedia,
  sendJoinRoomRequest,
} from "../utils/room";

const Room = () => {
  const params = useParams();
  const roomId = params.id;
  const [remotePeers, setRemotePeers] = createSignal<
    ExtendedRTCPeerConnection[]
  >([]);
  const navigate = useNavigate();
  const [users, setUsers] = createSignal<User[]>([]);
  const [roomExists, setRoomExists] = createSignal<boolean>(false);
  const [isMuted, setIsMuted] = createSignal(false);
  const [isCameraOff, setIsCameraOff] = createSignal(false);
  const [showNewUserNotification, setShowNewUserNotification] =
    createSignal(false);
  const [showLeftUserNotification, setShowLeftUserNotification] =
    createSignal(false);
  const [newUserName, setNewUserName] = createSignal("");
  const [leaverName, setLeaverName] = createSignal("");

  createEffect(async () => {
    navigator.mediaDevices
      .getUserMedia({
        video: !isCameraOff(),
        audio: !isMuted(),
      })
      .then(async (stream) => {
        const isAuthed = await checkAuthentication();
        if (!isAuthed) {
          return navigate(`/login`);
        }
        const userId = Number(localStorage.getItem("userId"));
        const roomExists = await checkIfRoomExists(roomId);
        if (!roomExists) {
          return navigate("/");
        }
        setRoomExists(true);
        await joinRoomAndSetupMedia(roomId, userId, socket, stream);
        socket.on("new-user", (user) => {
          setNewUserName(user.name);
          setShowNewUserNotification(true);
          setTimeout(() => {
            setShowNewUserNotification(false);
            setNewUserName("");
          }, 2000);
        });
        socket.on("users", async (userList, userid) => {
          if (userid === userId) {
            await sendJoinRoomRequest(roomId);
            setUsers(userList);
            console.log(users());
            for (let i = 0; i < users().length; i++) {
              let lc: ExtendedRTCPeerConnection = new RTCPeerConnection(
                configuration,
              ) as ExtendedRTCPeerConnection;
              lc.targetUserId = users()[i].id;
              setRemotePeers((remotePeers) => [...remotePeers, lc]);
            }
            remotePeers().map((peer) => {
              peer.ontrack = (event) => {
                const stream = event.streams[0];
                const remoteVideo = document.getElementById(
                  "vid-" + peer.targetUserId,
                ) as HTMLVideoElement;
                if (!remoteVideo) {
                  const remoteVideoContainer = document.getElementById(
                    "remote-video-container",
                  );
                  const remoteVideoDiv = document.createElement("div");
                  remoteVideoDiv.id = "div-" + peer.targetUserId;
                  const newRemoteVideo = document.createElement("video");
                  newRemoteVideo.id = "vid-" + peer.targetUserId;
                  newRemoteVideo.autoplay = true;
                  remoteVideoDiv && remoteVideoDiv.appendChild(newRemoteVideo);
                  remoteVideoContainer &&
                    remoteVideoContainer.appendChild(remoteVideoDiv);
                  newRemoteVideo.srcObject = stream;
                } else {
                  remoteVideo.srcObject = stream;
                }
              };
              peer.onicecandidate = (event) => {
                if (event.candidate) {
                  socket.emit(
                    "ice-candidate",
                    event.candidate,
                    roomId,
                    peer.targetUserId,
                    userId,
                  );
                }
              };
              stream.getTracks().forEach((track) => {
                peer.addTrack(track, stream);
              });
              peer
                .createOffer()
                .then((offer) => peer.setLocalDescription(offer))
                .then(() => {
                  console.log("created offer");
                  console.log(peer.localDescription);
                  socket.emit(
                    "offer",
                    peer.localDescription,
                    roomId,
                    peer.targetUserId,
                    userId,
                  );
                });
            });
          }
        });

        socket.on("answer", (answer, targetUserId, fromId) => {
          if (userId == targetUserId) {
            for (let peer of remotePeers()) {
              if (peer.targetUserId == fromId) {
                console.log("received answer");
                peer.setRemoteDescription(new RTCSessionDescription(answer));
                peer.ontrack = (event) => {
                  const stream = event.streams[0];
                  const remoteVideo = document.getElementById(
                    "vid-" + peer.targetUserId,
                  ) as HTMLVideoElement;
                  if (!remoteVideo) {
                    const remoteVideoContainer = document.getElementById(
                      "remote-video-container",
                    );
                    const remoteVideoDiv = document.createElement("div");
                    remoteVideoDiv.id = "div-" + peer.targetUserId;
                    const newRemoteVideo = document.createElement("video");
                    newRemoteVideo.id = "vid-" + peer.targetUserId;
                    newRemoteVideo.autoplay = true;
                    remoteVideoDiv &&
                      remoteVideoDiv.appendChild(newRemoteVideo);
                    remoteVideoContainer &&
                      remoteVideoContainer.appendChild(remoteVideoDiv);
                    newRemoteVideo.srcObject = stream;
                  } else {
                    remoteVideo.srcObject = stream;
                  }
                };
                break;
              }
            }
          }
        });

        socket.on("ice-candidate", (candidate, targetUserId, fromId) => {
          if (targetUserId == userId) {
            console.log("Ice canditate");
            let current: ExtendedRTCPeerConnection | null = null;
            for (let peer of remotePeers()) {
              if (peer.targetUserId == fromId) {
                current = peer;
                break;
              }
            }
            if (current == null) {
              console.log("no previous peer creating new peer ...");
              let rc: ExtendedRTCPeerConnection = new RTCPeerConnection(
                configuration,
              ) as ExtendedRTCPeerConnection;
              rc.targetUserId = fromId;
              setRemotePeers((peers) => [...peers, rc]);
              current = rc;
            }
            current.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });

        socket.on("offer", (offer, targetUserId, fromId) => {
          if (targetUserId == userId) {
            let current: ExtendedRTCPeerConnection | null = null;
            for (let peer of remotePeers()) {
              if (peer.targetUserId == fromId) {
                current = peer;
              }
            }
            if (current == null) {
              let lc: ExtendedRTCPeerConnection = new RTCPeerConnection(
                configuration,
              ) as ExtendedRTCPeerConnection;
              lc.targetUserId = fromId;
              setRemotePeers((peers) => [...peers, lc]);
              current = lc;
            }
            current.ontrack = (event) => {
              const stream = event.streams[0];
              const remoteVideo = document.getElementById(
                "vid-" + current?.targetUserId,
              ) as HTMLVideoElement;
              if (!remoteVideo) {
                const remoteVideoContainer = document.getElementById(
                  "remote-video-container",
                );
                const remoteVideoDiv = document.createElement("div");
                remoteVideoDiv.id = "div-" + current?.targetUserId;
                const newRemoteVideo = document.createElement("video");
                newRemoteVideo.id = "vid-" + current?.targetUserId;
                newRemoteVideo.autoplay = true;
                remoteVideoDiv && remoteVideoDiv.appendChild(newRemoteVideo);
                remoteVideoContainer &&
                  remoteVideoContainer.appendChild(remoteVideoDiv);
                newRemoteVideo.srcObject = stream;
              } else {
                remoteVideo.srcObject = stream;
              }
            };
            current.onicecandidate = (event) => {
              if (event.candidate) {
                socket.emit(
                  "ice-candidate",
                  event.candidate,
                  roomId,
                  current?.targetUserId,
                  userId,
                );
              }
            };
            stream.getTracks().forEach((track) => {
              current?.addTrack(track, stream);
            });
            current
              ?.setRemoteDescription(new RTCSessionDescription(offer))
              .then(() => current?.createAnswer())
              .then((answer) => current?.setLocalDescription(answer))
              .then(() => {
                socket.emit(
                  "answer",
                  current?.localDescription,
                  roomId,
                  fromId,
                  targetUserId,
                );
              })
              .catch((err) => {
                console.log(err);
              });
          }
        });

        socket.on("leave-room", (leaverId, name) => {
          if (leaverId != userId) {
            setLeaverName(name);
            setShowLeftUserNotification(true);
            setTimeout(() => {
              setShowLeftUserNotification(false);
              setLeaverName("");
            }, 2000);
            const divToRemove = document.getElementById("div-" + leaverId);
            divToRemove && divToRemove.remove();
            setRemotePeers((peers) =>
              peers.filter((peer) => peer.targetUserId !== leaverId),
            );
          }
        });
      })
      .catch((err) => {
        alert("Please connect a camera and a microphone to continue");
      });
  });

  onCleanup(async () => {
    await cleanUpOnLeaveRoom(socket, roomExists(), roomId);
  });

  return (
    <div class="min-h-screen">
      <div class="grid grid-cols-4 min-w-max">
        <div id="remote-video-container" class="grid grid-cols-2 gap-4">
          <div class="w-96 h-96">
            <video id="local-video" class="h-max w-max" autoplay muted></video>
            <div class="text-white relative bottom-10 left-10 text-xl">
              {localStorage.getItem("username")}
            </div>
          </div>
          {remotePeers().map((peer) => (
            <div class="w-96 h-96">
              <video
                id={`vid-${peer.targetUserId}`}
                class="h-max w-max"
                autoplay
              ></video>
            </div>
          ))}
        </div>
      </div>
      {showNewUserNotification() && (
        <div class="fixed bottom-0 right-0 mb-4 mr-4 bg-green-500 text-white p-4 rounded-md shadow-md">
          <p class="text-sm">{newUserName()} joined the meeting.</p>
        </div>
      )}
      {showLeftUserNotification() && (
        <div class="fixed bottom-0 left-0 mb-4 mr-4 bg-red-500 text-white p-4 rounded-md shadow-md">
          <p class="text-sm">{leaverName()} left the meeting.</p>
        </div>
      )}
      <div class="flex justify-between">
        <button
          class="bg-white text-black text-4xl bottom-4 right-4 fixed rounded-full p-2 cursor-pointer"
          style={{
            bottom: "8%",
            right: "45%",
            transform: "translate(50%, 50%)",
          }}
          onClick={() => {
            setIsMuted(!isMuted());
            handleMute(
              isMuted(),
              socket,
              Number(localStorage.getItem("userId")),
            );
          }}
        >
          {isMuted() ? <FiMic /> : <FiMicOff />}
        </button>
        <IoCall
          class="bg-white text-5xl bottom-4 right-4 fixed rounded-full p-2 text-black cursor-pointer"
          style={{
            bottom: "8%",
            right: "50%",
            transform: "translate(50%, 50%)",
          }}
          onClick={() => navigate("/")}
        />
        <button
          class="bg-white text-black text-4xl bottom-4 right-4 fixed rounded-full p-2 cursor-pointer"
          style={{
            bottom: "8%",
            right: "55%",
            transform: "translate(50%, 50%)",
          }}
          onClick={() => {
            setIsCameraOff(!isCameraOff());
            handleCameraOff(
              isCameraOff(),
              socket,
              Number(localStorage.getItem("userId")),
            );
          }}
        >
          {isCameraOff() ? <BsCameraVideoFill /> : <BsCameraVideoOffFill />}
        </button>
      </div>
    </div>
  );
};

export default Room;
