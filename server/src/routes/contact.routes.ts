import { Router } from "express";
import * as contactController from "../controllers/contact.controller";

const router = Router();

// Public
router.get("/", contactController.getAllFeedback);
router.post("/", contactController.createFeedback);

export default router;
