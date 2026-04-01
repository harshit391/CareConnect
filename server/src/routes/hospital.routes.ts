import { Router } from "express";
import { verifyToken } from "../utils/auth.utils";
import * as hospitalController from "../controllers/hospital.controller";

const router = Router();

// Public routes
router.post("/register", hospitalController.register);
router.post("/login", hospitalController.login);
router.post("/forgotpassword", hospitalController.forgotPassword);
router.post("/verify-reset-code", hospitalController.verifyResetCode);
router.put("/resetpassword", hospitalController.resetPassword);

// Protected routes
router.get("/", verifyToken, hospitalController.getAllHospitals);
router.get("/top", verifyToken, hospitalController.getTopHospitals);
router.get("/doctors", verifyToken, hospitalController.getDoctors);
router.get("/doc", verifyToken, hospitalController.getDoctorIds);
router.get("/documents/:id", verifyToken, hospitalController.getDocuments);
router.get("/:id/timings", verifyToken, hospitalController.getTimings);
router.get("/:id", verifyToken, hospitalController.getHospitalById);

router.post("/email/:id", verifyToken, hospitalController.sendEmail);
router.post("/verify/:id", verifyToken, hospitalController.verifyEmail);
router.post("/bulk-register", verifyToken, hospitalController.bulkRegister);
router.post("/register/bulk", verifyToken, hospitalController.bulkRegisterAlt);
router.post("/documents/:id", verifyToken, hospitalController.createDocument);
router.post("/location", verifyToken, hospitalController.updateLocation);

router.put("/date/:id", verifyToken, hospitalController.updateFreeSlotDate);
router.put("/approve/:id", verifyToken, hospitalController.approveHospital);
router.put("/reject/:id", verifyToken, hospitalController.rejectHospital);
router.put("/date", verifyToken, hospitalController.updateFreeSlotDateByBody);
router.put("/:id/timings", verifyToken, hospitalController.updateTimings);
router.put("/:id", verifyToken, hospitalController.updateHospital);

router.delete("/:id", verifyToken, hospitalController.deleteHospital);
router.delete("/documents/:id", verifyToken, hospitalController.deleteDocument);

export default router;
