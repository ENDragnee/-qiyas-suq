import { HashPassword } from "@/libs/password-utils";
import Shop from "@/models/shop";
import type { Request, Response, NextFunction } from "express";
import type { CreateShopInput } from "@/schemas/shop.schema";

export const CreateShop = async (
  req: Request<{}, {}, CreateShopInput["body"]>,
  res: Response,
  _next: NextFunction,
) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({
        error: "User is not logged in",
      });
    }

    if (req.user.role != "admin") {
      return res.status(403).json({
        error: "User is not an admin",
      });
    }

    const { name, accounts, password, banner } = req.body;
    const hashedPassword: string = await HashPassword(password);

    const createShop = await Shop.create({
      name,
      accounts,
      password: hashedPassword,
      banner,
    });

    if (!createShop) {
      return res.status(500).json({
        message: "Failed to create shop",
      });
    }

    return res.status(201).json({
      message: "Successfuly create shop",
      data: createShop,
    });
  } catch (err) {
    if (Bun.env.ENVIRONMENT === "production") {
      return res.status(500).json({
        message: "Unexpected error has occured",
      });
    }

    return res.status(500).json({
      message: "Unexpected error has occured",
      data: err,
    });
  }
};
