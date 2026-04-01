import { Request, Response } from "express";
import prisma from "../prisma";

export const getAllFeedback = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const messages = await prisma.feedback.findMany();
        res.status(200).send(messages);
    } catch (error) {
        res.status(500).send({ error: "Something went wrong" });
    }
};

export const createFeedback = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { name, email, phone, message } = req.body;

        const currMessage = await prisma.feedback.create({
            data: {
                name,
                email,
                phone,
                message,
            },
        });

        res.status(201).send(currMessage);
    } catch (error) {
        res.status(500).send({ error: "Something went wrong" });
    }
};
