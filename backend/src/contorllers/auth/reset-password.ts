import type { Request, Response, NextFunction } from "express";
import { ValidatePassword } from "@/libs/password-utils";
import User from "@/models/user";

export async function ResetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.isAuthenticated) {
      return res.status(401).json({
        message: "User is not authenticated",
      });
    }
    const userId = req.user?.id;
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(userId).select("password");

    if (!user || user.password == null) {
      return res.status(404).json({ message: "User is not found" });
    }

    if (!(await ValidatePassword(oldPassword, user.password))) {
      return res
        .status(403)
        .send({ error: "please input the correct old password" });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, {
      password: newPassword,
    });

    if (!updatedUser) {
      return res.status(500).json({
        message: "Error updating the password",
      });
    }

    return res.status(200).json({
      message: "User password has been updated",
      data: updatedUser,
    });
  } catch (err) {
    res.status(500).json({
      message: "Unexpected error has occured",
      data: err,
    });
  }
}
