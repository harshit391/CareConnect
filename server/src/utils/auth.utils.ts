import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./constants.utils";
import { NextFunction, Request, Response } from "express";

declare module "express-serve-static-core" {
    interface Request {
        idFromToken?: string;
    }
}

export const encryptPassword = async (password: string) => {
    let encryptPassword = null;

    if (password) {
        const salt = await bcrypt.genSalt(10);
        encryptPassword = await bcrypt.hash(password, salt);
    }

    return encryptPassword;
};

export const comparePassword = async (password: string, hash: string) => {
    return await bcrypt.compare(password, hash);
};

export const generateToken = async (payload: any) => {
    return jwt.sign(payload, JWT_SECRET as string, {
        expiresIn: "30d",
    });
};

export const verifyToken = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers["authorization"] as string | undefined;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).send({ error: "Unauthorized" });
        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        const decodedAuthToken = jwt.verify(token, JWT_SECRET as string);
        req.idFromToken =
            (decodedAuthToken as jwt.JwtPayload).userId ||
            (decodedAuthToken as jwt.JwtPayload).id;
        next();
    } catch (error) {
        console.error("Error in verifying token: ", error);
        res.status(401).send({ message: "Invalid Credentials" });
    }
};
