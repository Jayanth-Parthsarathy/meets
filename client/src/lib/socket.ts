import { io } from "socket.io-client";
import { BACKEND_URL } from "../utils";
export const socket = io(BACKEND_URL, {
  extraHeaders: {
    "ngrok-skip-browser-warning": "1",
  },
});
