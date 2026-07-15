import { z } from "zod";

export const createShopSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    accounts: z.array(z.string()).min(1, "Array cannot be empty"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    banner: z.string().optional(),
  }),
});

export type CreateShopInput = z.infer<typeof createShopSchema>;

export const getShopSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    search: z.string().optional(),
    sortBy: z.enum(["name", "createdAt"]).default("name"),
    order: z.enum(["asc", "desc"]).default("asc"),
  }),
});
export type GetShopInput = z.infer<typeof getShopSchema>;

export const getShopByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Product ID format"),
  }),
});
export type GetShopByIdInput = z.infer<typeof getShopByIdSchema>;

export const deleteShopSchema = z.object({
  body: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Product ID format"),
  }),
});
export type DeleteShopInput = z.infer<typeof deleteShopSchema>;

export const deleteShopByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Product ID format"),
  }),
});

export type DeleteShopByIdInput = z.infer<typeof deleteShopByIdSchema>;

export const patchShopSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Name must be at least 3 characters").optional(),
    accounts: z.array(z.string()).min(1, "Array cannot be empty").optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .optional(),
    banner: z.string().optional(),
  }),
});

export type PatchShopInput = z.infer<typeof patchShopSchema>;
