import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { jwtPayload } from "../types/auth";
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const signJWT = (
  payload: jwtPayload,
  jwtSecret: string,
  expiresIn: string,
): string => {
  return jwt.sign(payload, jwtSecret, { expiresIn });
};

export const verifyJWT = (token: string, jwtSecret: string): jwtPayload => {
  try {
    const decoded = jwt.verify(token, jwtSecret);
    return decoded as jwtPayload;
  } catch (err) {
    throw new Error("Invalid token");
  }
};
