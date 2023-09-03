"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compose = void 0;
const tslib_1 = require("tslib");
const node_path_1 = require("node:path");
const composition_1 = require("@apollo/composition");
const promises_1 = require("fs/promises");
const glob_1 = require("glob");
const graphql_tag_1 = require("graphql-tag");
const command_action_1 = require("../command-action");
const common_1 = require("../common");
const loggable_command_1 = require("../loggable-command");
/**
 * Return a command that allows a user to compose a supergraph.
 *
 * @returns The compose subgraph command
 */
function compose() {
    return new loggable_command_1.LoggableCommand("compose")
        .description("Compose a supergraph")
        .option("-g, --supergraph <path>", "The path to the supergraph dir to compose")
        .option("-a, --all", "Compose all supergraphs")
        .action((options, cmd) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield ComposeAction.execute(options, cmd);
    }));
}
exports.compose = compose;
class ComposeAction extends command_action_1.CommandAction {
    /**
     * The action handler for the CLI 'compose' supergraph command.
     *
     * @param options - The options provided to the CLI by the user
     */
    actionHandler(options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (options.all) {
                const supergraphList = yield this.collectGraphPaths();
                // Runs through the list of supergraphs and waits for each one to compose before moving on
                yield Promise.all(supergraphList.map((graph) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const supergraph = this.sanitizeSupergraphPath(graph);
                    const composeRes = yield this.composeSupergraph(supergraph.name);
                    return this.composer(composeRes, supergraph);
                })));
            }
            else {
                const supergraph = this.sanitizeSupergraphPath(options.supergraph);
                const composeRes = yield this.composeSupergraph(supergraph.name);
                yield this.composer(composeRes, supergraph);
            }
        });
    }
    composer(composeRes, supergraph) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (composeRes.errors) {
                this.logger.fatal("Error composing subgraphs!", composeRes.errors);
            }
            else {
                // Write the supergraph schema file
                try {
                    yield (0, promises_1.writeFile)((0, node_path_1.join)(process.cwd(), supergraph.relativePath, "schema.graphql"), composeRes.supergraphSdl);
                }
                catch (err) {
                    this.logger.debug(err);
                    this.logger.fatal(`Could not write supergraph schema file`);
                }
                this.logger.succeed("Successfully composed supergraph");
                this.logger.log([
                    "\nYou can now serve your supergraph by running\n",
                    `  ${this.logger.SET_CYAN}guvna supergraph serve --supergraph supergraphs/${supergraph.name}${this.logger.RESET_COLOR}\n`,
                ].join("\n"));
            }
        });
    }
    /**
     * Composes the supergraph with Apollo's composeServices function, compiles all the subgraphs
     * schemas and serves it up.
     *
     * @param supergraphNameOption - The supergraph name option
     * @returns CompositionResult, lets us know if our compose failed or succeeded
     */
    composeSupergraph(supergraphName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const supergraphConfig = yield this.getParsedSupergraphConfig((0, node_path_1.join)(common_1.SUPERGRAPH_DIR, supergraphName));
            const subgraphs = supergraphConfig.subgraphs;
            let subgraphSchemas;
            try {
                subgraphSchemas = yield Promise.all(supergraphConfig.subgraphs.map((subgraph) => (0, promises_1.readFile)((0, node_path_1.join)(subgraph.path, "schema.graphql"))));
            }
            catch (err) {
                if (err.code === "ENOENT") {
                    this.logger.fatal(`Unable to read subgraph schema specified in supergraph config\n   ${err.path}\n   Does it exist?`);
                }
                else {
                    this.logger.fatal("Error reading subgraph files", err);
                }
            }
            return (0, composition_1.composeServices)(subgraphSchemas.map((schemaSdl, index) => {
                return {
                    typeDefs: (0, graphql_tag_1.default)(schemaSdl.toString()),
                    name: subgraphs[index].path,
                    url: "[https-endpoint-placeholder]",
                };
            }));
        });
    }
    /**
     * Creates a collection of supergaph paths domain level deep.
     */
    collectGraphPaths() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                return yield (0, glob_1.glob)(`${common_1.SUPERGRAPH_DIR}/*/*.graphql`);
            }
            catch (err) {
                this.logger.fatal("There was an error gathering the supergraphs", err);
            }
        });
    }
}
//# sourceMappingURL=compose.js.map