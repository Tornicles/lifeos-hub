import type { NextFunction, Request, Response } from "express";
import { ensureProfile } from "../lib/ensureProfile";

export async function ensureProfileMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    await ensureProfile(req.userId);
    next();
  } catch (err) {
    req.log.error({ err }, "Failed to ensure profile");
    res.status(500).json({ error: "Failed to load user profile" });
  }
}
