import { join } from "node:path";

import { composeServices, CompositionResult } from "@apollo/composition";
import { readFile, writeFile } from "fs/promises";
import { glob } from "glob";
import gql from "graphql-tag";

import { CommandAction } from "../command-action";
import { SUPERGRAPH_DIR, SupergraphGraphDeclaration } from "../common";
import { LoggableCommand } from "../loggable-command";

/**
 * Return a command that allows a user to compose a supergraph.
 *
 * @returns The compose subgraph command
 */
export function compose() {
  return new LoggableCommand("compose")
    .description("Compose a supergraph")
    .option("-g, --supergraph <path>", "The path to the supergraph dir to compose")
    .option("-a, --all", "Compose all supergraphs")
    .action(async (options, cmd) => {
      await ComposeAction.execute(options, cmd);
    });
}

class ComposeAction extends CommandAction {
  /**
   * The action handler for the CLI 'compose' supergraph command.
   *
   * @param options - The options provided to the CLI by the user
   */
  async actionHandler(options: { supergraph: string; all: boolean }): Promise<void> {
    if (options.all) {
      const supergraphList = await this.collectGraphPaths();

      // Runs through the list of supergraphs and waits for each one to compose before moving on
      await Promise.all(
        supergraphList.map(async (graph) => {
          const supergraph = this.sanitizeSupergraphPath(graph);
          const composeRes = await this.composeSupergraph(supergraph.name);
          return this.composer(composeRes, supergraph);
        })
      );
    } else {
      const supergraph = this.sanitizeSupergraphPath(options.supergraph);
      const composeRes = await this.composeSupergraph(supergraph.name);
      await this.composer(composeRes, supergraph);
    }
  }

  private async composer(
    composeRes: CompositionResult,
    supergraph: SupergraphGraphDeclaration
  ): Promise<void> {
    if (composeRes.errors) {
      this.logger.fatal("Error composing subgraphs!", composeRes.errors);
    } else {
      // Write the supergraph schema file
      try {
        await writeFile(
          join(process.cwd(), supergraph.relativePath, "schema.graphql"),
          composeRes.supergraphSdl
        );
      } catch (err) {
        this.logger.debug(err);
        this.logger.fatal(`Could not write supergraph schema file`);
      }
      this.logger.succeed("Successfully composed supergraph");
      this.logger.log(
        [
          "\nYou can now serve your supergraph by running\n",
          `  ${this.logger.SET_CYAN}guvna supergraph serve --supergraph supergraphs/${supergraph.name}${this.logger.RESET_COLOR}\n`,
        ].join("\n")
      );
    }
  }

  /**
   * Composes the supergraph with Apollo's composeServices function, compiles all the subgraphs
   * schemas and serves it up.
   *
   * @param supergraphNameOption - The supergraph name option
   * @returns CompositionResult, lets us know if our compose failed or succeeded
   */
  private async composeSupergraph(supergraphName: string): Promise<CompositionResult> {
    const supergraphConfig = await this.getParsedSupergraphConfig(
      join(SUPERGRAPH_DIR, supergraphName)
    );
    const subgraphs = supergraphConfig.subgraphs;

    let subgraphSchemas: Buffer[];
    try {
      subgraphSchemas = await Promise.all(
        supergraphConfig.subgraphs.map((subgraph) =>
          readFile(join(subgraph.path, "schema.graphql"))
        )
      );
    } catch (err) {
      if (err.code === "ENOENT") {
        this.logger.fatal(
          `Unable to read subgraph schema specified in supergraph config\n   ${err.path}\n   Does it exist?`
        );
      } else {
        this.logger.fatal("Error reading subgraph files", err);
      }
    }

    return composeServices(
      subgraphSchemas.map((schemaSdl, index) => {
        return {
          typeDefs: gql(schemaSdl.toString()),
          name: subgraphs[index].path,
          url: "[https-endpoint-placeholder]",
        };
      })
    );
  }

  /**
   * Creates a collection of supergaph paths domain level deep.
   */
  private async collectGraphPaths(): Promise<string[]> {
    try {
      return await glob(`${SUPERGRAPH_DIR}/*/*.graphql`);
    } catch (err) {
      this.logger.fatal("There was an error gathering the supergraphs", err);
    }
  }
}
