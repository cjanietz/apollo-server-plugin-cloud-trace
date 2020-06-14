import {config} from "dotenv";
config();

import * as GTrace from "@google-cloud/trace-agent"

const cloudTrace = GTrace.start({
    serviceContext: {
        service: 'test-gtrace',
        version: '1.0'
    }
});

import {ApolloServer} from "apollo-server";
import gql from "graphql-tag";
import {apolloGCloudTracePlugin} from "../../lib/plugin";


const typeDefs = gql`    
    type Page {
        number: Int
    }
    
    type Book {
        title: String
        author: String
        pages: [Page]
        page(number: Int): Page
    }

    type Query {
        books: [Book]
    }
`;

const resolvers = {
    Query: {
        books: () => [
            {title: 'abc', author: 'def', pages: [{number: 0}]}
        ],
    },
    Book: {
        page: () => {
            return {number: 1};
        }
    }
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [apolloGCloudTracePlugin({
        tracer: cloudTrace,
        addFieldArguments: true,
        addFieldValues: true
    })]
});

server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});
