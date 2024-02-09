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
import { ParticipantStates } from "../types/socket";

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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      function updateUIForUser(
        participantStates: ParticipantStates,
        roomId: string,
        targetUserId: number,
      ) {
        const { cameraOn, micOn } = participantStates[roomId][targetUserId];
        const userElement = document.getElementById(
          "vid-" + targetUserId,
        ) as HTMLVideoElement;
        if (userElement) {
          if (!cameraOn) {
            userElement.style.display = "none";
          }
          if (!micOn) {
            userElement.muted = true;
          }
        }
      }
      try {
        const isAuthed = await checkAuthentication();
        if (!isAuthed) {
          return navigate(`/login`);
        }
      } catch (err) {
        console.error("Error with authenticating the user");
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
      socket.on(
        "users",
        async (userList, userid, participantStates: ParticipantStates) => {
          if (userid === userId) {
            await sendJoinRoomRequest(roomId);
            setUsers(userList);
            for (let i = 0; i < users().length; i++) {
              let lc: ExtendedRTCPeerConnection = new RTCPeerConnection(
                configuration,
              ) as ExtendedRTCPeerConnection;
              lc.targetUserId = users()[i].id;
              lc.targetUserName = users()[i].name;
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
                  const newRemoteNameDiv = document.createElement("div");
                  newRemoteNameDiv.textContent = peer.targetUserName;
                  newRemoteNameDiv.style.position = "relative";
                  newRemoteNameDiv.style.bottom = "3rem";
                  newRemoteNameDiv.style.fontSize = "2rem";
                  newRemoteNameDiv.style.left = "3rem";
                  newRemoteVideo.autoplay = true;
                  remoteVideoDiv && remoteVideoDiv.appendChild(newRemoteVideo);
                  remoteVideoDiv &&
                    remoteVideoDiv.appendChild(newRemoteNameDiv);
                  remoteVideoContainer &&
                    remoteVideoContainer.appendChild(remoteVideoDiv);
                  newRemoteVideo.srcObject = stream;
                } else {
                  remoteVideo.srcObject = stream;
                }
                updateUIForUser(participantStates, roomId, peer.targetUserId);
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
        },
      );

      socket.on("answer", (answer, targetUserId, fromId) => {
        if (userId == targetUserId) {
          for (let peer of remotePeers()) {
            if (peer.targetUserId == fromId) {
              peer.setRemoteDescription(new RTCSessionDescription(answer));
              break;
            }
          }
        }
      });

      socket.on("ice-candidate", (candidate, targetUserId, fromId) => {
        if (targetUserId == userId) {
          let current: ExtendedRTCPeerConnection | null = null;
          for (let peer of remotePeers()) {
            if (peer.targetUserId == fromId) {
              current = peer;
              break;
            }
          }
          if (current == null) {
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

      socket.on("offer", (offer, targetUserId, fromId, fromUserName) => {
        if (targetUserId == userId) {
          let current: ExtendedRTCPeerConnection | null = null;
          for (let peer of remotePeers()) {
            if (peer.targetUserId == fromId) {
              current = peer;
              peer.targetUserName = fromUserName;
            }
          }
          if (current == null) {
            let lc: ExtendedRTCPeerConnection = new RTCPeerConnection(
              configuration,
            ) as ExtendedRTCPeerConnection;
            lc.targetUserId = fromId;
            lc.targetUserName = fromUserName;
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
              const newRemoteNameDiv = document.createElement("div");
              if (current)
                newRemoteNameDiv.textContent = current.targetUserName;
              newRemoteNameDiv.style.position = "relative";
              newRemoteNameDiv.style.bottom = "3rem";
              newRemoteNameDiv.style.fontSize = "2rem";
              newRemoteNameDiv.style.left = "3rem";
              newRemoteVideo.id = "vid-" + current?.targetUserId;
              newRemoteVideo.autoplay = true;
              remoteVideoDiv && remoteVideoDiv.appendChild(newRemoteVideo);
              remoteVideoDiv && remoteVideoDiv.appendChild(newRemoteNameDiv);
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

      socket.on("cam", (uid, isCamOff) => {
        if (userId != uid) {
          const curVideo = document.getElementById(
            "vid-" + uid,
          ) as HTMLVideoElement;
          if (isCamOff) {
            curVideo.style.display = "none";
            curVideo.pause();
          } else {
            curVideo.style.display = "";
            curVideo.play();
          }
        }
      });

      socket.on("mic", (uid, isMicOff) => {
        if (userId != uid) {
          const curVideo = document.getElementById(
            "vid-" + uid,
          ) as HTMLVideoElement;
          if (isMicOff) {
            curVideo.muted = true;
          } else {
            curVideo.muted = false;
          }
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
    } catch (err) {
      console.error("Error with accessing media devices " + err);
    }
  });

  onCleanup(async () => {
    try {
      await cleanUpOnLeaveRoom(socket, roomExists(), roomId);
    } catch (err) {
      console.error("Error during clean up and leaving the room");
    }
  });

  return (
    <div class="min-h-screen">
      <div class="grid grid-cols-4 min-w-max">
        <div id="remote-video-container" class="grid grid-cols-4 gap-4">
          <div style={{ width: "40rem", height: "40rem" }}>
            <div id="local-div">
              <video
                id="local-video"
                class="h-max w-max"
                autoplay
                muted
              ></video>
            </div>
            <div class="text-white relative bottom-10 left-10 text-xl">
              {localStorage.getItem("username")}
            </div>
          </div>
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
            const localVideo = document.getElementById(
              "local-video",
            ) as HTMLVideoElement;
            if (isMuted()) {
              localVideo.muted = true;
            } else {
              localVideo.muted = false;
            }
            handleMute(
              isMuted(),
              socket,
              Number(localStorage.getItem("userId")),
            );
          }}
        >
          {isMuted() ? <FiMicOff /> : <FiMic />}
        </button>
        <IoCall
          class="bg-white text-5xl bottom-4 right-4 fixed rounded-full p-2 text-black cursor-pointer"
          style={{
            bottom: "8%",
            right: "50%",
            transform: "translate(50%, 50%)",
          }}
          onClick={() => navigate("/", { replace: true })}
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
            const localVideo = document.getElementById(
              "local-video",
            ) as HTMLVideoElement;
            if (isCameraOff()) {
              localVideo.style.display = "none";
              localVideo.pause();
            } else {
              localVideo.style.display = "";
              localVideo.play();
            }
            handleCameraOff(
              isCameraOff(),
              socket,
              Number(localStorage.getItem("userId")),
            );
          }}
        >
          {isCameraOff() ? <BsCameraVideoOffFill /> : <BsCameraVideoFill />}
        </button>
      </div>
    </div>
  );
};

export default Room;
