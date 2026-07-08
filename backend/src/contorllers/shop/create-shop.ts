import { HashPassword } from "@/libs/password-utils";
import Shop from "@/models/shop";
import type { Request, Response, NextFunction } from "express";

interface CreateShop {
  name: string;
  accounts: string[];
  password: string;
  banner?: string;
}

export const CreateShop = async (
  req: Request<{}, {}, CreateShop>,
  res: Response,
  _next: NextFunction,
) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        error: "User is not logged in",
      });
    }

    if (req.user.role != "admin") {
      return res.status(403).json({
        error: "User is not an admin",
      });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ error: "Request body is missing or empty" });
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
    res.status(500).json({
      message: "Error unexpected error has occured",
    });
  }
};
