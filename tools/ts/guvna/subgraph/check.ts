import { readFile } from "node:fs/promises";

import { buildSubgraphSchema } from "@apollo/subgraph";
import { glob } from "glob";
import { DocumentNode } from "graphql";
import gql from "graphql-tag";

import { CommandAction } from "../command-action";
import { SCHEMA_FILE, SUBGRAPH_DIR } from "../common";
import { LoggableCommand } from "../loggable-command";

/**
 * Read in a schema.graphql file. If there is no problems with gql it is passed to
 * buildSubgraphSchema to build and validate.
 *
 * @returns The check command
 */
export function check() {
  return new LoggableCommand("check")
    .description("Check the syntax subgraph schema")
    .option("-s, --subgraph <subraph-path>", "Path to the subgraph you want to check")
    .option("-a, --all", "Check all subgraphs")
    .action(async (options, cmd) => {
      await CheckAction.execute(options, cmd);
    });
}

class CheckAction extends CommandAction {
  private currentGraphPath: string;

  /**
   * Check the GraphQL syntax.
   *
   * @param options - The options parsed by the CLI
   *
   */
  async actionHandler(options: { subgraph: string; all: boolean }): Promise<void> {
    if (options.subgraph) {
      return this.loader(options.subgraph);
    }

    if (options.all) {
      return this.collectGraphPaths();
    }

    this.logger.fatal("You must provide the --subgraph flag or the --all flag");
  }

  /*
   * Load the schema.graphql file
   *
   * @param subgraphPath - Path to the subgraph file, provided by user, or -a
   */
  async loader(subgraphPath: string): Promise<void> {
    const schemaPath = this.joiner(this.sanitizeSubgraphPath(subgraphPath).relativePath);
    this.currentGraphPath = schemaPath;
    try {
      const schema = await readFile(schemaPath, {
        encoding: "utf8",
      });

      const typeDefs = this.validateSchema(schema);
      this.validateGraph(typeDefs);
      this.logger.succeed(`GraphQL schema syntax check was successful for ${schemaPath}`);
    } catch (err) {
      this.logger.fatal(`Unable to check GraphQL schema file\n   ${schemaPath}\n   Does it exist?`);
    }
  }

  /**
   * Check that the GraphQL schema is parseable.
   *
   * @param schema - The SDL string
   */
  private validateSchema(schema: string) {
    try {
      return gql(schema);
    } catch (err) {
      this.logger.debug(err);
      this.logger.fatal(
        `${err.extensions.code} ${err.message.replace("[<unnamed>]")} in ${this.currentGraphPath}`
      );
    }
  }

  /**
   * Check that AST can be built into a consumable schema. This catches errors that gql-tag library
   * does not.
   *
   * @param typeDefs - The parsed AST tree
   */
  private validateGraph(typeDefs: DocumentNode) {
    try {
      buildSubgraphSchema([{ typeDefs }]);
    } catch (err) {
      this.logger.debug(err);
      this.logger.fatal(
        `${err.extensions.code} ${err.message.replace("[<unnamed>]")} in ${this.currentGraphPath}`
      );
    }
  }

  /**
   * Creates a collection of paths where a domain/graph structure is present.
   * Will fail on missing schema.graphql files and failing schema.graphql
   *
   */
  private async collectGraphPaths() {
    const subgraphPathList = await glob(`${SUBGRAPH_DIR}/**/${SCHEMA_FILE}`);

    subgraphPathList.forEach((path) => {
      this.loader(path);
    });
  }
}
