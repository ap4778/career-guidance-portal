import jwt from "jsonwebtoken";
import { pool } from "../config/database.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";

export const cookieOptions = {
  httpOnly: true,
  secure: env.cookieSecure || env.nodeEnv === "production",
  sameSite: env.cookieSecure || env.nodeEnv === "production" ? "none" : "lax",
  path: "/api",
  maxAge: 2 * 60 * 60 * 1000,
};

export function validateRequestOrigin(request, _response, next) {
  const origin = request.get("origin");
  const allowedOrigins = env.frontendOrigin.split(",").map((value) => value.trim());
  if (origin && !allowedOrigins.includes(origin)) {
    return next(new HttpError(403, "This request origin is not allowed.", "INVALID_ORIGIN"));
  }
  return next();
}

export async function requireAuth(request, _response, next) {
  try {
    const token = request.cookies?.careerpath_session;
    if (!token) throw new HttpError(401, "Sign in to continue.", "UNAUTHENTICATED");
    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch {
      throw new HttpError(401, "Your session expired. Please sign in again.", "SESSION_EXPIRED");
    }
    const [rows] = await pool.execute(
      "SELECT id, full_name, email, role, is_active FROM users WHERE id = ? LIMIT 1",
      [payload.sub],
    );
    const user = rows[0];
    if (!user || !user.is_active) throw new HttpError(401, "This account is not available.", "ACCOUNT_DISABLED");
    request.user = { id: user.id, name: user.full_name, email: user.email, role: user.role };
    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireRole(...roles) {
  return (request, _response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return next(new HttpError(403, "You do not have permission to perform this action.", "FORBIDDEN"));
    }
    return next();
  };
}
