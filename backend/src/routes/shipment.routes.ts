import { authenticateToken } from "../middleware/auth.middleware";
import { Router } from "express";
import {
  createShipment, listShipments, getShipment, updateShipmentStatus
} from "../controllers/shipment.controller";

const router = Router();
router.use(authenticateToken);

router.post("/", createShipment);
router.get("/", listShipments);
router.get("/:id", getShipment);
router.patch("/:id/status", updateShipmentStatus);

export default router;

