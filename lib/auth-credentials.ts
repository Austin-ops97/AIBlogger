import bcrypt from "bcryptjs";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "austin";
const ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync("admin123", 10);

export function verifyCredentials(username: string, password: string): boolean {
  if (username !== ADMIN_USERNAME) return false;
  if (process.env.ADMIN_PASSWORD_HASH) {
    return bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
  }
  return password === "admin123";
}
