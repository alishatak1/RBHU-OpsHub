import { Request, Response } from "express";
import { createCustomerSchema, updateCustomerSchema } from "../schemas/customer.schema";
import { customerService } from "../services/customer.service";

export const createCustomer = async (req: Request, res: Response) => {
  const parsed = createCustomerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
  const customer = await customerService.create(parsed.data);
  return res.status(201).json({ message: "Customer created", data: customer });
};

export const listCustomers = async (req: Request, res: Response) => {
  const search = String(req.query.search ?? "");
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
  const result = await customerService.list(search, page, limit);
  return res.json(result);
};

export const getCustomer = async (req: Request, res: Response) => {
  const customer = await customerService.get(String(req.params.id));
  return res.json({ data: customer });
};

export const updateCustomer = async (req: Request, res: Response) => {
  const parsed = updateCustomerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
  const customer = await customerService.update(String(req.params.id), parsed.data);
  return res.json({ message: "Customer updated", data: customer });
};

export const deleteCustomer = async (req: Request, res: Response) => {
  await customerService.remove(String(req.params.id));
  return res.json({ message: "Customer deactivated successfully" });
};
