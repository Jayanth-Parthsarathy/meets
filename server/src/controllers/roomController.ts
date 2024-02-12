import { Request, Response } from "express";
import prisma from "../utils/db";
import { AuthRequest } from "../types/auth";

export const getRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Provide the id for the room" });
    }
    const room = await prisma.room.findFirst({
      where: { customId: id },
      include: { participants: true },
    });
    if (!room) {
      return res.status(404).json({ messsage: "Room not found" });
    }
    return res
      .status(200)
      .json({ messsage: "room fetched successfully", room });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error with fetching the room" + err });
  }
};

export const createRoom = async (req: AuthRequest, res: Response) => {
  try {
    const { customId } = req.body;
    if (!customId) {
      return res
        .status(400)
        .json({ message: "Provide the custom id for the room" });
    }
    const roomExists = await prisma.room.findFirst({
      where: {
        customId,
      },
    });
    if (roomExists) {
      return res.status(400).json({ message: "Room already exists" });
    }
    const room = await prisma.room.create({
      data: {
        customId,
      },
    });
    return res.status(200).json({ message: "Room created successfully", room });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error with creating the room" + err });
  }
};

export const joinRoom = async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req;
    const { id: customId } = req.params;
    if (!customId) {
      return res
        .status(400)
        .json({ message: "Provide the custom id for the room" });
    }
    const room = await prisma.room.findUnique({
      where: {
        customId,
      },
      include: {
        participants: true,
      },
    });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    const existingParticipants = room.participants.map(
      (participant) => participant.id,
    );
    if (user) {
      if (existingParticipants.includes(user.id)) {
        return res
          .status(400)
          .json({ message: "User is already a participant in the room" });
      }
      const updatedParticipants = [...existingParticipants, user.id];
      const updatedRoom = await prisma.room.update({
        where: {
          customId,
        },
        data: {
          participants: {
            connect: updatedParticipants.map((userId) => ({ id: userId })),
          },
        },
      });

      return res.status(200).json({
        message: "User joined the room successfully",
        room: updatedRoom,
      });
    }
    return res.status(200).json({ message: "Room created successfully", room });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error with creating the room" + err });
  }
};

export const leaveRoom = async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req;
    const { id: customId } = req.params;

    if (!customId) {
      return res
        .status(400)
        .json({ message: "Provide the custom id for the room" });
    }

    const room = await prisma.room.findUnique({
      where: {
        customId,
      },
      include: {
        participants: true,
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const existingParticipants = room.participants.map(
      (participant) => participant.id,
    );

    if (user) {
      if (!existingParticipants.includes(user.id)) {
        return res
          .status(400)
          .json({ message: "User is not a participant in the room" });
      }

      const updatedParticipants = existingParticipants.filter(
        (userId) => userId === user.id,
      );

      const updatedRoom = await prisma.room.update({
        where: {
          customId,
        },
        data: {
          participants: {
            disconnect: updatedParticipants.map((userId) => ({ id: userId })),
          },
        },
      });

      return res.status(200).json({
        message: "User left the room successfully",
        room: updatedRoom,
      });
    }

    return res.status(400).json({ message: "User not authenticated" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Error with leaving the room",
      error: err,
    });
  }
};
