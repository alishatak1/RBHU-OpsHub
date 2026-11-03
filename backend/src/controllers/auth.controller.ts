import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../config/prisma";

const setupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(12).max(128)
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128)
});

function createToken(adminId: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");

  return jwt.sign({ adminId }, secret, { expiresIn: "8h" });
}

export const setupAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = setupSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid administrator details",
        errors: parsed.error.flatten()
      });
      return;
    }

    const existingAdmin = await prisma.admin.findFirst();

    if (existingAdmin) {
      res.status(403).json({
        message: "Administrator setup is already complete"
      });
      return;
    }

    const email = parsed.data.email.toLowerCase();
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const admin = await prisma.admin.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    res.status(201).json({
      message: "Administrator created successfully",
      admin,
      token: createToken(admin.id)
    });
  } catch (error) {
    next(error);
  }
};

export const loginAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ message: "Invalid email or password" });
      return;
    }

    const email = parsed.data.email.toLowerCase();

    const admin = await prisma.admin.findUnique({
      where: { email }
    });

    if (!admin || !admin.isActive) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const passwordMatches = await bcrypt.compare(
      parsed.data.password,
      admin.passwordHash
    );

    if (!passwordMatches) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    res.json({
      message: "Login successful",
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email
      },
      token: createToken(admin.id)
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = res.locals.adminId as string;

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true
      }
    });

    if (!admin || !admin.isActive) {
      res.status(401).json({ message: "Administrator not found or inactive" });
      return;
    }

    res.json({ admin });
  } catch (error) {
    next(error);
  }
};
