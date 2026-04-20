import express from "express";
import userRouter from "./routes/user.routes";
import hospitalRouter from "./routes/hospital.routes";
import contactRouter from "./routes/contact.routes";
import specialityRouter from "./routes/speciality.routes";
import appointmentRouter from "./routes/appointment.routes";
import ratingRouter from "./routes/ratings.routes";

import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { CLIENT_URL, JWT_SECRET } from "./utils/constants.utils";

// Validate required environment variables on startup
if (!JWT_SECRET) {
    console.error("FATAL: JWT_SECRET environment variable is not set.");
    process.exit(1);
}

const app = express();

// Security headers
app.use(helmet());

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts per window
    message: { error: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(
    cors({
        origin: `${CLIENT_URL}`,
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    })
);

app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
    res.send("API is running...");
});

// Apply rate limiting to auth-related routes
app.use("/api/users/login", authLimiter);
app.use("/api/users/register", authLimiter);
app.use("/api/users/forgotpassword", authLimiter);
app.use("/api/hospitals/login", authLimiter);
app.use("/api/hospitals/register", authLimiter);
app.use("/api/hospitals/forgotpassword", authLimiter);

app.use("/api/users", userRouter);
app.use("/api/hospitals", hospitalRouter);
app.use("/api/contact", contactRouter);
app.use("/api/speciality", specialityRouter);
app.use('/api/appointments', appointmentRouter);
app.use("/api/ratings", ratingRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
