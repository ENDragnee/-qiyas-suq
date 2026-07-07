import type { Request, Response, NextFunction } from "express";
import { HashPassword } from "../../libs/password-utils";
import User from "@/models/user";

export async function Signup(req: Request, res: Response, next: NextFunction) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "Request body is missing or empty" });
  }
  const { name, userName, password } = req.body;

  const hashedPassowrd = await HashPassword(password);

  const newUser = await User.create({
    name,
    userName,
    password: hashedPassowrd,
  });

  res.status(201).json({
    message: "User created successfully",
    data: newUser,
  });
}
