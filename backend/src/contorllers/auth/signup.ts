import type { Request, Response, NextFunction } from "express";
import { HashPassword, ValidatePassword } from "../../libs/password-utils";
import User from "@/models/user";
import Shop from "@/models/shop";
import { Types } from "mongoose";

interface CreateUser {
  name: string;
  userName: string;
  password: string;
  role: "user" | "admin";
  shop: {
    shopId: string;
    password: string;
  };
}

export async function Signup(
  req: Request<{}, {}, CreateUser>,
  res: Response,
  _next: NextFunction,
) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "Request body is missing or empty" });
  }
  const { name, userName, password, shop } = req.body;
  const hashedPassowrd = await HashPassword(password);

  const shopDb = await Shop.findById(shop.shopId);
  if (!shopDb || shopDb.password == null) {
    return res.status(404).json({
      message: "Shop is not found",
    });
  }

  const validateShop = await ValidatePassword(shop.password, shopDb.password);

  if (!validateShop) {
    return res.status(401).json({
      message: "The shop is not valid",
    });
  }

  const newUser = await User.create({
    name,
    userName,
    password: hashedPassowrd,
    role: "user",
    shopId: shop.shopId as any,
  });

  res.status(201).json({
    message: "User created successfully",
    data: newUser,
  });
}
