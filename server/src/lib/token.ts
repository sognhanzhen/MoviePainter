import jwt from "jsonwebtoken";

export function createToken(userId: number, secret: string) {
  return jwt.sign({ userId }, secret, { expiresIn: "7d" });
}

export function verifyToken(token: string, secret: string) {
  return jwt.verify(token, secret) as { userId: number };
}
