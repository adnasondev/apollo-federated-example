import { ApolloGateway } from "@apollo/gateway";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { addMocksToSchema } from "@graphql-tools/mock";

import { CommandAction } from "../command-action";
import { LoggableCommand } from "../loggable-command";

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
export function serve() {
  return new LoggableCommand("serve")
    .description("Serve a locally, mocked supergraph")
    .requiredOption("-g, --supergraph <path>", "The path to the supergraph dir to serve")
    .option("-p, --port <number>", "port number", "4000")
    .action(async (options, cmd) => {
      await ServeAction.execute(options, cmd);
    });
}

class ServeAction extends CommandAction {
  async actionHandler(options: { supergraph: string; port: string }): Promise<void> {
    const { absolutePath: supergraphPath } = this.sanitizeSupergraphPath(options.supergraph);

    let port;
    if (Number(options.port) > 0 && Number(options.port) <= 65535) {
      port = Number(options.port);
    } else {
      this.logger.info("Please pick a valid port between 1 & 65535, port was defaulted to 4000");
      port = 4000;
    }

    const supergraphSdl = await this.getSupergraphSdl(supergraphPath);
    await this.startServer(supergraphSdl, port);
  }

  /**
   * Start the local server that serves the composed supergraph schema.
   *
   * @param supergraphSdl - The supergraph SDL contents of schema.graphql
   */
  private async startServer(supergraphSdl: string, port: number) {
    const gateway = new ApolloGateway({ supergraphSdl });

    const { schema } = await gateway.load();

    let server;

    // Only resolve the function when the connections are drained (triggered by ctrl + c)
    const serverPromise = new Promise<void>((resolve) => {
      server = new ApolloServer({
        schema: addMocksToSchema({ schema, mocks }),
        plugins: [
          {
            async serverWillStart() {
              return {
                async drainServer() {
                  resolve();
                },
              };
            },
          },
        ],
      });
    });

    const { url } = await startStandaloneServer(server, {
      listen: { port },
    });

    this.logger.log();
    this.logger.succeed(`🚀 running mock supergraph on ${url}graphql`);
    this.logger.spin("press ctrl + c on Mac and ctrl + z on Windows to stop server...\n");

    return serverPromise;
  }
}
