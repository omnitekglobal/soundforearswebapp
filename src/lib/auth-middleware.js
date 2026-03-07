import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "sfe_session";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET || "dev-insecure-auth-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function getSessionFromRequest(request) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      userId: payload.userId,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

