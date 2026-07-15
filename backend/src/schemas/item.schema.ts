import { z } from "zod";

export const createItemSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    price: z.float32().positive("Price must be above 0"),
    stock: z.coerce.number().positive("Stock can only be postive"),
    image: z.string().optional(),
    description: z.string().min(3, "Description must be at least 3 characters"),
    shopId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Item ID format"),
  }),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;

export const getItemSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    search: z.string().optional(),
    sortBy: z.enum(["name", "createdAt"]).default("name"),
    order: z.enum(["asc", "desc"]).default("asc"),
  }),
});
export type GetItemInput = z.infer<typeof getItemSchema>;

export const getItemByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Product ID format"),
  }),
});
export type GetItemByIdInput = z.infer<typeof getItemByIdSchema>;

// export const deleteItemSchema = z.object({
//   body: z.object({
//     id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Product ID format"),
//   }),
// });
// export type DeleteItemInput = z.infer<typeof deleteItemSchema>;

export const deleteItemByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Product ID format"),
  }),
});

export type DeleteItemByIdInput = z.infer<typeof deleteItemByIdSchema>;

export const patchItemSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Product ID format"),
  }),
  body: z.object({
    name: z.string().min(3, "Name must be at least 3 characters").optional(),
    price: z.float32().positive().optional(),
    stock: z.coerce.number().positive().optional(),
    image: z.string().optional(),
    description: z.string().optional(),
  }),
});

export type PatchItemInput = z.infer<typeof patchItemSchema>;
