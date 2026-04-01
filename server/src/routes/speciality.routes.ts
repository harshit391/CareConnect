import { Router } from "express";
import { verifyToken } from "../utils/auth.utils";
import * as specialityController from "../controllers/speciality.controller";

const router = Router();

// Protected routes
router.get("/", verifyToken, specialityController.getAllSpecialities);
router.get("/test", verifyToken, specialityController.getSpecialityIds);
router.get("/top", verifyToken, specialityController.getTopSpecialities);
router.get("/doctor/:id", verifyToken, specialityController.getDoctorSpecialities);
router.get("/:id", verifyToken, specialityController.getSpecialityById);

router.post("/", verifyToken, specialityController.createSpecialities);

router.put("/doctor/:id", verifyToken, specialityController.assignSpecialityToDoctor);
router.put("/doctors/bulk-specialities", verifyToken, specialityController.bulkAssignSpecialities);

router.delete("/doctor/:id", verifyToken, specialityController.removeSpecialityFromDoctor);

export default router;
