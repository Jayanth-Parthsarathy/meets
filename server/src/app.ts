import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import prisma from "./utils/db";
import dotenv from "dotenv";
import roomRouter from "./routes/roomRouter";
import authRouter from "./routes/authRouter";
import { corsOptions } from "./utils";
import initSocket from "./utils/socket";

async function main() {
  dotenv.config();
  const port = process.env.PORT || 3001;
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(cors(corsOptions));
  const server = http.createServer(app);
  initSocket(server);
  app.use("/api/rooms", roomRouter);
  app.use("/api/auth", authRouter);
  server
    .listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    })
    .on("error", (err) => {
      console.log("Server failed to start: ", err);
    });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
