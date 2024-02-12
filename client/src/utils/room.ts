import { Socket } from "socket.io-client";
import { axios } from "./axios";
import { ParticipantStates } from "../types/socket";
import { ExtendedRTCPeerConnection } from "../types/webrtc";

export const checkAuthentication = async () => {
  const response = await axios.post("api/auth/check-auth");
  if (!response.data.loggedIn) {
    return false;
  }
  localStorage.setItem("userId", response.data.userId);
  localStorage.setItem("username", response.data.name);
  return true;
};

export const checkIfRoomExists = async (roomId: string) => {
  const response = await axios.get("api/rooms/room/" + roomId);
  if (!response.data.room) {
    return false;
  } else if (response.data.room.id) {
    return true;
  }
  return false;
};

export const joinRoomAndSetupMedia = async (
  roomId: string,
  userId: number,
  socket: Socket,
  stream: MediaStream,
) => {
  socket.emit("join-room", roomId, userId);
  const localVideo = document.getElementById("local-video") as HTMLVideoElement;
  if (localVideo) {
    localVideo.srcObject = stream;
    localVideo.muted = true;
  }
};

export const sendJoinRoomRequest = async (roomId: string) => {
  await axios.post("api/rooms/join/" + roomId);
};

export const cleanUpOnLeaveRoom = async (
  socket: Socket,
  roomExists: boolean,
  roomId: string,
) => {
  if (roomExists) {
    await axios.post("api/rooms/leave/" + roomId);
  }
  socket.emit("leave-room", roomId);
  socket.removeAllListeners();
};

export const handleMute = (
  isMuted: boolean,
  socket: Socket,
  userId: number,
) => {
  socket.emit("mic", isMuted, userId);
};

export const handleCameraOff = (
  isCameraOff: boolean,
  socket: Socket,
  userId: number,
) => {
  socket.emit("cam", isCameraOff, userId);
};

export const updateUIForUser = (
  participantStates: ParticipantStates,
  roomId: string,
  targetUserId: number,
) => {
  const { cameraOn, micOn } = participantStates[roomId][targetUserId];
  const userElement = document.getElementById(
    "vid-" + targetUserId,
  ) as HTMLVideoElement;
  const userTextElement = document.getElementById(
    "text-" + targetUserId,
  ) as HTMLDivElement;
  const userVideoDiv = document.getElementById(
    "div-" + targetUserId,
  ) as HTMLDivElement;
  if (userElement) {
    if (!cameraOn) {
      userTextElement.style.position = "static";
      userVideoDiv.style.display = "flex";
      userVideoDiv.style.alignItems = "center";
      userVideoDiv.style.justifyContent = "center";
      userElement.style.display = "none";
      userElement.pause();
    }
    if (!micOn) {
      userElement.muted = true;
    }
  }
};

export const createElementForRemotePeer = (
  peer: ExtendedRTCPeerConnection,
  stream: MediaStream,
) => {
  const remoteVideoContainer = document.getElementById(
    "remote-video-container",
  );
  const remoteVideoDiv = document.createElement("div");
  remoteVideoDiv.style.width = "24rem";
  remoteVideoDiv.style.height = "24rem";
  remoteVideoDiv.id = "div-" + peer.targetUserId;
  const newRemoteVideo = document.createElement("video");
  newRemoteVideo.id = "vid-" + peer.targetUserId;
  const newRemoteNameDiv = document.createElement("div");
  newRemoteNameDiv.id = "text-" + peer.targetUserId;
  newRemoteNameDiv.textContent = peer.targetUserName;
  newRemoteNameDiv.style.position = "relative";
  newRemoteNameDiv.style.bottom = "3rem";
  newRemoteNameDiv.style.fontSize = "2rem";
  newRemoteNameDiv.style.left = "3rem";
  newRemoteVideo.autoplay = true;
  newRemoteNameDiv.style.fontSize = "1.25rem";
  newRemoteNameDiv.style.color = "white";
  newRemoteNameDiv.style.lineHeight = "1.75rem";
  remoteVideoDiv && remoteVideoDiv.appendChild(newRemoteVideo);
  remoteVideoDiv && remoteVideoDiv.appendChild(newRemoteNameDiv);
  remoteVideoContainer && remoteVideoContainer.appendChild(remoteVideoDiv);
  newRemoteVideo.srcObject = stream;
};

export const handleRemoteCam = (
  uid: number,
  userId: number,
  isCamOff: boolean,
) => {
  if (userId != uid) {
    const curVideo = document.getElementById("vid-" + uid) as HTMLVideoElement;
    const curVideoDiv = document.getElementById(
      "div-" + uid,
    ) as HTMLVideoElement;
    const curText = document.getElementById("text-" + uid) as HTMLDivElement;
    if (isCamOff) {
      curVideo.style.display = "none";
      curVideo.pause();
      curText.style.position = "static";
      curVideoDiv.style.display = "flex";
      curVideoDiv.style.alignItems = "center";
      curVideoDiv.style.justifyContent = "center";
    } else {
      curVideo.style.display = "";
      curVideo.play();
      curText.style.position = "relative";
      curVideoDiv.style.display = "";
      curVideoDiv.style.alignItems = "";
      curVideoDiv.style.justifyContent = "";
    }
  }
};

export const handleRemoteMic = (
  uid: number,
  userId: number,
  isMicOff: boolean,
) => {
  if (userId != uid) {
    const curVideo = document.getElementById("vid-" + uid) as HTMLVideoElement;
    if (isMicOff) {
      curVideo.muted = true;
    } else {
      curVideo.muted = false;
    }
  }
};

export const handleLocalCam = (isCameraOff: boolean) => {
  const localVideo = document.getElementById("local-video") as HTMLVideoElement;
  const localText = document.getElementById("local-text") as HTMLDivElement;
  const localVideoDiv = document.getElementById(
    "local-div",
  ) as HTMLVideoElement;
  if (isCameraOff) {
    localVideo.style.display = "none";
    localText.style.position = "static";
    localVideoDiv.style.display = "flex";
    localVideoDiv.style.alignItems = "center";
    localVideoDiv.style.justifyContent = "center";
    localVideo.pause();
  } else {
    localVideo.style.display = "";
    localText.style.position = "relative";
    localVideoDiv.style.display = "";
    localVideoDiv.style.alignItems = "";
    localVideoDiv.style.justifyContent = "";
    localVideo.play();
  }
};

export const handleLocalMic = (isMuted: boolean) => {
  const localVideo = document.getElementById("local-video") as HTMLVideoElement;
  if (isMuted) {
    localVideo.muted = true;
  } else {
    localVideo.muted = false;
  }
};
