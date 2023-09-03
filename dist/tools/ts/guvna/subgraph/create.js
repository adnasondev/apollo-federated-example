"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
const tslib_1 = require("tslib");
const node_path_1 = require("node:path");
const change_case_1 = require("change-case");
const promises_1 = require("fs/promises");
const nunjucks_1 = require("nunjucks");
const command_action_1 = require("../command-action");
const common_1 = require("../common");
const loggable_command_1 = require("../loggable-command");
/**
 * Return a command that allows a user to create a subgraph.
 *
 * @returns The create subgraph command
 */
function create() {
    return new loggable_command_1.LoggableCommand("create")
        .description("Create a new subgraph schema for review")
        .requiredOption("-d, --domain <domain-name>", "What domain do you want to create it in?")
        .requiredOption("-a, --appId <ap#>", "Required app id to associate the subgraph with?")
        .requiredOption("-n, --name <subgraph-name>", "Name of subgraph?")
        .action((options, cmd) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield CreateAction.execute(options, cmd);
    }));
}
exports.create = create;
class CreateAction extends command_action_1.CommandAction {
    /**
     * The action handler to be invoked to create a subgraph.
     *
     * @param options - The options provided to the CLI command
     */
    actionHandler(options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // sanitize CLI inputs
            const domain = this.sanitizeDomainName(options.domain);
            const appId = this.sanitizeAppId(options.appId);
            const name = this.sanitizeSubgraphName(options.name);
            // Create the domain directory
            yield this.createDomainDir(domain);
            // The content used for rendering the schema and readme files
            const renderContext = {
                subgraph: {
                    appId,
                    name,
                },
            };
            // Render the files
            const readmeContent = (0, nunjucks_1.renderString)(yield this.getReadmeTemplate(), renderContext);
            const schemaContent = (0, nunjucks_1.renderString)(yield this.getSchemaTemplate(), renderContext);
            // Create the subgraph directory and write its files
            const subgraphPath = (0, node_path_1.join)(common_1.SUBGRAPH_DIR, domain, `${appId}-${name}`);
            yield this.createSubgraphDir(subgraphPath, readmeContent, schemaContent);
        });
    }
    sanitizeDomainName(domainOption) {
        const domain = (0, change_case_1.paramCase)(domainOption);
        // Check if the domain name is valid
        if (!/^[a-z-]+$/.test(domain)) {
            this.logger.fatal("--domain must be param-cased, alphanumeric characters, e.g.:\n   customer-management");
        }
        return domain;
    }
    sanitizeAppId(appIdOption) {
        const appId = appIdOption.toLowerCase();
        // Check if the app ID is valid
        if (!/^ap[0-9]+$/.test(appId)) {
            this.logger.fatal("--appId must be a valid app ID, e.g.:\nap101010");
        }
        return appId;
    }
    sanitizeSubgraphName(nameOption) {
        const name = (0, change_case_1.paramCase)(nameOption);
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
    createDomainDir(domainName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const domain = (0, node_path_1.join)(common_1.SUBGRAPH_DIR, domainName);
            try {
                yield (0, promises_1.mkdir)(domain);
                this.logger.succeed("Directory created successfully");
            }
            catch (err) {
                if (err.code !== "EEXIST") {
                    this.logger.debug(err);
                    this.logger.fatal("Unable to create the domain directory");
                }
            }
        });
    }
    /**
     * This function creates the subgraph directory and the default contents within it.
     *
     * @param subgraphPath - The path where we instantiate the subgraph (inside the specified domain)
     * @param readmeContent - README content for the default subgraph we made
     * @param schemaContent - GraphQL schema content for the default subgraph we made
     *
     */
    createSubgraphDir(subgraphPath, readmeContent, schemaContent) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // Subgraph dir
            try {
                yield (0, promises_1.mkdir)(subgraphPath);
                this.logger.succeed("Subgraph folder created successfully");
            }
            catch (err) {
                let errMsg;
                if (err.code === "EEXIST") {
                    errMsg = `A subgraph by that name already exists in the specified domain\n   ${subgraphPath}`;
                }
                else {
                    errMsg = "The subgraph folder could not be created";
                }
                this.logger.debug(err);
                this.logger.fatal(errMsg);
            }
            // README file
            try {
                yield (0, promises_1.writeFile)((0, node_path_1.join)(subgraphPath, common_1.README_FILE), readmeContent);
            }
            catch (err) {
                this.logger.debug(err);
                this.logger.fatal("Unable to write README file");
            }
            // Schema file
            try {
                yield (0, promises_1.writeFile)((0, node_path_1.join)(subgraphPath, common_1.SCHEMA_FILE), schemaContent);
            }
            catch (err) {
                this.logger.debug(err);
                this.logger.fatal("Unable to write schema file");
            }
            // Print tree
            this.printTree(subgraphPath);
            // Print additional directions
            this.logger.log([
                "\nYou can now register your subgraph with a supergraph by running\n",
                `  ${this.logger.SET_CYAN}guvna subgraph register --subgraph ${subgraphPath} --supergraph supergraphs/<the-supergraph>${this.logger.RESET_COLOR}\n`,
            ].join("\n"));
        });
    }
    /**
     * This function fetches the string template of the default README
     *
     * @returns String template
     */
    getReadmeTemplate() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return (yield (0, promises_1.readFile)((0, node_path_1.join)(process.cwd(), "tools", "ts", "assets", "README.md.njk"))).toString();
        });
    }
    /**
     * This function fetches the string template of the default graphql schema
     *
     * @returns String template
     */
    getSchemaTemplate() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return (yield (0, promises_1.readFile)((0, node_path_1.join)(process.cwd(), "tools", "ts", "assets", "schema.graphql.njk"))).toString();
        });
    }
    /**
     * Print a tree letting the user know where and what was created
     *
     * @param subgraphPath - The path to the new subgraph created
     */
    printTree(subgraphPath) {
        const dirs = subgraphPath.split("/");
        this.logger.log([
            `\nYour files can be found at ${subgraphPath}`,
            `\n|-- ${dirs[0]}`,
            `|  |-- ${dirs[1]}`,
            `|\t|-- ${dirs[2]}`,
            `|\t  |-- ${common_1.SCHEMA_FILE}`,
            `|\t  |-- ${common_1.README_FILE}`,
        ].join("\n"));
    }
}
//# sourceMappingURL=create.js.map