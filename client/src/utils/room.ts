import { Socket } from "socket.io-client";
import { axios } from "./axios";

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
    const response = await axios.post("api/rooms/leave/" + roomId);
    console.log(response.data);
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

const removeAudio = (inputStream: MediaStream) => {
  const localVideo = document.getElementById("local-video");
  const outputMediaStream = new MediaStream();
  inputStream.getTracks().forEach((track) => {
    if (track.kind === "video") {
      outputMediaStream.addTrack(track.clone());
    }
  });
  return outputMediaStream;
};

const removleVideoOrAudio = (inputStream: MediaStream) => {
  const outputMediaStream = new MediaStream();
  inputStream.getTracks().forEach((track) => {
    if (track.kind === "audio") {
      outputMediaStream.addTrack(track.clone());
    }
  });
  return outputMediaStream;
};
