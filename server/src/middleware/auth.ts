import { NextFunction, Response } from "express";
import { verifyJWT } from "../utils/auth";
import { AuthRequest } from "../types/auth";

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res
      .status(401)
      .json({ message: "Access denied. No access token provided." });
  }

  try {
    const accessSecret = process.env.ACCESS_SECRET;

    if (!accessSecret) {
      return res.status(500).json({ message: "JWT secrets not provided" });
    }

    const decoded = verifyJWT(accessToken, accessSecret);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT Verification Error: ", err);
    return res.status(401).json({ message: "Invalid token." });
  }
};
