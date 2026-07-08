import type { Request, Response, NextFunction } from "express";
import type { GetItemInput } from "@/schemas/item.schema";
import Item from "@/models/item";

export async function GetItems(
  req: Request<{}, {}, {}, GetItemInput["query"]>,
  res: Response,
  _next: NextFunction,
) {
  try {
    if (req.isUnauthenticated() || !req.user) {
      return res.status(401).json({
        message: "User is not logged in",
      });
    }

    const { page, limit, sortBy, order, search } = req.query;
    const { shopId } = req.user;
    let queryFilter: Record<string, any> = {};
    queryFilter.shopId = shopId;

    if (search) {
      queryFilter.name = { $regex: search, $options: "i" };
    }

    const offset = (page - 1) * limit;

    const [shops, totalDocument] = await Promise.all([
      Item.find(queryFilter)
        .skip(offset)
        .sort({ [sortBy]: order === "asc" ? 1 : -1 })
        .limit(limit)
        .lean(),
      Item.countDocuments(),
    ]);

    const totalPages = Math.ceil(totalDocument / limit);

    return res.set(200).json({
      message: "Successfully fetched items",
      data: shops,
      metadata: {
        count: totalDocument,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
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
}
