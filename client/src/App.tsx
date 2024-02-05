import { useNavigate, type Navigator } from "@solidjs/router";
import { createEffect, type Component } from "solid-js";
import { generateRandomRoomName } from "./utils";
import { axios } from "./utils/axios";
import { IoVideocam } from "solid-icons/io";

const joinMeet = (navigate: Navigator, roomCode: string) => {
  const roomCodePattern = /^[a-zA-Z]{3}-[a-zA-Z]{4}-[a-zA-Z]{3}$/;
  if (roomCodePattern.test(roomCode)) {
    navigate(`/${roomCode}`, { state: { owner: false } });
  } else {
    alert("Invalid room code format");
  }
};

const createMeet = async (navigate: Navigator) => {
  const roomName = generateRandomRoomName();
  const payload = {
    customId: roomName,
  };
  const response = await axios.post("api/rooms/create", payload);
  console.log(response.data);
  navigate(`/${roomName}`, { state: { owner: true } });
};

const App: Component = () => {
  let roomCode = "";
  const navigate = useNavigate();

  createEffect(async () => {
    const response = await axios.post("api/auth/check-auth");
    if (!response.data.loggedIn) {
      return navigate(`/login`);
    }
    localStorage.setItem("userId", response.data.userId);
  });

  return (
    <div class="min-h-screen bg-black text-gray-100 flex">
      <div class="flex flex-col items-center justify-center flex-1">
        <div class="flex flex-col gap-2 max-w-96">
          <div class="text-3xl font-semibold">
            <h2>Premium video meetings.</h2>
            <h2>Now free for everyone.</h2>
          </div>
          <div>
            <p>
              We re-engineered the service that we built for secure business
              meetings, Google Meet, to make it free and available for all.
            </p>
          </div>
        </div>
        <div class="flex gap-4 m-16">
          <button
            class="bg-blue-500 text-white rounded-sm flex gap-2 items-center justify-center p-3"
            onClick={() => createMeet(navigate)}
          >
            <IoVideocam /> New Meeting
          </button>
          <form class="flex gap-2">
            <input
              type="text"
              class="p-2 bg-gray-700 text-white rounded-sm"
              placeholder="Enter a code"
              value={roomCode}
              onInput={(e) => (roomCode = e.target.value)}
            />
            <button
              class="hover:bg-green-500 bg-gray-300 p-2 px-6 rounded-md text-black hover:text-black"
              onClick={(e) => {
                e.preventDefault();
                joinMeet(navigate, roomCode);
              }}
            >
              Join
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default App;
