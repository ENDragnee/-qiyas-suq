import mongoose, { Schema } from "mongoose";

interface ISaleSchema {
  userId: Schema.Types.ObjectId;
  itemId: Schema.Types.ObjectId;
  price: number;
  quantity: number;
  code: string;
  status: "pending" | "canceled" | "success" | "failed";
}

const saleSchema = new Schema<ISaleSchema>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    itemId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Item",
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    code: {
      type: String,
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

const Sale = mongoose.model<ISaleSchema>("Sale", saleSchema);

export default Sale;
