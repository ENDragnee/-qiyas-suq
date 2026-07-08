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
