import { z } from "zod";

export const createItemSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    price: z.float32().min(0.0, "Price must be above 0"),
    stock: z.int32().min(0, "Stock can only be postive"),
    image: z.string().optional(),
    description: z.string().min(3, "Description must be at least 3 characters"),
    shopId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Shop ID format"),
  }),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
