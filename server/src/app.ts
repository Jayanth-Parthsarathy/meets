import express, { Request, Response } from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { Rooms } from "./types";

const app = express();
const port = process.env.PORT || 3001;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  },
});

app.use(express.json());
app.use(cors());
const rooms: Rooms = {};

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("join-room", (roomId) => {
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    socket.join(roomId);
    io.to(roomId).emit("users", rooms[roomId], socket.id);
    rooms[roomId].push({ id: socket.id });
    console.log("User with socket id " + socket.id + " joined room " + roomId);
  });

  socket.on("leave-room", (roomId) => {
    rooms[roomId] = rooms[roomId].filter((user) => user.id !== socket.id);
    socket.leave(roomId);
    socket.removeAllListeners();
    console.log("User with socket id " + socket.id + "left room " + roomId);
  });

  socket.on("offer", (offer, targetRoomId, targetUserId, fromId) => {
    console.log(
      "Offer sent to room id " +
        targetRoomId +
        " the offer was " +
        offer +
        " for userId " +
        targetUserId,
    );
    socket.broadcast
      .to(targetRoomId)
      .emit("offer", offer, targetUserId, fromId);
  });

  socket.on("answer", (answer, targetRoomId, targetUserId, fromId) => {
    console.log(
      "Answer sent to room id " +
        targetRoomId +
        " the answer was " +
        answer +
        " for userId " +
        targetUserId,
      "from userId " + fromId,
    );
    socket.broadcast
      .to(targetRoomId)
      .emit("answer", answer, targetUserId, fromId);
  });

  socket.on(
    "ice-candidate",
    (candidate, targetRoomId, targetUserId, fromId) => {
      console.log(
        "ice-candidate from room " +
          targetRoomId +
          " to user id " +
          targetUserId +
          " from user id " +
          fromId,
      );
      socket.broadcast
        .to(targetRoomId)
        .emit("ice-candidate", candidate, targetUserId, fromId);
    },
  );

  socket.on("disconnect", (reason) => {
    socket.removeAllListeners();
    Object.keys(rooms).forEach((roomId) => {
      rooms[roomId] = rooms[roomId].filter((user) => user.id !== socket.id);
    });
    console.log("user left because of " + reason);
  });
});

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript Express!");
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
