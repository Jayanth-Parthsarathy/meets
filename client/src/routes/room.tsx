import { useNavigate, useParams } from "@solidjs/router";
import { createEffect, onCleanup, createSignal } from "solid-js";
import { socket } from "../lib/socket";
import { axios } from "../utils/axios";

const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

interface User {
  id: string;
}

interface ExtendedRTCPeerConnection extends RTCPeerConnection {
  targetUserId: string;
}

const Room = () => {
  const params = useParams();
  const roomId = params.id;
  const [remotePeers, setRemotePeers] = createSignal<
    ExtendedRTCPeerConnection[]
  >([]);
  const navigate = useNavigate();
  const [users, setUsers] = createSignal<User[]>([]);
  const [roomExists, setRoomExists] = createSignal<boolean>(false);

  createEffect(async () => {
    const response = await axios.get("api/rooms/room/" + roomId);
    if (!response.data.room) {
      return navigate("/");
    } else if (response.data.room.id) {
      setRoomExists(true);
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        const localVideo = document.getElementById(
          "local-video",
        ) as HTMLVideoElement;
        if (localVideo) {
          localVideo.srcObject = stream;
        }
      });

      socket.emit("join-room", params.id);
      socket.on("users", (userList, userId) => {
        if (userId == socket.id) {
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
              const remoteVideoContainer = document.getElementById(
                "remote-video-container",
              );
              const remoteVideoDiv = document.createElement("div");
              const remoteVideo = document.createElement("video");
              remoteVideoDiv.id = peer.targetUserId;
              remoteVideo.autoplay = true;
              remoteVideoDiv && remoteVideoDiv.appendChild(remoteVideo);
              remoteVideoContainer &&
                remoteVideoContainer.appendChild(remoteVideoDiv);
              remoteVideo.srcObject = event.streams[0];
            };
            peer.onicecandidate = (event) => {
              if (event.candidate) {
                socket.emit(
                  "ice-candidate",
                  event.candidate,
                  roomId,
                  peer.targetUserId,
                  socket.id,
                );
              }
            };
            navigator.mediaDevices
              .getUserMedia({ video: true })
              .then((stream) => {
                stream.getTracks().forEach((track) => {
                  peer.addTrack(track, stream);
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
                        socket.id,
                      );
                    });
                });
              });
          });
        }
      });

      socket.on("answer", (answer, targetUserId, fromId) => {
        if (socket.id == targetUserId) {
          for (let peer of remotePeers()) {
            if (peer.targetUserId == fromId) {
              console.log("received answer");
              peer.setRemoteDescription(new RTCSessionDescription(answer));
              peer.ontrack = (event) => {
                const remoteVideoContainer = document.getElementById(
                  "remote-video-container",
                );
                const remoteVideo = document.createElement("video");
                remoteVideo.id = peer.targetUserId;
                remoteVideo.autoplay = true;
                remoteVideoContainer &&
                  remoteVideoContainer.appendChild(remoteVideo);
                remoteVideo.srcObject = event.streams[0];
              };
              break;
            }
          }
        }
      });

      socket.on("ice-candidate", (candidate, targetUserId, fromId) => {
        if (targetUserId == socket.id) {
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
        if (targetUserId == socket.id) {
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
            const remoteVideoContainer = document.getElementById(
              "remote-video-container",
            );
            const remoteVideo = document.createElement("video");
            remoteVideo.autoplay = true;
            remoteVideoContainer &&
              remoteVideoContainer.appendChild(remoteVideo);
            remoteVideo.srcObject = event.streams[0];
            if (current) remoteVideo.id = current?.targetUserId;
          };
          current.onicecandidate = (event) => {
            if (event.candidate) {
              socket.emit(
                "ice-candidate",
                event.candidate,
                roomId,
                current?.targetUserId,
                socket.id,
              );
            }
          };
          navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
              stream.getTracks().forEach((track) => {
                current?.addTrack(track, stream);
                //Please please! Was stuck on this for more than an hour
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
              });
            });
        }
      });
    }
  });
  onCleanup(async () => {
    if (roomExists()) {
      socket.emit("leave-room", roomId);
    }
    socket.removeAllListeners();
  });

  return (
    <div>
      <div>
        <video id="local-video" autoplay muted></video>
      </div>
      <div id="remote-video-container"></div>
    </div>
  );
};

export default Room;
