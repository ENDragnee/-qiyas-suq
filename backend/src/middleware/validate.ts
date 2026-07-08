import type { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";

export const validate = (schema: ZodObject) => {
  return async (
    req: Request<any, any, any, any>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Validates req.body, req.query, or req.params against the schema
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Assign the safely parsed data back to req so downstream controllers can use it
      req.body = parsed.body;
      req.query = parsed.query as Record<string, any>;
      req.params = parsed.params as Record<string, string>;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          status: "fail",
          errors: error.issues.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};
