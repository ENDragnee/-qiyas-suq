import passport from "passport";
import {
  Strategy as LocalStrategy,
  type IStrategyOptions,
} from "passport-local";
import User from "../models/user";
import { ValidatePassword } from "../libs/password-utils";

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => done(null, user))
    .catch((err) => done(err));
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

      return done(null, findUser);
    } catch (err) {
      return done(err);
    }
  }),
);
