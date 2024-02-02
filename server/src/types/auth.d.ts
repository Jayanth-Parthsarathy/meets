import { Request } from "express";

export interface jwtPayload {
  id: number;
  name: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: jwtPayload;
}
