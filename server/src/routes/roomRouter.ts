import { Router } from "express";
import {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
} from "../controllers/roomController";
import { protect } from "../middleware/auth";

const roomRouter = Router();
roomRouter.get("/room/:id", getRoom);
roomRouter.post("/create", protect, createRoom);
roomRouter.post("/join/:id", protect, joinRoom);
roomRouter.post("/leave/:id", protect, leaveRoom);

export default roomRouter;
