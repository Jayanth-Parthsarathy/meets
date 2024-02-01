import { io } from "socket.io-client";

const URL = "https://fd5c-116-73-158-41.ngrok-free.app/";

export const socket = io(URL, {
  extraHeaders: {
    "ngrok-skip-browser-warning": "69420",
  },
});
