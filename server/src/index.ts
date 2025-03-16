import express from "express";
import userRouter from "./routes/user.routes";
import { PrismaClient } from "@prisma/client";

const app = express();

const prisma = new PrismaClient();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("API is running...");
});

app.use("/api/users", userRouter);

app.get("/reset", async (req, res) => {
    // Reset the database

    await prisma.user.deleteMany({});
    await prisma.location.deleteMany({});

    res.status(200).send({ message: "Database reset" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
