import express from "express";
import router from "./routes/router";
import session from "express-session";
import "./auth/passport-local";
import passport from "passport";
import { ConnectDB } from "./libs/mongoose";
import dotenv from "dotenv";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import http from "http";
import { expressMiddleware } from "@as-integrations/express4";
import cors from "cors";
import bodyParser from "body-parser";
import { corsMiddleware } from "./middleware/cors";
import { sessionMiddleware } from "./middleware/session";
import { expressJsonMiddleware } from "./middleware/express-json";
import {
  passportInitializeMiddleware,
  passportSessionMiddleware,
} from "./middleware/passport";
// import Movie from "./models/movies";

const app = express();
dotenv.config({ path: "../.env" });

ConnectDB().catch((err) => {
  console.error(err);
  process.exit(1);
});

const PORT = Bun.env.PORT || 3000;

app.use(corsMiddleware);
app.use(expressJsonMiddleware);
app.use(sessionMiddleware);
app.use(passportInitializeMiddleware);
app.use(passportSessionMiddleware);
app.use(router);
app.use(
  "/api/graphql",
  cors<cors.CorsRequest>(),
  bodyParser.json(),
  // expressMiddleware(server),
);

const httpServer = http.createServer(app);

// 2. Define your Resolvers
// const resolvers = {
//   Query: {
//     hello: () => "Hello from Bun and Apollo!",
//     welcome: (_: any, { name }: { name: string }) =>
//       `Welcome to the future, ${name}!`,
//     movies: async (
//       _: any,
//       args: {
//         page?: number;
//         limit?: number;
//         search?: string;
//         genre?: string;
//         relaseDate?: number;
//         sort?: string;
//       },
//     ) => {
//       try {
//         const page = (args.page || 1) as number;
//         const limit = (args.limit || 10) as number;
//         const search = args.search as string;
//         const genre = args.genre as string;
//         const relaseDate = args.relaseDate as number;
//         const sort = (args.sort as string) || "asc";
//
//         const skip = (page - 1) * limit;
//
//         const [findMovie, totalDocuments] = await Promise.all([
//           Movie.find({
//             ...(search && { title: search }),
//             ...(genre && { genre }),
//             ...(relaseDate && { relaseDate }),
//           })
//             .limit(limit)
//             .sort({ title: sort === "des" ? -1 : 1 })
//             .skip(skip),
//           Movie.countDocuments(),
//         ]);
//
//         const totalPages = Math.ceil(totalDocuments / limit);
//
//         return {
//           data: findMovie,
//           metaData: {
//             totalDocuments,
//             totalPages,
//             currentPage: page,
//             hasNextPage: page < totalPages,
//             hasPrevPage: page > 1,
//           },
//         };
//       } catch (err) {
//         console.error(err);
//         throw new Error("Unexpected error has occurred");
//       }
//     },
//   },
//
//   Mutation: {
//     postMovie: async (
//       _: any,
//       args: {
//         title: string;
//         description: string;
//         genre: string[];
//         releaseDate: string;
//         duration: number;
//         rating: number;
//         language: string;
//         director: string[];
//         cast: string[];
//         posterImage: string;
//         trailerUrl: string;
//       },
//     ) => {
//       try {
//         if (!args || Object.keys(args).length === 0) {
//           console.error("Request body is missing or empty");
//         }
//         const {
//           title,
//           description,
//           genre,
//           releaseDate,
//           duration,
//           rating,
//           language,
//           director,
//           cast,
//           posterImage,
//           trailerUrl,
//         } = args;
//
//         const createMovie = await Movie.create({
//           title,
//           description,
//           genre,
//           releaseDate,
//           duration,
//           rating,
//           language,
//           director,
//           cast,
//           posterImage,
//           trailerUrl,
//         });
//
//         return {
//           message: "Movie created successfuly",
//           data: createMovie,
//         };
//       } catch (err) {
//         console.error(err);
//         throw new Error("Unexpected error has occurred");
//       }
//     },
//   },
// };

// const server = new ApolloServer({
//   typeDefs,
//   resolvers,
//   plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
// });

// await server.start();

app.listen(PORT);
