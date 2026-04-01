import { Router } from "express";
import { verifyToken } from "../utils/auth.utils";
import * as appointmentController from "../controllers/appointment.controller";

const router = Router();

// Protected
router.post("/", verifyToken, appointmentController.createAppointment);
router.get("/", verifyToken, appointmentController.getAppointments);
router.get("/byDate", verifyToken, appointmentController.getAppointmentsByDate);
router.get("/:id", verifyToken, appointmentController.getAppointmentById);
router.put("/:id/refund", verifyToken, appointmentController.requestRefund);
router.put("/:id/status", verifyToken, appointmentController.updateStatus);
router.put("/:id/approve-refund", verifyToken, appointmentController.approveRefund);
router.put("/:id/reject-refund", verifyToken, appointmentController.rejectRefund);
router.put("/:id/cancel", verifyToken, appointmentController.cancelAppointment);
router.put("/:id/pay-fine", verifyToken, appointmentController.payFine);

export default router;
