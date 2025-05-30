import express from "express";
import userRouter from "./routes/user.routes";
import hospitalRouter from "./routes/hospital.routes";
import contactRouter from "./routes/contact.routes";
import specialityRouter from "./routes/speciality.routes";
import appointmentRouter from "./routes/appointment.routes";
import ratingRouter from "./routes/ratings.routes";

import { PrismaClient } from "@prisma/client";
import cors from "cors";
import { CLIENT_URL } from "./utils/constants.utils";

const app = express();

const prisma = new PrismaClient();

app.use(
    cors({
        origin: `${CLIENT_URL}`,
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    })
);

app.use(express.json());

app.get("/", (req, res) => {
    res.send("API is running...");
});

app.use("/api/users", userRouter);
app.use("/api/hospitals", hospitalRouter);
app.use("/api/contact", contactRouter);
app.use("/api/speciality", specialityRouter);
app.use('/api/appointments', appointmentRouter);
app.use("/api/ratings", ratingRouter);

app.get("/reset", async (req, res) => {
    // Reset the database

    await prisma.user.deleteMany({});
    await prisma.hospital.deleteMany({});

    res.status(200).send({ message: "Database reset" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
