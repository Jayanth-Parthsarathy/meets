function generateRandomAlphabet(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const randomIndex = Math.floor(Math.random() * alphabet.length);
  return alphabet[randomIndex];
}

export function generateRandomRoomName(): string {
  const randomName = `${generateRandomAlphabet()}${generateRandomAlphabet()}${generateRandomAlphabet()}`;
  return `${randomName}-${generateRandomAlphabet()}${generateRandomAlphabet()}${generateRandomAlphabet()}${generateRandomAlphabet()}-${generateRandomAlphabet()}${generateRandomAlphabet()}${generateRandomAlphabet()}`;
}

export interface RoomLocationState
  extends Readonly<Partial<{ owner: boolean }>> {}

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
