import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import type { LocalDatabase } from "../lib/local-database.js";
import { createToken } from "../lib/token.js";

const registerSchema = z.object({
  name: z.string().min(2, "用户名至少 2 个字符"),
  email: z.email("请输入有效邮箱").transform((value) => value.toLowerCase()),
  password: z.string().min(6, "密码至少 6 位")
});

const loginSchema = z.object({
  email: z.email("请输入有效邮箱").transform((value) => value.toLowerCase()),
  password: z.string().min(6, "密码至少 6 位")
});

type CreateAuthRouterInput = {
  database: LocalDatabase;
  jwtSecret: string;
};

export function createAuthRouter({ database, jwtSecret }: CreateAuthRouterInput) {
  const router = Router();

  router.post("/auth/register", async (req, res) => {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({ message: result.error.issues[0]?.message ?? "请求参数不合法" });
      return;
    }

    const { name, email, password } = result.data;
    const existingUser = database.findUserByEmail(email);

    if (existingUser) {
      res.status(409).json({ message: "该邮箱已经注册" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = database.createUser({
      email,
      hashedPassword,
      name
    });

    res.status(201).json({
      token: createToken(user.id, jwtSecret),
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  });

  router.post("/auth/login", async (req, res) => {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({ message: result.error.issues[0]?.message ?? "请求参数不合法" });
      return;
    }

    const { email, password } = result.data;
    const user = database.findUserByEmail(email);

    if (!user) {
      res.status(401).json({ message: "账号或密码错误" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ message: "账号或密码错误" });
      return;
    }

    res.json({
      token: createToken(user.id, jwtSecret),
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  });

  return router;
}
