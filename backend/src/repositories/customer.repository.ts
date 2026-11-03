import { prisma } from "../config/prisma";

export const customerRepository = {
  create: (data: any) => prisma.customer.create({ data }),

  findAll: (search: string, skip: number, take: number) =>
    prisma.customer.findMany({
      where: {
        isActive: true,
        OR: search ? [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { company: { contains: search, mode: "insensitive" } }
        ] : undefined
      },
      include: { _count: { select: { shipments: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take
    }),

  count: (search: string) =>
    prisma.customer.count({
      where: {
        isActive: true,
        OR: search ? [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { company: { contains: search, mode: "insensitive" } }
        ] : undefined
      }
    }),

  findById: (id: string) =>
    prisma.customer.findFirst({ where: { id, isActive: true } }),

  update: (id: string, data: any) =>
    prisma.customer.update({ where: { id }, data }),

  softDelete: (id: string) =>
    prisma.customer.update({
      where: { id },
      data: { isActive: false }
    })
};
