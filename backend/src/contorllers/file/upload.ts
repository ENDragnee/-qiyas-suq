import type { Request, Response, NextFunction } from "express";
import axios from "axios";
import type { uploadFileInput } from "@/schemas/file.schema";
import File from "@/models/file";

const SEAWEED_MASTER = "http://localhost:9333";

export async function FileUpload(
  req: Request<{}, {}, uploadFileInput["body"], {}>,
  res: Response,
  _next: NextFunction,
) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({
        error: "User is not logged in",
      });
    }

    const { id } = req.user;

    const { name, mimeType, size } = req.body;

    const seaweedResponse = await axios.get(`${SEAWEED_MASTER}/dir/assign`);
    const { fid, publicUrl } = seaweedResponse.data;

    if (!fid || !publicUrl) {
      return res.status(400).json({
        message: "Failed to get upload ticket",
      });
    }

    const dbResult = await File.create({
      fid,
      name,
      mimeType,
      size,
      uploadedBy: id,
    });

    const uploadUrl = `http://${publicUrl}/${fid}`;

    return res.status(200).json({
      uploadUrl,
      fid,
      dbResult,
    });
  } catch (err) {
    if (Bun.env.ENVIRONMENT === "production") {
      return res.status(500).json({
        message: "Unexpected error has occured",
      });
    }

    return res.status(500).json({
      message: "Unexpected error has occured",
      data: err,
    });
  }
}
