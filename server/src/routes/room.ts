import { Router } from "express";
import { get } from "../controllers/roomController";

export const roomRouter = Router();
roomRouter.get("/", get);
