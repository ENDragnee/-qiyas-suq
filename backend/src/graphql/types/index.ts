export const typeDefs = `#graphql
  type IMovie {
    title: String
    description: String
    genre: [String]
    releaseDate: String
    duration: Int
    rating: Float
    language: String
    director: [String]
    cast: [String]
    posterImage: String
    trailerUrl: String
  }

  type MovieMetadata {
    totalDocuments: Int!
    totalPages: Int!
    currentPage: Int!
    hasNextPage: Boolean!
    hasPrevPage: Boolean!
  }

  type Movie {
    data: [IMovie!]!
    metaData: MovieMetadata!
  }

  type Query {
    hello: String
    welcome(name: String!): String
    movies(
      page: Int = 1
      limit: Int = 10
      search: String
      genre: String
      relaseDate: Int
      sort: String = "asc"
    ): Movie!
  }

  type CreateMovie {
    message: String!
    data: IMovie
  }

  type Mutation {
    postMovie(
      title: String!
      description: String!
      genre: [String]!
      releaseDate: String!
      duration: Int!
      rating: Float!
      language: String!
      director: [String]!
      cast: [String]!
      posterImage: String!
      trailerUrl: String!
    ): CreateMovie!
  }
`;
