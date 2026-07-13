import mongoose, { Schema } from "mongoose";

interface IFileSchema {
  fid: string;
  name: string;
  mimeType: "image/jpeg" | "image/png" | "image/gif" | "application/pdf";
  size: number;
  uploadedBy: Schema.Types.ObjectId;
  status: "pending" | "failed" | "uploaded";
}

const fileSchema = new Schema<IFileSchema>(
  {
    fid: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "pending",
    },
  },
  { timestamps: true },
);

const File = mongoose.model<IFileSchema>("File", fileSchema);

export default File;
