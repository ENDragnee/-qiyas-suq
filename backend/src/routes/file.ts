import { FileDelete } from "@/contorllers/file/delete-file";
import { FileUpload } from "@/contorllers/file/upload";
import { validate } from "@/middleware/validate";
import { uploadFileSchema } from "@/schemas/file.schema";
import { Router } from "express";

export const fileRoutes = Router();

fileRoutes.post(
  "/api/file/upload/request-ticket",
  validate(uploadFileSchema),
  FileUpload,
);

fileRoutes.delete("/api/file/:fid", FileDelete);
