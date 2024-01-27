import express, { Request, Response } from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

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
io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("join-room", (roomId) => {
    console.log("User joined room " + roomId);
  });
  socket.on("leave-room", (roomId) => {
    socket.leave(roomId);
    // socket.removeAllListeners("edit");
    console.log("User left room " + roomId);
  });
  socket.on("disconnect", (reason) => {
    console.log(reason);
  });
});

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript Express!");
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
