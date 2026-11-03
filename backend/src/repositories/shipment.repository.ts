import { prisma } from "../config/prisma";

export const shipmentRepository = {
  create: (data: any) => prisma.shipment.create({
    data,
    include: { customer: true }
  }),
  findAll: () => prisma.shipment.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" }
  }),
  findById: (id: string) => prisma.shipment.findUnique({
    where: { id },
    include: { customer: true }
  }),
  updateStatus: (id: string, status: any) => prisma.shipment.update({
    where: { id },
    data: { status },
    include: { customer: true }
  })
};
