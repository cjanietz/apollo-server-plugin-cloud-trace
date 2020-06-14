# apollo-server-plugin-cloud-trace

## Description

This plugin enables you add more granular tracing spans in your Google Cloud traces.
Without any complex setup it is possible to instrument on a field by field basis and further enables you when integrating Cloud Trace with BigQuery to analyse usage of fields.

## Getting started

Prerequisites:

-   Google Cloud Trace Agent

```shell script
yarn add @google-cloud/trace-agent
```

-   Apollo Server with Koa/Express<br>
    By default the trace-agent will instrument the /graphql endpoint

To get started with this plugin:

-   Install the plugin

```shell script
yarn add apollo-server-plugin-cloud-trace
```

-   Integrate the plugin with your Apollo Server

```js
import { apolloGCloudTracePlugin } from 'apollo-server-plugin-cloud-trace';
import * as GTrace from '@google-cloud/trace-agent';

const cloudTrace = GTrace.start({
    serviceContext: {
        service: 'my-service',
        version: '1.0',
    },
});

const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [
        apolloGCloudTracePlugin({
            tracer: cloudTrace,
        }),
    ],
});
```

## Configuration

-   `$0` **PluginOptions**
    -   `$0.tracer`
    -   `$0.prefix` (optional, default `'GQL'`)
    -   `$0.addFieldValues` (optional, default `false`)
    -   `$0.addFieldArguments` (optional, default `false`)
-   `tracer` Instance of the GCloud Tracer
-   `prefix` Prefix used in the traces for all GraphQL spans
-   `addFieldValues` Configures whether or not the result of field resolvers are added to traces
-   `addFieldArguments` Configures whether or not parameters of a field resolver are added to traces
