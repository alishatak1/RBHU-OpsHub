import { Router } from "express";
import {
  setupAdmin,
  loginAdmin,
  getCurrentAdmin
} from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.post("/setup", setupAdmin);
router.post("/login", loginAdmin);
router.get("/me", authenticateToken, getCurrentAdmin);

export default router;
