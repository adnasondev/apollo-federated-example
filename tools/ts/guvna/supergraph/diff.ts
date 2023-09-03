import { join } from "node:path";

import { buildSubgraphSchema } from "@apollo/subgraph";
import { diff as difference } from "@graphql-inspector/core";
import gql from "graphql-tag";

import { CommandAction } from "../command-action";
import { SCHEMA_FILE } from "../common";
import { LoggableCommand } from "../loggable-command";

/**
 * Return a command that allows a diff a supergraph using the revison.
 *
 * @returns The diff supergraph command
 */
export function diff() {
  return new LoggableCommand("diff")
    .description("Find the changes made to a supergraph")
    .requiredOption("-s, --supergraph <supergraph-path>", "Path to the supergraph you want to diff")
    .option("-o, --old <old-revision>", "The old revision git ID", "HEAD")
    .option("-n, --new <new-revision>", "The new revision git ID")
    .action(async (options, cmd) => {
      await SuperDiffAction.execute(options, cmd);
    });
}

class SuperDiffAction extends CommandAction {
  /**
   * The action handler for the CLI 'diff' command.
   *
   * @param options - The options provided by the user to the CLI
   */
  async actionHandler(options: { supergraph: string; old?: string; new?: string }): Promise<void> {
    const supergraph = this.sanitizeSupergraphPath(options.supergraph);

    const schemaFile = supergraph.relativePath;

    let oldSchema;
    let newSchema;

    try {
      oldSchema = await this.getOldSchema(join(schemaFile, SCHEMA_FILE), options.old);
      newSchema = await this.getNewSchema(join(schemaFile, SCHEMA_FILE), options.new);
    } catch (err) {
      this.logger.fatal("Unable to diff supergraph due to errors in schema", err);
    }

    const changes = await difference(
      buildSubgraphSchema(gql(oldSchema)),
      buildSubgraphSchema(gql(newSchema))
    );

    this.prettyPrint(changes);
  }
}
