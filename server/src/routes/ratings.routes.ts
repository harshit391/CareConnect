import { Router } from "express";
import { verifyToken } from "../utils/auth.utils";
import * as ratingsController from "../controllers/ratings.controller";

const router = Router();

// Protected
router.post("/", verifyToken, ratingsController.createOrUpdateRating);

export default router;
