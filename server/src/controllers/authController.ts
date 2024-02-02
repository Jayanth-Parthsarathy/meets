import { Request, Response } from "express";
import { prisma } from "../utils/db";
import {
  comparePassword,
  hashPassword,
  signJWT,
  verifyJWT,
} from "../utils/auth";

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  try {
    const hash = await hashPassword(password);
    const userObj = {
      name,
      email,
      password: hash,
    };
    await prisma.user.create({
      data: userObj,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error with creating the user: " + err });
  }
  return res.json({ message: "User created successfully" });
};

export const login = async (req: Request, res: Response) => {
  const accessExpirationDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
  const refreshExpirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const { email, password } = req.body;
  const userExists = await prisma.user.findFirst({ where: { email } });
  if (!userExists) {
    return res.status(404).json({ message: "User not found" });
  }
  const passwordMatch = await comparePassword(password, userExists.password);
  if (!passwordMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const { name, id } = userExists;
  const payload = {
    id,
    email,
    name,
  };
  const accessSecret = process.env.ACCESS_SECRET;
  const refreshSecret = process.env.REFRESH_SECRET;
  if (!accessSecret || !refreshSecret) {
    return res.status(500).json({ message: "JWT secrets not provided" });
  }
  const accessToken = signJWT(payload, accessSecret, "1d");
  const refreshToken = signJWT(payload, refreshSecret, "30d");

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    expires: accessExpirationDate,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    expires: refreshExpirationDate,
  });
  return res.status(200).json({
    message: "Logged in successfully",
    token: accessToken,
  });
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not provided." });
  }
  const refreshSecret = process.env.REFRESH_SECRET;
  if (!refreshSecret) {
    return res
      .status(500)
      .json({ message: "Refresh token secret not provided." });
  }
  try {
    const decoded = verifyJWT(refreshToken, refreshSecret);
    const newAccessToken = signJWT(
      { id: decoded.id, email: decoded.email, name: decoded.name },
      process.env.ACCESS_SECRET!,
      "1d",
    );
    return res.status(200).json({
      message: "Access token refreshed successfully",
      token: newAccessToken,
    });
  } catch (err) {
    return res.status(401).json({ message: "Invalid refresh token." });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });

  return res.status(200).json({ message: "Logged out successfully" });
};

export const isLoggedIn = (req: Request, res: Response) => {
  const accessToken = req.cookies.accessToken;
  const accessSecret = process.env.ACCESS_SECRET;
  if (!accessSecret) {
    return res
      .status(500)
      .json({ message: "Access token secret not provided." });
  }
  try {
    const user = verifyJWT(accessToken, accessSecret);
    return res.status(200).json({ message: "Logged in", loggedIn: true });
  } catch (err) {
    res.status(200).json({ message: "Not logged in", loggedIn: false });
  }
};
