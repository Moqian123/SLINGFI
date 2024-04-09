import { makeExecutableSchema } from '@graphql-tools/schema'
import type { Link } from '@prisma/client'
import { GraphQLContext } from './context';

const typeDefinitions = /* GraphQL */ `
    type Link {
        id: ID!
        description: String!
        url: String!
    }

    type PermitToken {
      id: ID!
      permit_tokens_account: String!
      mint_token: String!
      mint_token_name: String!
    }

    type Query {
        info: String!
        feed: [Link!]!
        permitTokens: [PermitToken!]!
    }
    
    type Mutation {
        postLink(url: String!, description: String!): Link!
        postPermitToken(permit_tokens_account: String!, mint_token: String!, mint_token_name: String! ): PermitToken!
    }

`

const resolvers = {
    Query: {
      info: () => `This is the API of a Hackernews Clone`,
      // 3
      feed: (parent: unknown, args: {}, context: GraphQLContext) => context.prisma.link.findMany(),
      permitTokens: (parent: unknown, args: {}, context: GraphQLContext) => context.prisma.permit_tokens.findMany(),
    },
    Link: {
      id: (parent: Link) => parent.id,
      description: (parent: Link) => parent.description,
      url: (parent: Link) => parent.url
    },
    Mutation: {
      async postLink(
        parent: unknown, 
        args: { description: string; url: string },
        context: GraphQLContext
        ) {
          const newLink = await context.prisma.link.create({
            data: {
              url: args.url,
              description: args.description
            }
          })
          return newLink
        },

      async postPermitToken(
        parent: unknown, 
        args: { permit_tokens_account: string; mint_token: string, mint_token_name: string  },
        context: GraphQLContext
      ) {
        const newPermitToken = await context.prisma.permit_tokens.create({
          data: {
            updatedAt: new Date(),
            permit_tokens_account: args.permit_tokens_account,
            mint_token: args.mint_token,
            mint_token_name: args.mint_token_name,
            status:''
          }
        })
        return newPermitToken
      }
    }
}

   

export const schema = makeExecutableSchema({
    resolvers: [resolvers],
    typeDefs: [typeDefinitions]
  })