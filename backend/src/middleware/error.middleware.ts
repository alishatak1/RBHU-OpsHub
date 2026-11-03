import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("API error:", error);

  if (error.code === "P2002") {
    return res.status(409).json({
      message: "A record with this value already exists"
    });
  }

  if (error.code === "P2003") {
    return res.status(400).json({
      message: "Invalid reference: the related customer does not exist"
    });
  }

  if (error.code === "P2025") {
    return res.status(404).json({
      message: "Record not found"
    });
  }

  const status = error.statusCode || 500;

  return res.status(status).json({
    message: status === 500 ? "Internal server error" : error.message
  });
};
