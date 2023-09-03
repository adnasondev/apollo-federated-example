"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const tslib_1 = require("tslib");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const yaml_1 = require("yaml");
const command_action_1 = require("../command-action");
const loggable_command_1 = require("../loggable-command");
/**
 * Return a command that allows a user to register the specified subgraph with the specified
 * supergraph.
 *
 * @returns The register sub command
 */
function register() {
    return new loggable_command_1.LoggableCommand("register")
        .description("Register a subgraph with a supergraph")
        .requiredOption("-s, --subgraph <path>", "The path to the subgraph dir to register")
        .requiredOption("-g, --supergraph <path>", "The path to the supergraph dir to register with")
        .action((options, cmd) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield RegsiterAction.execute(options, cmd);
    }));
}
exports.register = register;
class RegsiterAction extends command_action_1.CommandAction {
    /**
     * The action handler for the CLI 'register' command.
     *
     * @param options - The options provided to the CLI command
     */
    actionHandler(options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const subgraph = this.sanitizeSubgraphPath(options.subgraph);
            const supergraph = this.sanitizeSupergraphPath(options.supergraph);
            const supergraphConfig = yield this.getParsedSupergraphConfig(supergraph.absolutePath);
            if (this.isSubgraphRegistered(supergraphConfig, subgraph.relativePosixPath)) {
                this.logger.warn(`subgraph ${subgraph.name} is already registered with supergraph ${supergraph.name}`);
            }
            else {
                yield this.addSubgraphToSupergraph(supergraphConfig, supergraph, subgraph);
                this.logger.succeed("The subgraph has been successfully registered with the supergraph");
                this.logger.log([
                    "\nYou can now compose your supergraph by running\n",
                    `  ${this.logger.SET_CYAN}guvna supergraph compose --supergraph supergraphs/${supergraph.name}${this.logger.RESET_COLOR}\n`,
                ].join("\n"));
            }
        });
    }
    /**
     * Check if the given subgraph path is already present in the supergraph config.
     *
     * @param config - The supergraph configuration
     * @param relativeSubgraphPosixPath - The path of the subgraph to be checked for registration
     * @returns True if the subgraph is already registered with the supergraph; else false
     */
    isSubgraphRegistered(config, relativeSubgraphPosixPath) {
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
    addSubgraphToSupergraph(config, supergraph, subgraph) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            config.subgraphs.push({
                path: subgraph.relativePosixPath,
            });
            try {
                yield (0, promises_1.writeFile)((0, node_path_1.join)(supergraph.absolutePath, "config.yml"), (0, yaml_1.stringify)(config));
            }
            catch (err) {
                this.logger.fatal(`Unable to write to supergraph config file:\n   ${supergraph.relativePath}`);
            }
        });
    }
}
//# sourceMappingURL=register.js.map