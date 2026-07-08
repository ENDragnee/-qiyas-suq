import { Router } from "express";
import { CreateShop } from "@/contorllers/shop/create-shop";
import { validate } from "../middleware/validate";
import {
  createShopSchema,
  deleteShopByIdSchema,
  deleteShopSchema,
  getShopByIdSchema,
  getShopSchema,
  patchShopSchema,
} from "@/schemas/shop.schema";
import { GetShops } from "@/contorllers/shop/fetch-shops";
import { GetShop } from "@/contorllers/shop/fetch-shop";
import { DeleteShopById } from "@/contorllers/shop/delete-shop-admin";
import { DeleteShop } from "@/contorllers/shop/delete-shop";
import { PatchShop } from "@/contorllers/shop/patch-shop";

export const shopRoutes = Router();

shopRoutes.get("/api/shop", validate(getShopSchema), GetShops);
shopRoutes.get("/api/shop/:id", validate(getShopByIdSchema), GetShop);
shopRoutes.post("/api/shop", validate(createShopSchema), CreateShop);
shopRoutes.delete(
  "/api/admin/shop/:id",
  validate(deleteShopByIdSchema),
  DeleteShopById,
);
shopRoutes.delete("/api/shop", validate(deleteShopSchema), DeleteShop);
shopRoutes.patch("/api/shop", validate(patchShopSchema), PatchShop);
