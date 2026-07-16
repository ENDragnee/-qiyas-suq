import Shop from "@/models/shop";
import type { Request, Response, NextFunction } from "express";
import type { GetShopInput } from "@/schemas/shop.schema";

export async function GetShops(
  req: Request<{}, {}, {}, GetShopInput["query"]>,
  res: Response,
  _next: NextFunction,
) {
  try {
    // if (req.isUnauthenticated() || !req.user) {
    //   return res.status(401).json({
    //     message: "User is not logged in",
    //   });
    // }

    const { page, limit, sortBy, order, search } = req.query;
    let queryFilter: Record<string, any> = {};

    if (search) {
      queryFilter.name = { $regex: search, $options: "i" };
    }

    const offset = (page - 1) * limit;

    const [shops, totalDocument] = await Promise.all([
      Shop.find(queryFilter)
        .skip(offset)
        .sort({ [sortBy]: order === "asc" ? 1 : -1 })
        .limit(limit)
        .lean()
        .select("-password"),
      Shop.countDocuments(queryFilter),
    ]);

    const totalPages = Math.ceil(totalDocument / limit);

    return res.set(200).json({
      message: "Successfully fetched shops",
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
