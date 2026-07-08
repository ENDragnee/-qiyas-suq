import passport from "passport";
import {
  Strategy as LocalStrategy,
  type IStrategyOptions,
} from "passport-local";
import User from "../models/user";
import { ValidatePassword } from "../libs/password-utils";

passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user as Express.User | null);
  } catch (err) {}
});

const strategyOptions: IStrategyOptions = {
  usernameField: "userName",
  passwordField: "password",
};
passport.use(
  new LocalStrategy(strategyOptions, async (userName, password, done) => {
    try {
      const findUser = await User.findOne({
        userName,
      });
      if (!findUser) {
        return done(null, false);
      }

      if (!(await ValidatePassword(password, findUser.password))) {
        return done(null, false);
      }

      return done(null, findUser as any as Express.User);
    } catch (err) {
      return done(err);
    }
  }),
);
