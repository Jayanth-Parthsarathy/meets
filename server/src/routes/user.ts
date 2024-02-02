import { Router } from "express";
import { getUser } from "../controllers/userController";

export const userRouter = Router();
userRouter.get("/", getUser);
