import type { Request, Response, NextFunction } from "express";
import type { CreateItemInput } from "@/schemas/item.schema";
import Item from "@/models/item";

export const CreateItem = async (
  req: Request<{}, {}, CreateItemInput["body"]>,
  res: Response,
  _next: NextFunction,
) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({
        error: "User is not logged in",
      });
    }

    const { name, image, price, stock, description } = req.body;
    const { shopId } = req.user;

    const createItem = await Item.create({
      name,
      ...(image && { image }),
      price,
      stock,
      ...(description && { description }),
      shopId,
    });

    if (!createItem) {
      return res.status(500).json({
        message: "Failed to create item",
      });
    }

    return res.status(201).json({
      message: "Successfuly create item",
      data: createItem,
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
