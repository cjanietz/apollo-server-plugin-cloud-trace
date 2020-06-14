import { ApolloServerPlugin, GraphQLRequestContext } from 'apollo-server-plugin-base';
import { Tracer } from '@google-cloud/trace-agent/build/src/plugin-types';
import { Path } from 'graphql/jsutils/Path';
import { GraphQLResolveInfo } from 'graphql';
import isObjectLike = require('lodash.isobjectlike');

export interface PluginOptions {
    tracer: Tracer;
    prefix?: string;

    addFieldValues?: ((info: GraphQLResolveInfo) => boolean) | boolean;
    addFieldArguments?: ((info: GraphQLResolveInfo, args: object) => boolean) | boolean;
}

const buildPathArr = (path: Path, lastPath: string[] = []): string[] => {
    lastPath.push(path.key.toString());
    if (path.prev) {
        return buildPathArr(path.prev, lastPath);
    }
    return lastPath.reverse();
};

/**
 * apolloGCloudTracePlugin - Creates a plugin instance
 * @param tracer Instance of the GCloud Tracer
 * @param prefix Prefix used in the traces for all GraphQL spans
 * @param addFieldValues Configures whether or not the result of field resolvers are added to traces
 * @param addFieldArguments Configures whether or not parameters of a field resolver are added to traces
 */
export const apolloGCloudTracePlugin = ({
    tracer,
    prefix = 'GQL',
    addFieldValues = false,
    addFieldArguments = false,
}: PluginOptions) => (): ApolloServerPlugin => ({
    requestDidStart(context: GraphQLRequestContext) {
        const gqlRequestSpan = tracer.createChildSpan({
            name: `${prefix}: ${context.request.operationName || 'Unnamed Query'}`,
        });

        return {
            executionDidStart: () => {
                const gqlExecSpan = tracer.createChildSpan({
                    name: `${prefix} Exec: ${context.request.operationName || 'Unnamed Query'}`,
                });
                return {
                    executionDidEnd: () => {
                        gqlExecSpan.endSpan();
                    },

                    willResolveField({ info, args }) {
                        const pathArr = buildPathArr(info.path);
                        const fieldSpan = tracer.createChildSpan({
                            name: `${prefix} ${pathArr.join(' > ')}`,
                        });
                        fieldSpan.addLabel('fieldName', info.fieldName);

                        if (addFieldArguments) {
                            const doAddFieldArguments =
                                typeof addFieldArguments === 'function'
                                    ? addFieldArguments(info, args)
                                    : addFieldArguments;
                            if (doAddFieldArguments === true) {
                                const argumentKeys = Object.keys(args);
                                argumentKeys.forEach((key) => fieldSpan.addLabel(key, args[key]));
                            }
                        }

                        return (_, result) => {
                            if (addFieldValues) {
                                const doLogFieldValue =
                                    typeof addFieldValues === 'function' ? addFieldValues(info) : addFieldValues;
                                if (doLogFieldValue === true && !isObjectLike(result)) {
                                    fieldSpan.addLabel('value', result);
                                }
                            }

                            fieldSpan.endSpan();
                        };
                    },
                };
            },
            willSendResponse() {
                gqlRequestSpan.endSpan();
            },
        };
    },
});
