import { z } from "zod";

export const createShipmentSchema = z.object({
  trackingNumber: z.string().min(3),
  origin: z.string().min(2),
  destination: z.string().min(2),
  customerId: z.string().uuid()
});

export const updateShipmentStatusSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "IN_TRANSIT", "DELIVERED", "CANCELLED"])
});
