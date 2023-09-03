import { join } from "node:path";

import { paramCase } from "change-case";
import { mkdir, readFile, writeFile } from "fs/promises";
import { renderString } from "nunjucks";

import { CommandAction } from "../command-action";
import { README_FILE, SCHEMA_FILE, SUBGRAPH_DIR } from "../common";
import { LoggableCommand } from "../loggable-command";

/**
 * Return a command that allows a user to create a subgraph.
 *
 * @returns The create subgraph command
 */
export function create() {
  return new LoggableCommand("create")
    .description("Create a new subgraph schema for review")
    .requiredOption("-d, --domain <domain-name>", "What domain do you want to create it in?")
    .requiredOption("-a, --appId <ap#>", "Required app id to associate the subgraph with?")
    .requiredOption("-n, --name <subgraph-name>", "Name of subgraph?")
    .action(async (options, cmd) => {
      await CreateAction.execute(options, cmd);
    });
}

class CreateAction extends CommandAction {
  /**
   * The action handler to be invoked to create a subgraph.
   *
   * @param options - The options provided to the CLI command
   */
  async actionHandler(options: { domain: string; appId: string; name: string }): Promise<void> {
    // sanitize CLI inputs
    const domain = this.sanitizeDomainName(options.domain);
    const appId = this.sanitizeAppId(options.appId);
    const name = this.sanitizeSubgraphName(options.name);
    // Create the domain directory
    await this.createDomainDir(domain);
    // The content used for rendering the schema and readme files
    const renderContext = {
      subgraph: {
        appId,
        name,
      },
    };
    // Render the files
    const readmeContent = renderString(await this.getReadmeTemplate(), renderContext);
    const schemaContent = renderString(await this.getSchemaTemplate(), renderContext);
    // Create the subgraph directory and write its files
    const subgraphPath = join(SUBGRAPH_DIR, domain, `${appId}-${name}`);
    await this.createSubgraphDir(subgraphPath, readmeContent, schemaContent);
  }

  private sanitizeDomainName(domainOption: string): string {
    const domain = paramCase(domainOption);

    // Check if the domain name is valid
    if (!/^[a-z-]+$/.test(domain)) {
      this.logger.fatal(
        "--domain must be param-cased, alphanumeric characters, e.g.:\n   customer-management"
      );
    }

    return domain;
  }

  private sanitizeAppId(appIdOption: string): string {
    const appId = appIdOption.toLowerCase();

    // Check if the app ID is valid
    if (!/^ap[0-9]+$/.test(appId)) {
      this.logger.fatal("--appId must be a valid app ID, e.g.:\nap101010");
    }

    return appId;
  }

  private sanitizeSubgraphName(nameOption: string): string {
    const name = paramCase(nameOption);

    // Check if the subgraph name is valid
    if (!/^[0-9a-z-]+$/.test(name)) {
      this.logger.fatal("--name must be param-cased, alpha characters, e.g.:\n   money-movement");
    }

    return name;
  }

  /**
   * Ensure the given domain name exists; if it does not, make a new domain directory.
   *
   * @param domainName - The domain specified by the user
   */
  private async createDomainDir(domainName: string) {
    const domain = join(SUBGRAPH_DIR, domainName);

    try {
      await mkdir(domain);
      this.logger.succeed("Directory created successfully");
    } catch (err) {
      if (err.code !== "EEXIST") {
        this.logger.debug(err);
        this.logger.fatal("Unable to create the domain directory");
      }
    }
  }

  /**
   * This function creates the subgraph directory and the default contents within it.
   *
   * @param subgraphPath - The path where we instantiate the subgraph (inside the specified domain)
   * @param readmeContent - README content for the default subgraph we made
   * @param schemaContent - GraphQL schema content for the default subgraph we made
   *
   */
  private async createSubgraphDir(
    subgraphPath: string,
    readmeContent: string,
    schemaContent: string
  ) {
    // Subgraph dir
    try {
      await mkdir(subgraphPath);
      this.logger.succeed("Subgraph folder created successfully");
    } catch (err) {
      let errMsg: string;

      if (err.code === "EEXIST") {
        errMsg = `A subgraph by that name already exists in the specified domain\n   ${subgraphPath}`;
      } else {
        errMsg = "The subgraph folder could not be created";
      }
      this.logger.debug(err);
      this.logger.fatal(errMsg);
    }

    // README file
    try {
      await writeFile(join(subgraphPath, README_FILE), readmeContent);
    } catch (err) {
      this.logger.debug(err);
      this.logger.fatal("Unable to write README file");
    }

    // Schema file
    try {
      await writeFile(join(subgraphPath, SCHEMA_FILE), schemaContent);
    } catch (err) {
      this.logger.debug(err);
      this.logger.fatal("Unable to write schema file");
    }

    // Print tree
    this.printTree(subgraphPath);
    // Print additional directions
    this.logger.log(
      [
        "\nYou can now register your subgraph with a supergraph by running\n",
        `  ${this.logger.SET_CYAN}guvna subgraph register --subgraph ${subgraphPath} --supergraph supergraphs/<the-supergraph>${this.logger.RESET_COLOR}\n`,
      ].join("\n")
    );
  }

  /**
   * This function fetches the string template of the default README
   *
   * @returns String template
   */
  private async getReadmeTemplate() {
    return (
      await readFile(join(process.cwd(), "tools", "ts", "assets", "README.md.njk"))
    ).toString();
  }

  /**
   * This function fetches the string template of the default graphql schema
   *
   * @returns String template
   */
  private async getSchemaTemplate() {
    return (
      await readFile(join(process.cwd(), "tools", "ts", "assets", "schema.graphql.njk"))
    ).toString();
  }

  /**
   * Print a tree letting the user know where and what was created
   *
   * @param subgraphPath - The path to the new subgraph created
   */
  private printTree(subgraphPath: string) {
    const dirs = subgraphPath.split("/");
    this.logger.log(
      [
        `\nYour files can be found at ${subgraphPath}`,
        `\n|-- ${dirs[0]}`, // Subgraphs
        `|  |-- ${dirs[1]}`, // Domain name
        `|\t|-- ${dirs[2]}`, // Subgraph name
        `|\t  |-- ${SCHEMA_FILE}`,
        `|\t  |-- ${README_FILE}`,
      ].join("\n")
    );
  }
}
