"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diff = void 0;
const tslib_1 = require("tslib");
const node_path_1 = require("node:path");
const subgraph_1 = require("@apollo/subgraph");
const core_1 = require("@graphql-inspector/core");
const graphql_tag_1 = require("graphql-tag");
const command_action_1 = require("../command-action");
const common_1 = require("../common");
const loggable_command_1 = require("../loggable-command");
/**
 * Return a command that allows a diff a supergraph using the revison.
 *
 * @returns The diff supergraph command
 */
function diff() {
    return new loggable_command_1.LoggableCommand("diff")
        .description("Find the changes made to a supergraph")
        .requiredOption("-s, --supergraph <supergraph-path>", "Path to the supergraph you want to diff")
        .option("-o, --old <old-revision>", "The old revision git ID", "HEAD")
        .option("-n, --new <new-revision>", "The new revision git ID")
        .action((options, cmd) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield SuperDiffAction.execute(options, cmd);
    }));
}
exports.diff = diff;
class SuperDiffAction extends command_action_1.CommandAction {
    /**
     * The action handler for the CLI 'diff' command.
     *
     * @param options - The options provided by the user to the CLI
     */
    actionHandler(options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const supergraph = this.sanitizeSupergraphPath(options.supergraph);
            const schemaFile = supergraph.relativePath;
            let oldSchema;
            let newSchema;
            try {
                oldSchema = yield this.getOldSchema((0, node_path_1.join)(schemaFile, common_1.SCHEMA_FILE), options.old);
                newSchema = yield this.getNewSchema((0, node_path_1.join)(schemaFile, common_1.SCHEMA_FILE), options.new);
            }
            catch (err) {
                this.logger.fatal("Unable to diff supergraph due to errors in schema", err);
            }
            const changes = yield (0, core_1.diff)((0, subgraph_1.buildSubgraphSchema)((0, graphql_tag_1.default)(oldSchema)), (0, subgraph_1.buildSubgraphSchema)((0, graphql_tag_1.default)(newSchema)));
            this.prettyPrint(changes);
        });
    }
}
//# sourceMappingURL=diff.js.map