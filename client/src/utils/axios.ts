import axios from "axios";
import { BACKEND_URL } from ".";

const instance = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "69420",
  },
});

export { instance as axios };
