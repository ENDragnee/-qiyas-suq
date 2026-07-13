import { Router } from "express";
import { authRoutes } from "./auth";
import { shopRoutes } from "./shop";
import { itemRoutes } from "./item";
import { fileRoutes } from "./file";

const router = Router();

router.use(authRoutes, shopRoutes, itemRoutes, fileRoutes);

export default router;
