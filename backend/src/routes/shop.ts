import { Router } from "express";
import { CreateShop } from "@/contorllers/shop/create-shop";
import { validate } from "../middleware/validate";
import { createShopSchema } from "@/schemas/shop.schema";

export const shopRoutes = Router();

// The middleware runs and intercepts bad data before the controller is ever invoked
shopRoutes.post("/api/shop", validate(createShopSchema), CreateShop);
