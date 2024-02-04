import { Socket } from "socket.io-client";
import { axios } from "./axios";

export const checkAuthentication = async () => {
  const response = await axios.post("api/auth/check-auth");
  if (!response.data.loggedIn) {
    return false;
  }
  localStorage.setItem("userId", response.data.userId);
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

export const joinRoomAndSetupMedia = async(
  roomId: string,
  userId: number,
  socket: Socket,
) => {
  socket.emit("join-room", roomId, userId);
  navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
    const localVideo = document.getElementById(
      "local-video",
    ) as HTMLVideoElement;
    if (localVideo) {
      localVideo.srcObject = stream;
    }
  });
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
  socket.removeAllListeners();
  socket.emit("leave-room", roomId);
};

