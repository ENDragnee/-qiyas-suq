import { Router } from "express";
import { authRoutes } from "./auth";
import { shopRoutes } from "./shop";
import { itemRoutes } from "./item";

const router = Router();

router.use(authRoutes, shopRoutes, itemRoutes);

export default router;
