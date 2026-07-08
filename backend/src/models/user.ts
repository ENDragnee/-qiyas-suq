import mongoose, { Schema } from "mongoose";

interface IUserSchema {
  name: string;
  userName: string;
  password: string;
  role: "user" | "admin";
  shopId: Schema.Types.ObjectId;
}

const userSchema = new Schema<IUserSchema>(
  {
    name: { type: String, required: true },
    userName: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, default: "user" },
    shopId: { type: Schema.Types.ObjectId, ref: "Shop" },
  },
  { timestamps: true },
);

const User = mongoose.model<IUserSchema>("User", userSchema);

export default User;
