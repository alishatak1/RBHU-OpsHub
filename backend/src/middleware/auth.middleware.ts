import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface TokenPayload {
  adminId: string;
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  if (!token) {
    res.status(401).json({ message: "Authentication token required" });
    return;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ message: "Authentication is not configured" });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;

    if (!decoded.adminId) {
      res.status(401).json({ message: "Invalid authentication token" });
      return;
    }

    res.locals.adminId = decoded.adminId;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired authentication token" });
  }
};
