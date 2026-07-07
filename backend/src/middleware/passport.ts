import passport from "passport";

export const passportInitializeMiddleware = passport.initialize();
export const passportSessionMiddleware = passport.session();
