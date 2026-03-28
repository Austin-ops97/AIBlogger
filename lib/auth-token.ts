import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET =
  process.env.JWT_SECRET || "aiblogger-dev-secret-change-in-production";
export const COOKIE_NAME = "aiblogger_token";

export interface AuthUser {
  username: string;
  role: string;
}

function secretKey() {
  return new TextEncoder().encode(JWT_SECRET);
}

export async function createToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    username: user.username,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const username = payload.username;
    const role = payload.role;
    if (typeof username !== "string" || typeof role !== "string") return null;
    return { username, role };
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}
