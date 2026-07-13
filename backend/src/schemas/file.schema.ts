import z from "zod";

export const uploadFileSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    mimeType: z.enum(
      ["image/jpeg", "image/png", "image/gif", "application/pdf"],
      "Only images and PDFs are permitted",
    ),
    size: z.coerce.number().int().positive("The size must be vaild"),
  }),
});

export type uploadFileInput = z.infer<typeof uploadFileSchema>;
