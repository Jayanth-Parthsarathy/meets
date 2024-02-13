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
  createElementForRemotePeer,
  handleCameraOff,
  handleLocalCam,
  handleLocalMic,
  handleMute,
  handleRemoteCam,
  handleRemoteMic,
  joinRoomAndSetupMedia,
  sendJoinRoomRequest,
  updateUIForUser,
} from "../utils/room";
import { ParticipantStates } from "../types/socket";
import JoinNotification from "../components/join-notification";
import LeaveNotification from "../components/leave-notification";

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
      const roomExists = await checkIfRoomExists(roomId);
      if (!roomExists) {
        return navigate("/");
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
      setRoomExists(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      const userId = Number(localStorage.getItem("userId"));
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
                  createElementForRemotePeer(peer, stream);
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
                    localStorage.getItem("username"),
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
              if (current) createElementForRemotePeer(current, stream);
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
        handleRemoteCam(uid, userId, isCamOff);
      });

      socket.on("mic", (uid, isMicOff) => {
        handleRemoteMic(uid, userId, isMicOff);
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
    <div class="min-h-screen p-10 ">
      <div id="remote-video-container" class="grid grid-cols-4 gap-4">
        <div id="local-div" class="h-96 w-96">
          <video id="local-video" class="h-max w-max" autoplay muted></video>
          <div
            class="text-white relative bottom-10 left-10 text-xl"
            id="local-text"
          >
            {localStorage.getItem("username")}
          </div>
        </div>
      </div>
      {showNewUserNotification() && (
        <JoinNotification newUserName={newUserName()} />
      )}
      {showLeftUserNotification() && (
        <LeaveNotification leaverName={leaverName()} />
      )}
      <button
        class="bg-white text-black text-4xl bottom-4 right-4 fixed rounded-full p-2 cursor-pointer"
        style={{
          bottom: "8%",
          right: "45%",
          transform: "translate(50%, 50%)",
        }}
        onClick={() => {
          setIsMuted(!isMuted());
          handleLocalMic(isMuted());
          handleMute(isMuted(), socket, Number(localStorage.getItem("userId")));
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
          handleLocalCam(isCameraOff());
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
  );
};

export default Room;
