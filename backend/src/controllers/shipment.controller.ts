import { Request, Response } from "express";
import { createShipmentSchema, updateShipmentStatusSchema } from "../schemas/shipment.schema";
import { shipmentService } from "../services/shipment.service";

export const createShipment = async (req: Request, res: Response) => {
  const parsed = createShipmentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
  const shipment = await shipmentService.create(parsed.data);
  return res.status(201).json({ message: "Shipment created", data: shipment });
};

export const listShipments = async (_req: Request, res: Response) => {
  const shipments = await shipmentService.list();
  return res.json({ data: shipments, total: shipments.length });
};

export const getShipment = async (req: Request, res: Response) => {
  const shipment = await shipmentService.get(String(req.params.id));
  return res.json({ data: shipment });
};

export const updateShipmentStatus = async (req: Request, res: Response) => {
  const parsed = updateShipmentStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });

  const shipment = await shipmentService.updateStatus(String(req.params.id), parsed.data.status);
  const io = req.app.get("io");
  if (io) {
    io.emit("shipment_status_changed", {
      shipmentId: shipment.id,
      status: shipment.status
    });
  }
  return res.json({ message: "Shipment status updated", data: shipment });
};
