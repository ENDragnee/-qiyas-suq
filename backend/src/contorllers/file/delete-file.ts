import type { Request, Response, NextFunction } from "express";
import axios from "axios";
import File from "@/models/file";

const SEAWEED_MASTER = "http://localhost:9333";

export async function FileDelete(
  req: Request<{ fid: string }>,
  res: Response,
  _next: NextFunction,
) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({
        error: "User is not logged in",
      });
    }

    const { fid } = req.params;
    const { id: userId } = req.user;
    // const userId = "6a4d874ed80eb5d5b77dc4ab"
    const fileRecord = await File.findOne({ fid, uploadedBy: userId });

    if (!fileRecord) {
      return res.status(404).json({
        message: "File not found or you do not have permission to delete it.",
      });
    }

    const lookupResponse = await axios.get(
      `${SEAWEED_MASTER}/dir/lookup?volumeId=${fid.split(",")[0]}`,
    );
    const { locations } = lookupResponse.data;

    if (!locations || locations.length === 0) {
      return res.status(404).json({
        message: "File volume locations could not be resolved in SeaweedFS",
      });
    }

    const volumeServerUrl = locations[0].publicUrl || locations[0].url;

    await axios.delete(`http://${volumeServerUrl}/${fid}`);

    await File.deleteOne({ fid });

    return res.status(200).json({
      success: true,
      message: "File successfully deleted from storage and database",
    });
  } catch (err) {
    if (Bun.env.ENVIRONMENT === "production") {
      return res.status(500).json({
        message: "Unexpected error occurred during deletion",
      });
    }

    return res.status(500).json({
      message: "Unexpected error occurred during deletion",
      data: err,
    });
  }
}
