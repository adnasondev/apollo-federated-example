"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serve = void 0;
const tslib_1 = require("tslib");
const gateway_1 = require("@apollo/gateway");
const server_1 = require("@apollo/server");
const standalone_1 = require("@apollo/server/standalone");
const mock_1 = require("@graphql-tools/mock");
const command_action_1 = require("../command-action");
const loggable_command_1 = require("../loggable-command");
/**
 * The mock implementations for the custom scalars
 */
const mocks = {
    Date: () => new Date().toISOString().split("T")[0],
    DateTime: () => new Date().toISOString(),
};
/**
 * The CLI command used to serve a mocked version of the supergraph locally. This allows
 * developers to see how their graph will look in a locally sandboxed GraphQL Apollo Explorer.
 *
 * @returns The subraph sub command
 */
function serve() {
    return new loggable_command_1.LoggableCommand("serve")
        .description("Serve a locally, mocked supergraph")
        .requiredOption("-g, --supergraph <path>", "The path to the supergraph dir to serve")
        .option("-p, --port <number>", "port number", "4000")
        .action((options, cmd) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield ServeAction.execute(options, cmd);
    }));
}
exports.serve = serve;
class ServeAction extends command_action_1.CommandAction {
    actionHandler(options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { absolutePath: supergraphPath } = this.sanitizeSupergraphPath(options.supergraph);
            let port;
            if (Number(options.port) > 0 && Number(options.port) <= 65535) {
                port = Number(options.port);
            }
            else {
                this.logger.info("Please pick a valid port between 1 & 65535, port was defaulted to 4000");
                port = 4000;
            }
            const supergraphSdl = yield this.getSupergraphSdl(supergraphPath);
            yield this.startServer(supergraphSdl, port);
        });
    }
    /**
     * Start the local server that serves the composed supergraph schema.
     *
     * @param supergraphSdl - The supergraph SDL contents of schema.graphql
     */
    startServer(supergraphSdl, port) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const gateway = new gateway_1.ApolloGateway({ supergraphSdl });
            const { schema } = yield gateway.load();
            let server;
            // Only resolve the function when the connections are drained (triggered by ctrl + c)
            const serverPromise = new Promise((resolve) => {
                server = new server_1.ApolloServer({
                    schema: (0, mock_1.addMocksToSchema)({ schema, mocks }),
                    plugins: [
                        {
                            serverWillStart() {
                                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                                    return {
                                        drainServer() {
                                            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                                                resolve();
                                            });
                                        },
                                    };
                                });
                            },
                        },
                    ],
                });
            });
            const { url } = yield (0, standalone_1.startStandaloneServer)(server, {
                listen: { port },
            });
            this.logger.log();
            this.logger.succeed(`🚀 running mock supergraph on ${url}graphql`);
            this.logger.spin("press ctrl + c on Mac and ctrl + z on Windows to stop server...\n");
            return serverPromise;
        });
    }
}
//# sourceMappingURL=serve.js.map