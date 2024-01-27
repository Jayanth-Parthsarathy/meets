import { useNavigate, type Navigator } from "@solidjs/router";
import type { Component } from "solid-js";
import { generateRandomRoomName } from "./utils";

const joinMeet = (navigate: Navigator, roomCode: string) => {
  const roomCodePattern = /^[a-zA-Z]{3}-[a-zA-Z]{4}-[a-zA-Z]{3}$/;
  if (roomCodePattern.test(roomCode)) {
    navigate(`/${roomCode}`);
  } else {
    alert("Invalid room code format");
  }
};
const createMeet = (navigate: Navigator) => {
  const roomName = generateRandomRoomName();
  navigate(`/${roomName}`, { state: { owner: true } });
};
const App: Component = () => {
  let roomCode = "";
  const navigate = useNavigate();
  return (
    <div class="flex gap-4 m-40">
      <button
        class="p-2 bg-blue-500 text-white rounded-sm"
        onClick={() => createMeet(navigate)}
      >
        New Meeting
      </button>
      <form class="flex gap-2">
        <input
          type="text"
          class="p-2 bg-gray-100 rounded-sm"
          placeholder="Enter a room code"
          value={roomCode}
          onInput={(e) => (roomCode = e.target.value)}
        />
        <button
          class="hover:bg-green-500 p-2 px-6 rounded-md hover:text-black"
          onClick={(e) => {
            e.preventDefault();
            joinMeet(navigate, roomCode);
          }}
        >
          Join
        </button>
      </form>
    </div>
  );
};

export default App;
