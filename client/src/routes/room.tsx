import { useParams } from "@solidjs/router";
import { useLocation } from "@solidjs/router";
import { RoomLocationState } from "../utils";
import { createEffect, onCleanup } from "solid-js";
import { socket } from "../lib/socket";
const Room = () => {
  const params = useParams();
  const location: RoomLocationState | null = useLocation().state;
  const roomId = params.id;
  onCleanup(() => {
    socket.emit("leave-room", roomId);
  });
  createEffect(() => {
    socket.emit("join-room", params.id);
  });

  return <div>{params.id}</div>;
};

export default Room;
