import { z } from "zod";

export const createSaleSchema = z.object({
  body: z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Shop ID format"),
    itemId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Shop ID format"),
    price: z.float32().min(0.0, "Price must be above 0"),
    quantity: z.int32().min(0, "Stock can only be postive"),
    code: z.string().min(8, "Sale code atleast must be 8 charachters long"),
  }),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
