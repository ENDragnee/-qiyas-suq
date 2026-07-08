import { z } from "zod";

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    userName: z.string().min(3, "Name must be at least 3 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["user", "admin"]),
    shop: z.object({
      shopId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Shop ID format"),
      password: z.string(),
    }),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
