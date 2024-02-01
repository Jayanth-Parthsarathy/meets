import { Router } from "express";
import { get } from "../controllers/userController";

export const userRouter = Router();
userRouter.get("/", get);
