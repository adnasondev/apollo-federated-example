"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandAction = void 0;
const tslib_1 = require("tslib");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const core_1 = require("@graphql-inspector/core");
const child_process_1 = require("child_process");
const yaml_1 = require("yaml");
const common_1 = require("./common");
/**
 * A CommandAction instance is meant to be invoked by a commander.js command action handler. This
 * class should be extended with a custom `actionHandler` method implementation that will be
 * invoked as part of the CommandAction.execute static method.
 */
class CommandAction {
    // eslint-disable-next-line prettier/prettier
    constructor(options, cmd) {
        this.options = options;
        this.cmd = cmd;
        this.logger = cmd.logger;
    }
    /**
     * Create an instance of and execute an action for a specific CLI command.
     *
     * @param options - The CLI options passed to the command
     * @param cmd - The CLI command being invoked
     */
    static execute(options, cmd) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            cmd.init();
            cmd.logger.spin();
            yield cmd.logger.visualPause();
            const action = new this(options, cmd);
            yield action.actionHandler(options);
            cmd.logger.stop();
        });
    }
    /**
     * Ensure the given subgraph path follows the appropriate pattern.
     *
     * @param subgraphOption - The subgraph path given from the CLI user
     * @returns The sanitized paths to the subgraph directory and name of the subgraph
     */
    sanitizeSubgraphPath(subgraphOption) {
        var _a;
        // Ensure we're given a relative path to the subgraph
        const relativePath = this.makePathIntoRelativePath(subgraphOption);
        // Pick out the supergraph directory name from the path
        const [, domain, subgraph] = (_a = relativePath.match(/(?:subgraphs(?:\/|\\))?([a-z0-9-]+)(?:\/|\\)([a-z0-9-]+)(?:(?:\/|\\).*)?/)) !== null && _a !== void 0 ? _a : [];
        if (!domain || !subgraph) {
            this.logger.fatal("--subgraph must be a path to the subgraph directory, e.g.:subgraph/customer-management/ap222222-identity");
        }
        return new common_1.SubgraphGraphDeclaration(domain, subgraph);
    }
    /**
     * Clean up joining the schema.graphql to the end of file names.
     *
     * @param graph - The file name path we want to add schema tag too
     * @returns - The joined file name path with the schema tag
     */
    joiner(graph) {
        return (0, node_path_1.join)(graph, "schema.graphql");
    }
    /**
     * Gets the old stringified version of the file by the commit hash, using git.
     *
     * @param schemaFile - The schema file we want the old version of
     * @param revision - The commit hash used to reference the ID in git
     */
    getOldSchema(schemaFile, revision) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const git = (0, child_process_1.spawn)("git", ["show", `${revision}:${schemaFile}`]);
            let res = "";
            git.stdout.on("data", (data) => {
                res += data;
            });
            let errMsg = "Error during git process";
            git.stderr.on("data", (data) => {
                if (data.toString().includes("exists on disk, but not in")) {
                    errMsg = `Cannot calculate a diff\n\n   ${schemaFile} has not been committed in old revision ${revision}`;
                }
                else {
                    errMsg = `Unknown Git error\n\n   ${data}`;
                }
            });
            return new Promise((resolve) => {
                git.on("close", (code) => {
                    if (code === 0) {
                        resolve(res);
                    }
                    else {
                        this.logger.fatal(errMsg);
                    }
                });
            });
        });
    }
    /**
     * Gets the new stringified version of the file by the commit hash, using git.
     *
     * @param schemaFile - The schema file we want the new version of
     * @param revision - Optional git commit hash used to reference the ID in git
     */
    getNewSchema(schemaFile, revision) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!revision) {
                // If a specific revision was not given simply read the current working directory
                try {
                    return (yield (0, promises_1.readFile)((0, node_path_1.join)(process.cwd(), schemaFile))).toString();
                }
                catch (err) {
                    this.logger.fatal(`Unable to read schema file in working directory\n   ${(0, node_path_1.join)(process.cwd(), schemaFile)}\n   Does it exist?`);
                }
            }
            return this.getOldSchema(schemaFile, revision);
        });
    }
    /**
     * Beautifies and logs changes.
     *
     * @param changes - Array of changes that occured in the schema file
     */
    prettyPrint(changes) {
        this.logger.log();
        if (!changes) {
            this.logger.info("New schema - all type definitions are new");
            return;
        }
        if (changes.length < 1) {
            this.logger.info("No functional changes");
            return;
        }
        const breakingChangesCount = changes.filter((change) => change.criticality.level === core_1.CriticalityLevel.Breaking).length;
        this.logger.log(`Detected the following changes (${changes.length}) between schemas:\n`);
        changes
            .filter((change) => {
            return !common_1.FEDERATION_TYPES.includes(change.path);
        })
            .forEach((change) => {
            if (change.criticality.level === core_1.CriticalityLevel.Breaking) {
                this.logger.fail(change.message);
            }
            else if (change.criticality.level === core_1.CriticalityLevel.Dangerous) {
                this.logger.warn(change.message);
            }
            else if (change.criticality.level === core_1.CriticalityLevel.NonBreaking) {
                this.logger.succeed(change.message);
            }
            else {
                this.logger.warn(change.message);
            }
        });
        this.logger.log();
        if (breakingChangesCount > 0) {
            this.logger.fail(`Detected ${breakingChangesCount} breaking change(s)\n`);
        }
        else {
            this.logger.info("Detected 0 breaking changes\n");
        }
    }
    /**
     * Ensure the given supergraph path follows the appropriate pattern.
     *
     * @param supergraphOption - The supergraph path given from the CLI user
     * @returns The sanitized paths to the supergraph irectory and the name of the supergraph
     */
    sanitizeSupergraphPath(supergraphOption) {
        var _a;
        // Ensure we're given a relative path to the supergraph
        const relativePath = this.makePathIntoRelativePath(supergraphOption);
        // Pick out the supergraph directory name from the path
        const [, supergraph] = (_a = relativePath.match(/(?:supergraphs(?:\/|\\))?([a-z0-9-]+)(?:(?:\/|\\).*)?/)) !== null && _a !== void 0 ? _a : [];
        if (!supergraph) {
            this.logger.fatal("--supergraph must be a path to the supergraphs directory, e.g.:\nsupergraphs/ap222222-fidelity-supergraph");
        }
        return new common_1.SupergraphGraphDeclaration(supergraph);
    }
    /**
     * Parse and return the supergraph configuration file.
     *
     * @param supergraphPath - The absolute path to supergraph directory
     * @returns The parsed supergraph config.yml file
     */
    getParsedSupergraphConfig(supergraphPath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const absolutePath = (0, node_path_1.join)(supergraphPath, "config.yml");
            let ymlContents;
            // Ensure the file exists
            try {
                ymlContents = yield (0, promises_1.readFile)(absolutePath);
            }
            catch (err) {
                this.logger.debug(err);
                this.logger.fatal(`Unable to read supergraph config file:\n   ${absolutePath}\n   Does it exist?`);
            }
            // Parse the file
            try {
                return (0, yaml_1.parse)(ymlContents.toString());
            }
            catch (err) {
                this.logger.debug(err);
                this.logger.fatal(`Unable to parse supergraph config file: ${absolutePath}`);
            }
        });
    }
    /**
     * Read the supergraph SDL file.
     *
     * @param supergraphPath - The path to the supergraph directory
     * @returns The supergraph SDL
     */
    getSupergraphSdl(supergraphPath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const schemaFilePath = (0, node_path_1.join)(supergraphPath, common_1.SCHEMA_FILE);
            try {
                const fileContents = yield (0, promises_1.readFile)(schemaFilePath);
                return fileContents.toString();
            }
            catch (err) {
                this.logger.debug(err);
                this.logger.fatal(["Unable to read supergraph schema at file:", schemaFilePath, "Does it exist?\n"].join("\n   "));
            }
        });
    }
    makePathIntoRelativePath(path) {
        if ((0, node_path_1.isAbsolute)(path)) {
            // get to the relative path
            return path.replace(process.cwd(), "");
        }
        // The path is already relative
        return path;
    }
}
exports.CommandAction = CommandAction;
//# sourceMappingURL=command-action.js.map