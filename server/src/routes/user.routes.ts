import { PrismaClient, User } from "@prisma/client";
import { Router, Request, Response } from "express";
import {
    comparePassword,
    encryptPassword,
    generateToken,
} from "../utils/auth.utils";
import { JWT_SECRET } from "../utils/constants.utils";
import jwt from "jsonwebtoken";
import { sendError } from "../utils/error.util";
import { Decimal } from "@prisma/client/runtime/library";
import { reqE, reqER, reqS } from "../utils/logger.utils";
import { sendVerificationEmail, sendWelcomeEmail } from "../mailtrap/emails";

const prisma = new PrismaClient();

const router = Router();

router.get("/", async (req, res) => {
    reqS("get all users");

    try {
        const users = await prisma.user.findMany({});

        console.log("Users := ", users);

        res.status(200).send(users);
    } catch (error) {
        reqER(error as Error);

        sendError(res, error as Error);
    }

    reqE();
});

router.get("/reset", async (req, res) => {
    reqS("reset database");

    try {
        await prisma.user.deleteMany({});
        res.status(200).send({ message: "Database reset" });
    } catch (error) {
        reqER(error as Error);

        res.status(500).send({ error: "Something went wrong" });
    }

    reqE();
});

router.get("/:id", async (req, res) => {
    reqS("get user by id");

    const { id } = req.params;

    console.log("ID := ", id);

    try {
        const user = await prisma.user.findUnique({
            where: { id: id },
            include: {
                appointments: {
                    include: {
                        Hospital: true,
                    },
                },
                ratings: true,
            },
        });

        console.log("User := ", user);

        res.status(200).send({ ...user, role: "PATIENT" });
    } catch (error) {
        reqER(error as Error);

        res.status(500).send({ error: "Something went wrong" });
    }

    reqE();
});

router.post("/register", async (req: Request, res: Response): Promise<void> => {
    reqS("register user");

    try {
        const userData = { ...req.body };

        console.log("User Data := ", userData);

        if (!userData.longitude || !userData.latitude) {
            throw new Error("Longitude and Latitude are required.");
        }

        if (!userData.password) {
            throw new Error("Password is required.");
        }

        if (!userData.confirmPassword) {
            throw new Error("Confirm Password is required.");
        }

        if (userData.password !== userData.confirmPassword) {
            throw new Error("Passwords do not match.");
        }

        if (!userData.phone || !userData.email) {
            throw new Error("Both Phone and Email are required.");
        }

        const longitude = new Decimal(userData.longitude);
        const latitude = new Decimal(userData.latitude);

        console.log("Latitude := ", latitude);
        console.log("Longitude := ", longitude);

        delete userData.longitude;
        delete userData.latitude;

        const newUserData = {
            ...userData,
            currLocation: {
                longitude: longitude,
                latitude: latitude,
            },
        };

        const encPass = await encryptPassword(newUserData.password);

        if (!encPass) {
            res.status(500).send({ error: "Error in Password Encryption" });
            return;
        }
        newUserData.password = encPass;
        delete newUserData.confirmPassword;

        const user = await prisma.user.create({
            data: {
                ...newUserData,
            },
        });

        console.log("Created User :=", user);

        const token = await generateToken({ userId: user.id });

        console.log("Generated Token :=", token);

        res.status(201).send({ user, token });
    } catch (error) {
        reqER(error as Error);

        sendError(res, error as Error);
    }

    reqE();
});

router.post("/login", async (req, res) => {
    reqS("login user");

    try {
        const { email, phone, password, longitude, latitude } = req.body;

        if (!phone && !email) {
            res.status(400).json({
                error: "At least one of Phone or Email is required",
            });
            return;
        }

        if (!password) {
            res.status(400).json({ error: "Password is required" });
            return;
        }

        if (longitude === undefined || latitude === undefined) {
            res.status(400).json({
                error: "Latitude and Longitude are required",
            });
            return;
        }

        const longDecimal = new Decimal(longitude);
        const latDecimal = new Decimal(latitude);

        console.log("Email:", email);
        console.log("Password:", password);
        console.log("Latitude:", latDecimal);
        console.log("Longitude:", longDecimal);

        // Find user by email or phone
        let user = null;

        if (!email || email.trim() === "") {
            user = await prisma.user.findFirst({ where: { phone } });
        } else {
            user = await prisma.user.findFirst({ where: { email } });
        }

        console.log("User:", user);

        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        const isMatch = await comparePassword(password, user.password);

        if (!isMatch) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                currLocation: {
                    longitude: longDecimal,
                    latitude: latDecimal,
                },
            },
        });

        const token = await generateToken({ id: user.id });

        console.log("Generated Token:", token);

        res.status(200).json({ token, user });
    } catch (error) {
        reqS("error");
        reqER(error as Error);
        console.error("Error in /login:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }

    reqE();
});

router.post("/email/:id", async (req, res) => {
    reqS("send email");

    try {
        const { id } = req.params;

        console.log("ID := ", id);

        const user = await prisma.user.findUnique({
            where: { id: id },
        });

        console.log("User := ", user);

        if (!user) {
            throw new Error("User not found");
        }

        // Create a random 6 digit verification code as string
        const verificationCode =
            Math.floor(100000 + Math.random() * 900000) + "";

        const updatedUser = await prisma.user.update({
            where: { id: id },
            data: { verificationCode: verificationCode },
        });

        console.log("Verification Code := ", verificationCode);
        console.log("Updated User := ", updatedUser);

        await sendVerificationEmail(user.email, verificationCode);

        res.status(200).send({ message: "Email sent" });
    } catch (error) {
        reqER(error as Error);

        sendError(res, error as Error);
    }

    reqE();
});

router.post("/verify/:id", async (req, res) => {
    reqS("email verify");

    try {
        const { code } = req.body;

        const { id } = req.params;

        console.log("Id := ", id);

        const user = await prisma.user.findUnique({
            where: { id: id },
        });

        console.log("User := ", user);

        if (!user) {
            throw new Error("User not found");
        }

        if (user.verificationCode !== code) {
            await prisma.user.delete({
                where: { id: id },
            });

            throw new Error("Invalid Verification Code");
        }

        await prisma.user.update({
            where: { id: id },
            data: { isVerified: true, verificationCode: null },
        });

        await sendWelcomeEmail(user.email, user.name);

        const token = await generateToken({ userId: user.id });

        console.log("Generated Token :=", token);

        res.status(200).send({ token });
    } catch (error) {
        reqER(error as Error);

        sendError(res, error as Error);
    }

    reqE();
});

router.post("/forgotpassword", async (req, res) => {
    // Recieve an email and send a 6 digit code to the email
    reqS("forgot password");

    try {
        const { email } = req.body;

        console.log("Email := ", email);

        const user = await prisma.user.findUnique({
            where: { email: email },
        });

        console.log("User := ", user);

        if (!user) {
            throw new Error("User not found");
        }

        // Create a random 6 digit verification code as string
        const verificationCode =
            Math.floor(100000 + Math.random() * 900000) + "";

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { verificationCode: verificationCode },
        });

        console.log("Verification Code := ", verificationCode);
        console.log("Updated User := ", updatedUser);

        await sendVerificationEmail(user.email, verificationCode);

        res.status(200).send({ message: "Email sent" });
    } catch (error) {
        reqER(error as Error);

        sendError(res, error as Error);
    }
});

router.post("/verify-reset-code", async (req, res) => {
    // Recieve an email and send a 6 digit code to the email
    reqS("verify reset code");

    try {
        const { code, email } = req.body;

        console.log("Code := ", code);
        console.log("Email := ", email);

        const user = await prisma.user.findUnique({
            where: { email: email },
        });

        console.log("User := ", user);

        if (!user) {
            throw new Error("User not found");
        }

        if (user.verificationCode !== code) {
            throw new Error("Invalid Verification Code");
        }

        const resetToken = await generateToken({ userId: user.id });
        console.log("Generated Reset Token :=", resetToken);

        res.status(200).send({ message: "Code verified", resetToken });
    } catch (error) {
        reqER(error as Error);

        sendError(res, error as Error);
    }
});

router.post("/verify", async (req, res) => {
    reqS("verify user");

    try {
        const { token } = req.body;

        console.log("Token := ", token);

        const decodedAuthToken = jwt.verify(token, JWT_SECRET as string);

        console.log("ID := ", decodedAuthToken);

        if (!decodedAuthToken || typeof decodedAuthToken !== "object") {
            throw new Error("Invalid Token");
        }

        const user = await prisma.user.findUnique({
            where: {
                id:
                    (decodedAuthToken as jwt.JwtPayload).userId ||
                    (decodedAuthToken as jwt.JwtPayload).id,
            },
        });

        const hopital = await prisma.hospital.findUnique({
            where: {
                id:
                    (decodedAuthToken as jwt.JwtPayload).userId ||
                    (decodedAuthToken as jwt.JwtPayload).id,
            },
        });

        console.log("User := ", user);
        console.log("Hospital := ", hopital);

        if (!user && !hopital) {
            throw new Error("User not found");
        }

        if (user)
            res.status(200).send({
                ok: "Valid Token",
                role: user.role,
                user,
            });
        else if (hopital)
            res.status(200).send({
                ok: "Valid Token",
                role: hopital.parentId ? "DOCTOR" : "HOSPITAL",
                hospital: hopital,
            });
        else {
            res.status(401).send({ error: "Invalid Token" });
        }
    } catch (error) {
        reqER(error as Error);

        sendError(res, error as Error);
    }

    reqE();
});

router.post("/location", async (req, res) => {
    try {
        const { id, longitude, latitude } = req.body;

        console.log("ID := ", id);

        console.log("Longitude := ", longitude);

        console.log("Latitude := ", latitude);

        const user = await prisma.user.findUnique({
            where: { id: id },
        });

        console.log("User := ", user);

        if (!user) {
            throw new Error("User not found");
        }

        const longDecimal = new Decimal(longitude);
        const latDecimal = new Decimal(latitude);

        await prisma.user.update({
            where: { id: id },
            data: {
                currLocation: { longitude: longDecimal, latitude: latDecimal },
            },
        });

        console.log("User Location Updated :=", user.id);

        res.status(200).send({ message: "Location Updated" });
    } catch (error) {
        reqER(error as Error);

        sendError(res, error as Error);
    }
});

router.put("/resetpassword", async (req, res) => {
    reqS("reset password");

    try {
        const { email, password } = req.body;

        console.log("Email := ", email);

        const user = await prisma.user.findUnique({
            where: { email: email },
        });

        console.log("User := ", user);

        if (!user) {
            throw new Error("User not found");
        }

        console.log("Password := ", password);

        const encPass = await encryptPassword(password);
        if (!encPass) {
            throw new Error("Error in Password Encryption");
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { password: encPass },
        });

        console.log("Updated User :=", updatedUser);

        res.status(200).send(updatedUser);
    } catch (error) {
        reqER(error as Error);

        sendError(res, error as Error);
    }

    reqE();
});

router.put("/:id", async (req, res) => {
    reqS("update user");

    try {
        const { id } = req.params;

        console.log("ID := ", id);

        const user = prisma.user.findFirst({
            where: { id: id },
        });

        console.log("User := ", user);

        if (!user) {
            throw new Error("User not found");
        }

        const userData: User = { ...req.body };

        console.log("User Data := ", userData);

        const token = await generateToken({ userId: userData.id });

        console.log("Generated Token :=", token);

        res.status(201).send({ user, token });
    } catch (error) {
        reqER(error as Error);

        sendError(res, error as Error);
    }

    reqE();
});

router.delete("/:id", async (req, res) => {
    reqS("delete user");

    try {
        const { id } = req.params;

        console.log("ID := ", id);

        await prisma.appointment.deleteMany({ where: { userId: id } });
        await prisma.ratings.deleteMany({ where: { userId: id } });

        console.log("All Related Data Deleted");

        const deletedUser = await prisma.user.delete({
            where: { id },
        });

        console.log("Deleted User :=", deletedUser);

        console.log("Location Deleted");

        res.status(200).send({ message: "User deleted" });
    } catch (error) {
        reqER(error as Error);

        sendError(res, error as Error);
    }

    reqE();
});

export default router;
