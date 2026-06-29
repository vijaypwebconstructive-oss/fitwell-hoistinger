import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.sendStatus(401);
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not set");
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.sendStatus(401);
  }
}
