import { buildSubgraphSchema } from "@apollo/subgraph";
import { diff as difference } from "@graphql-inspector/core";
import gql from "graphql-tag";

import { CommandAction } from "../command-action";
import { LoggableCommand } from "../loggable-command";

/**
 * Return a command that allows a diff a subgraph using the revison.
 *
 * @returns The diff subgraph command
 */
export function diff() {
  return new LoggableCommand("diff")
    .description("Find the changes made to a subgraph")
    .requiredOption("-s, --subgraph <subgraph-path>", "Path to the subgraph you want to diff")
    .option("-o, --old <old-revision>", "The old revision git ID", "HEAD")
    .option("-n, --new <new-revision>", "The new revision git ID")
    .action(async (options, cmd) => {
      await DiffAction.execute(options, cmd);
    });
}

class DiffAction extends CommandAction {
  /**
   * The action handler for the CLI 'diff' command.
   *
   * @param options - The options provided by the user to the CLI
   */
  async actionHandler(options: { subgraph: string; old?: string; new?: string }): Promise<void> {
    const schemaFile = this.joiner(this.sanitizeSubgraphPath(options.subgraph).relativePath);

    let oldSchema: string;
    let newSchema: string;

    try {
      oldSchema = await this.getOldSchema(schemaFile, options.old);
      newSchema = await this.getNewSchema(schemaFile, options.new);
    } catch (err) {
      this.logger.fatal("Unable to diff subgraph due to errors in schema", err);
    }

    const changes = await difference(
      buildSubgraphSchema(gql(oldSchema)),
      buildSubgraphSchema(gql(newSchema))
    );

    this.prettyPrint(changes);
  }
}
