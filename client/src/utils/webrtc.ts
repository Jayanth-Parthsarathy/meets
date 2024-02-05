import { TURN_CREDENTIALS, TURN_URL, TURN_USERNAME } from ".";

export const configuration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: TURN_URL,
      username: TURN_USERNAME,
      credential: TURN_CREDENTIALS,
    },
  ],
};
