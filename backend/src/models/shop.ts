import mongoose, { Schema } from "mongoose";

interface IShopSchema {
  name: string;
  accounts: string[];
  banner?: string;
}

const shopSchema = new Schema<IShopSchema>(
  {
    name: {
      type: String,
      required: true,
    },
    accounts: {
      type: [String],
      required: true,
    },
    banner: {
      type: String,
      required: false,
      default: "",
    },
  },
  { timestamps: true },
);

const Shop = mongoose.model<IShopSchema>("Shop", shopSchema);

export default Shop;
