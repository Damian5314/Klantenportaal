import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/apiError";
import { AccessTokenPayload, verifyAccessToken } from "@/utils/tokens";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Missing bearer token"));
  }
  const token = header.slice("Bearer ".length);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired token"));
  }
}

export function requirePermission(...permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    const hasAll = permissions.every((p) => req.user!.permissions.includes(p));
    if (!hasAll) return next(ApiError.forbidden("Insufficient permissions"));
    next();
  };
}

export function requireStaff(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(ApiError.unauthorized());
  if (req.user.kind !== "STAFF") return next(ApiError.forbidden("Staff only"));
  next();
}
