import mongoose, { Schema } from "mongoose";

interface IItemSchema {
  name: string;
  price: number;
  stock: number;
  image?: string;
  description?: string;
  shopId: Schema.Types.ObjectId;
}

const itemSchema = new Schema<IItemSchema>(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      required: false,
    },
  },
  { timestamps: true },
);

const Item = mongoose.model<IItemSchema>("Item", itemSchema);

export default Item;
