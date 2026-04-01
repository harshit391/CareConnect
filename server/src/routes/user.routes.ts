import { Router } from "express";
import { verifyToken } from "../utils/auth.utils";
import * as userController from "../controllers/user.controller";

const router = Router();

// Public routes
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/verify", userController.verifyTokenEndpoint);
router.post("/forgotpassword", userController.forgotPassword);
router.post("/verify-reset-code", userController.verifyResetCode);
router.put("/resetpassword", userController.resetPassword);

// Protected routes
router.get("/", verifyToken, userController.getAllUsers);
router.get("/:id", verifyToken, userController.getUserById);
router.post("/email/:id", verifyToken, userController.sendEmail);
router.post("/verify/:id", verifyToken, userController.verifyEmail);
router.post("/location", verifyToken, userController.updateLocation);
router.put("/:id", verifyToken, userController.updateUser);
router.delete("/:id", verifyToken, userController.deleteUser);

export default router;
