import { readFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";

import { Change, CriticalityLevel } from "@graphql-inspector/core";
import { spawn } from "child_process";
import { parse } from "yaml";

import {
  FEDERATION_TYPES,
  SCHEMA_FILE,
  SubgraphGraphDeclaration,
  SupergraphConfig,
  SupergraphGraphDeclaration,
} from "./common";
import { LoggableCommand } from "./loggable-command";
import { CliLogger } from "./logger";

/**
 * A CommandAction instance is meant to be invoked by a commander.js command action handler. This
 * class should be extended with a custom `actionHandler` method implementation that will be
 * invoked as part of the CommandAction.execute static method.
 */
export abstract class CommandAction {
  logger: CliLogger;

  // eslint-disable-next-line prettier/prettier
  constructor(
    protected options: { [key: string]: string },
    protected cmd: LoggableCommand
  ) {
    this.logger = cmd.logger;
  }

  /**
   * Create an instance of and execute an action for a specific CLI command.
   *
   * @param options - The CLI options passed to the command
   * @param cmd - The CLI command being invoked
   */
  static async execute<T extends CommandAction>(
    this: { new (options: { [key: string]: string }, cmd: LoggableCommand): T },
    options: { [key: string]: string },
    cmd: LoggableCommand
  ) {
    cmd.init();
    cmd.logger.spin();
    await cmd.logger.visualPause();
    const action = new this(options, cmd);
    await action.actionHandler(options);
    cmd.logger.stop();
  }

  /**
   * This method must be implemented and is invoked by the static execute function as part the
   * command action invocation by Commander.js.
   *
   * @param options - The options provided to the CLI by the user
   */
  abstract actionHandler(options: { [key: string]: string | boolean }): Promise<void>;

  /**
   * Ensure the given subgraph path follows the appropriate pattern.
   *
   * @param subgraphOption - The subgraph path given from the CLI user
   * @returns The sanitized paths to the subgraph directory and name of the subgraph
   */
  protected sanitizeSubgraphPath(subgraphOption: string): SubgraphGraphDeclaration {
    // Ensure we're given a relative path to the subgraph
    const relativePath = this.makePathIntoRelativePath(subgraphOption);
    // Pick out the supergraph directory name from the path
    const [, domain, subgraph] =
      relativePath.match(
        /(?:subgraphs(?:\/|\\))?([a-z0-9-]+)(?:\/|\\)([a-z0-9-]+)(?:(?:\/|\\).*)?/
      ) ?? [];

    if (!domain || !subgraph) {
      this.logger.fatal(
        "--subgraph must be a path to the subgraph directory, e.g.:subgraph/customer-management/ap222222-identity"
      );
    }

    return new SubgraphGraphDeclaration(domain, subgraph);
  }

  /**
   * Clean up joining the schema.graphql to the end of file names.
   *
   * @param graph - The file name path we want to add schema tag too
   * @returns - The joined file name path with the schema tag
   */
  protected joiner(graph) {
    return join(graph, "schema.graphql");
  }

  /**
   * Gets the old stringified version of the file by the commit hash, using git.
   *
   * @param schemaFile - The schema file we want the old version of
   * @param revision - The commit hash used to reference the ID in git
   */
  protected async getOldSchema(schemaFile: string, revision: string): Promise<string> {
    const git = spawn("git", ["show", `${revision}:${schemaFile}`]);
    let res = "";

    git.stdout.on("data", (data) => {
      res += data;
    });

    let errMsg = "Error during git process";
    git.stderr.on("data", (data) => {
      if (data.toString().includes("exists on disk, but not in")) {
        errMsg = `Cannot calculate a diff\n\n   ${schemaFile} has not been committed in old revision ${revision}`;
      } else {
        errMsg = `Unknown Git error\n\n   ${data}`;
      }
    });

    return new Promise<string>((resolve) => {
      git.on("close", (code) => {
        if (code === 0) {
          resolve(res);
        } else {
          this.logger.fatal(errMsg);
        }
      });
    });
  }

  /**
   * Gets the new stringified version of the file by the commit hash, using git.
   *
   * @param schemaFile - The schema file we want the new version of
   * @param revision - Optional git commit hash used to reference the ID in git
   */
  protected async getNewSchema(schemaFile: string, revision?: string): Promise<string> {
    if (!revision) {
      // If a specific revision was not given simply read the current working directory
      try {
        return (await readFile(join(process.cwd(), schemaFile))).toString();
      } catch (err) {
        this.logger.fatal(
          `Unable to read schema file in working directory\n   ${join(
            process.cwd(),
            schemaFile
          )}\n   Does it exist?`
        );
      }
    }
    return this.getOldSchema(schemaFile, revision);
  }

  /**
   * Beautifies and logs changes.
   *
   * @param changes - Array of changes that occured in the schema file
   */
  protected prettyPrint(changes: Change[] | undefined) {
    this.logger.log();

    if (!changes) {
      this.logger.info("New schema - all type definitions are new");
      return;
    }

    if (changes.length < 1) {
      this.logger.info("No functional changes");
      return;
    }

    const breakingChangesCount = changes.filter(
      (change) => change.criticality.level === CriticalityLevel.Breaking
    ).length;

    this.logger.log(`Detected the following changes (${changes.length}) between schemas:\n`);

    changes
      .filter((change) => {
        return !FEDERATION_TYPES.includes(change.path as string);
      })
      .forEach((change) => {
        if (change.criticality.level === CriticalityLevel.Breaking) {
          this.logger.fail(change.message);
        } else if (change.criticality.level === CriticalityLevel.Dangerous) {
          this.logger.warn(change.message);
        } else if (change.criticality.level === CriticalityLevel.NonBreaking) {
          this.logger.succeed(change.message);
        } else {
          this.logger.warn(change.message);
        }
      });

    this.logger.log();

    if (breakingChangesCount > 0) {
      this.logger.fail(`Detected ${breakingChangesCount} breaking change(s)\n`);
    } else {
      this.logger.info("Detected 0 breaking changes\n");
    }
  }
  /**
   * Ensure the given supergraph path follows the appropriate pattern.
   *
   * @param supergraphOption - The supergraph path given from the CLI user
   * @returns The sanitized paths to the supergraph irectory and the name of the supergraph
   */
  protected sanitizeSupergraphPath(supergraphOption: string): SupergraphGraphDeclaration {
    // Ensure we're given a relative path to the supergraph
    const relativePath = this.makePathIntoRelativePath(supergraphOption);
    // Pick out the supergraph directory name from the path
    const [, supergraph] =
      relativePath.match(/(?:supergraphs(?:\/|\\))?([a-z0-9-]+)(?:(?:\/|\\).*)?/) ?? [];

    if (!supergraph) {
      this.logger.fatal(
        "--supergraph must be a path to the supergraphs directory, e.g.:\nsupergraphs/ap222222-fidelity-supergraph"
      );
    }

    return new SupergraphGraphDeclaration(supergraph);
  }

  /**
   * Parse and return the supergraph configuration file.
   *
   * @param supergraphPath - The absolute path to supergraph directory
   * @returns The parsed supergraph config.yml file
   */
  protected async getParsedSupergraphConfig(supergraphPath: string): Promise<SupergraphConfig> {
    const absolutePath = join(supergraphPath, "config.yml");
    let ymlContents;

    // Ensure the file exists
    try {
      ymlContents = await readFile(absolutePath);
    } catch (err) {
      this.logger.debug(err);
      this.logger.fatal(
        `Unable to read supergraph config file:\n   ${absolutePath}\n   Does it exist?`
      );
    }

    // Parse the file
    try {
      return parse(ymlContents.toString()) as SupergraphConfig;
    } catch (err) {
      this.logger.debug(err);
      this.logger.fatal(`Unable to parse supergraph config file: ${absolutePath}`);
    }
  }

  /**
   * Read the supergraph SDL file.
   *
   * @param supergraphPath - The path to the supergraph directory
   * @returns The supergraph SDL
   */
  protected async getSupergraphSdl(supergraphPath: string) {
    const schemaFilePath = join(supergraphPath, SCHEMA_FILE);

    try {
      const fileContents = await readFile(schemaFilePath);
      return fileContents.toString();
    } catch (err) {
      this.logger.debug(err);
      this.logger.fatal(
        ["Unable to read supergraph schema at file:", schemaFilePath, "Does it exist?\n"].join(
          "\n   "
        )
      );
    }
  }

  private makePathIntoRelativePath(path: string) {
    if (isAbsolute(path)) {
      // get to the relative path
      return path.replace(process.cwd(), "");
    }
    // The path is already relative
    return path;
  }
}
