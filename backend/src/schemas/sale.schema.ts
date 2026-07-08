import { z } from "zod";

export const createSaleSchema = z.object({
  itemId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Item ID format"),
  price: z.float32().min(0.0, "Price must be above 0"),
  quantity: z.coerce.number().positive("Stock can only be postive"),
  code: z.string().min(8, "Sale code atleast must be 8 charachters long"),
  status: z
    .enum(["pending", "canceled", "failed", "success"])
    .default("pending"),
});
export type CreateSaleInput = z.infer<typeof createSaleSchema>;

export const fetchSalesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  sortBy: z.enum(["createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("asc"),
  status: z
    .enum(["success", "failed", "canceled", "pending"])
    .default("success"),
});
export type fetchSalesInput = z.infer<typeof fetchSalesSchema>;

export const fetchSaleSchema = z.object({
  saleId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Sale ID format"),
});
export type fetchSaleInput = z.infer<typeof fetchSaleSchema>;

export const updateSaleStatusSchema = z.object({
  saleId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Sale ID format"),
  status: z
    .enum(["pending", "canceled", "failed", "success"])
    .default("failed"),
});
export type updateSaleStatusInput = z.infer<typeof updateSaleStatusSchema>;
