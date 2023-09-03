import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import { stringify } from "yaml";

import { CommandAction } from "../command-action";
import { SubgraphGraphDeclaration, SupergraphConfig, SupergraphGraphDeclaration } from "../common";
import { LoggableCommand } from "../loggable-command";

/**
 * Return a command that allows a user to register the specified subgraph with the specified
 * supergraph.
 *
 * @returns The register sub command
 */
export function register() {
  return new LoggableCommand("register")
    .description("Register a subgraph with a supergraph")
    .requiredOption("-s, --subgraph <path>", "The path to the subgraph dir to register")
    .requiredOption("-g, --supergraph <path>", "The path to the supergraph dir to register with")
    .action(async (options, cmd) => {
      await RegsiterAction.execute(options, cmd);
    });
}

class RegsiterAction extends CommandAction {
  /**
   * The action handler for the CLI 'register' command.
   *
   * @param options - The options provided to the CLI command
   */
  async actionHandler(options: { subgraph: string; supergraph: string }): Promise<void> {
    const subgraph = this.sanitizeSubgraphPath(options.subgraph);
    const supergraph = this.sanitizeSupergraphPath(options.supergraph);
    const supergraphConfig = await this.getParsedSupergraphConfig(supergraph.absolutePath);

    if (this.isSubgraphRegistered(supergraphConfig, subgraph.relativePosixPath)) {
      this.logger.warn(
        `subgraph ${subgraph.name} is already registered with supergraph ${supergraph.name}`
      );
    } else {
      await this.addSubgraphToSupergraph(supergraphConfig, supergraph, subgraph);
      this.logger.succeed("The subgraph has been successfully registered with the supergraph");
      this.logger.log(
        [
          "\nYou can now compose your supergraph by running\n",
          `  ${this.logger.SET_CYAN}guvna supergraph compose --supergraph supergraphs/${supergraph.name}${this.logger.RESET_COLOR}\n`,
        ].join("\n")
      );
    }
  }

  /**
   * Check if the given subgraph path is already present in the supergraph config.
   *
   * @param config - The supergraph configuration
   * @param relativeSubgraphPosixPath - The path of the subgraph to be checked for registration
   * @returns True if the subgraph is already registered with the supergraph; else false
   */
  private isSubgraphRegistered(config: SupergraphConfig, relativeSubgraphPosixPath: string) {
    const subgraphs = config.subgraphs.map((subgraph) => subgraph.path);

    for (let i = 0; i < subgraphs.length; i++) {
      if (subgraphs[i] === relativeSubgraphPosixPath) {
        return true;
      }
    }

    return false;
  }

  /**
   * Add the subgraph to the supergraph config file. This allows for subsequent composition to include
   * the specified subgraph.
   *
   * @param config - The supergraph config file
   * @param supergraph - The supergraph name and path
   * @param subgraph - The subgraph name and path
   */
  private async addSubgraphToSupergraph(
    config: SupergraphConfig,
    supergraph: SupergraphGraphDeclaration,
    subgraph: SubgraphGraphDeclaration
  ) {
    config.subgraphs.push({
      path: subgraph.relativePosixPath,
    });

    try {
      await writeFile(join(supergraph.absolutePath, "config.yml"), stringify(config));
    } catch (err) {
      this.logger.fatal(
        `Unable to write to supergraph config file:\n   ${supergraph.relativePath}`
      );
    }
  }
}
