import { Server } from "socket.io";
import http from "http";
import prisma from "./db";
import { ParticipantStates } from "../types";

const initSocket = async (
  server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>,
) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    },
  });
  const participantStates: ParticipantStates = {};

  io.on("connection", async (socket) => {
    socket.on("join-room", async (roomId, userId) => {
      if (!participantStates[roomId]) {
        participantStates[roomId] = {};
      }
      if (!participantStates[roomId][userId]) {
        participantStates[roomId][userId] = {
          cameraOn: true,
          micOn: true,
        };
      }
      const dbUser = await prisma.user.findFirst({
        where: {
          id: userId,
        },
      });
      const userPayload = {
        name: dbUser?.name,
      };
      socket.join(roomId);
      socket.broadcast.to(roomId).emit("new-user", userPayload);
      socket.data.userId = userId;
      socket.data.name = dbUser?.name;
      socket.data.roomId = roomId;
      const room = await prisma.room.findFirst({
        where: {
          customId: roomId,
        },
        include: {
          participants: true,
        },
      });
      const payload = room?.participants.map((participant) => ({
        id: participant.id,
        name: participant.name,
      }));
      io.to(roomId).emit(
        "users",
        payload,
        socket.data.userId,
        participantStates,
      );
    });

    socket.on("leave-room", async (roomId) => {
      if (socket.data.userId && socket.data.roomId) {
        delete participantStates[socket.data.roomId][socket.data.userId];
      }
      io.to(roomId).emit("leave-room", socket.data.userId, socket.data.name);
      socket.leave(roomId);
      socket.removeAllListeners();
      const room = await prisma.room.findFirst({
        where: {
          customId: roomId,
        },
        include: {
          participants: true,
        },
      });
      const existingParticipants = room?.participants.map(
        (participant) => participant.id,
      );
      const updatedParticipants = existingParticipants?.filter(
        (userId) => userId === socket.data.userId,
      );
      if (updatedParticipants) {
        await prisma.room.update({
          where: {
            customId: roomId,
          },
          data: {
            participants: {
              disconnect: updatedParticipants.map((userId) => ({ id: userId })),
            },
          },
        });
      }
    });

    socket.on("mic", (isMicOff, userId) => {
      if (participantStates[socket.data.roomId]) {
        if (participantStates[socket.data.roomId][userId]) {
          participantStates[socket.data.roomId][userId] = {
            ...participantStates[socket.data.roomId][userId],
            micOn: !isMicOff,
          };
        }
      }
      socket.broadcast.to(socket.data.roomId).emit("mic", userId, isMicOff);
    });
    socket.on("cam", (isCamOff, userId) => {
      if (participantStates[socket.data.roomId]) {
        if (participantStates[socket.data.roomId][userId]) {
          participantStates[socket.data.roomId][userId] = {
            ...participantStates[socket.data.roomId][userId],
            cameraOn: !isCamOff,
          };
        }
      }
      socket.broadcast.to(socket.data.roomId).emit("cam", userId, isCamOff);
    });

    socket.on("offer", async (offer, targetRoomId, targetUserId, fromId) => {
      const fromUser = await prisma.user.findFirst({
        where: {
          id: fromId,
        },
      });
      socket.broadcast
        .to(targetRoomId)
        .emit("offer", offer, targetUserId, fromId, fromUser?.name);
    });

    socket.on("answer", (answer, targetRoomId, targetUserId, fromId) => {
      socket.broadcast
        .to(targetRoomId)
        .emit("answer", answer, targetUserId, fromId);
    });

    socket.on(
      "ice-candidate",
      (candidate, targetRoomId, targetUserId, fromId) => {
        socket.broadcast
          .to(targetRoomId)
          .emit("ice-candidate", candidate, targetUserId, fromId);
      },
    );

    socket.on("disconnect", async (reason) => {
      if (socket.data.userId && socket.data.roomId) {
        delete participantStates[socket.data.roomId][socket.data.userId];
      }
      io.to(socket.data.roomId).emit(
        "leave-room",
        socket.data.userId,
        socket.data.name,
      );
      socket.removeAllListeners();
      if (socket.data.userId) {
        const user = await prisma.user.findFirst({
          where: {
            id: Number(socket.data.userId),
          },
          include: {
            rooms: true,
          },
        });
        if (user) {
          const roomIds = user.rooms.map((room) => room.id);
          await Promise.all(
            roomIds.map(async (roomId) => {
              await prisma.room.update({
                where: {
                  id: roomId,
                },
                data: {
                  participants: {
                    disconnect: {
                      id: user.id,
                    },
                  },
                },
              });
            }),
          );
          await prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              rooms: {
                set: [],
              },
            },
          });
        }
      }
    });
  });
};

export default initSocket;
