import { Router } from "express";
import { CreateShop } from "@/contorllers/shop/create-shop";
import { validate } from "../middleware/validate";
import { createShopSchema } from "@/schemas/shop.schema";

export const shopRoutes = Router();

shopRoutes.post("/api/shop", validate(createShopSchema), CreateShop);
