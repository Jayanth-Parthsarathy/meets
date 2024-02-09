export interface ParticipantState {
  cameraOn: boolean;
  micOn: boolean;
}

export type ParticipantStates = {
  [roomId: string]: {
    [userId: string]: ParticipantState;
  };
};
