import { Server } from "socket.io";
import http from "http";
import prisma from "./db";

const initSocket = async (
  server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>,
) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    },
  });
  io.on("connection", async (socket) => {
    console.log("a user connected");
    socket.on("join-room", async (roomId, userId) => {
      const dbUser = await prisma.user.findFirst({
        where: {
          id: userId,
        },
      });
      const userPayload = {
        name: dbUser?.name,
      };
      socket.broadcast.to(roomId).emit("new-user", userPayload);
      socket.join(roomId);
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
      }));
      io.to(roomId).emit("users", payload, socket.data.userId);
      console.log(
        "User with userid " + socket.data.userId + " joined room " + roomId,
      );
    });

    socket.on("leave-room", async (roomId) => {
      io.to(roomId).emit("leave-room", socket.data.userId, socket.data.name);
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
      socket.leave(roomId);
      socket.removeAllListeners();
      console.log(
        "User with userid " + socket.data.userId + " left room " + roomId,
      );
    });

    socket.on("mic", (isMicOn, userId) => {
      socket.broadcast.to(socket.data.roomId).emit("mic", userId, isMicOn);
    });
    socket.on("cam", (isCamOn, userId) => {
      socket.broadcast.to(socket.data.roomId).emit("cam", userId, isCamOn);
    });
    socket.on("offer", (offer, targetRoomId, targetUserId, fromId) => {
      console.log(
        "Offer sent to room id " +
          targetRoomId +
          " the offer was " +
          JSON.stringify(offer) +
          " for userId " +
          targetUserId +
          "from userId " +
          fromId,
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

    socket.on("disconnect", async (reason) => {
      io.to(socket.data.roomId).emit(
        "leave-room",
        socket.data.userId,
        socket.data.name,
      );
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
      socket.removeAllListeners();
      console.log(
        "user of userId " + socket.data.userId + " left because of " + reason,
      );
    });
  });
};

export default initSocket;
