import { authenticateToken } from "../middleware/auth.middleware";
import { Router } from "express";
import {
  createCustomer, listCustomers, getCustomer, updateCustomer, deleteCustomer
} from "../controllers/customer.controller";

const router = Router();
router.use(authenticateToken);

router.post("/", createCustomer);
router.get("/", listCustomers);
router.get("/:id", getCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

export default router;

