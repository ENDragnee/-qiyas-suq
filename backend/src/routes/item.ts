import { CreateItem } from "@/contorllers/item/create-item";
import { DeleteItem } from "@/contorllers/item/delete-item";
import { DeleteItemAdmin } from "@/contorllers/item/delete-item-admin";
import { GetItem } from "@/contorllers/item/fetch-item";
import { GetItems } from "@/contorllers/item/fetch-items";
import { PatchItem } from "@/contorllers/item/patch-item";
import { validate } from "@/middleware/validate";
import {
  createItemSchema,
  deleteItemByIdSchema,
  getItemByIdSchema,
  getItemSchema,
  patchItemSchema,
} from "@/schemas/item.schema";
import { Router } from "express";

export const itemRoutes = Router();

itemRoutes.get("/api/item", validate(getItemSchema), GetItems);
itemRoutes.get("/api/item/:id", validate(getItemByIdSchema), GetItem);
itemRoutes.post("/api/item", validate(createItemSchema), CreateItem);
itemRoutes.delete("/api/item/:id", validate(deleteItemByIdSchema), DeleteItem);
itemRoutes.delete(
  "/api/admin/item/:id",
  validate(deleteItemByIdSchema),
  DeleteItemAdmin,
);
itemRoutes.patch("/api/item/:id", validate(patchItemSchema), PatchItem);
