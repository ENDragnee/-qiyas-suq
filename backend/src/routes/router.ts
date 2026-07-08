import { Router } from "express";
import { authRoutes } from "./auth";
import { shopRoutes } from "./shop";

const router = Router();

router.use(authRoutes, shopRoutes);

export default router;
