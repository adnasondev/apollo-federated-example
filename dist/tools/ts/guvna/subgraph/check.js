"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.check = void 0;
const tslib_1 = require("tslib");
const promises_1 = require("node:fs/promises");
const subgraph_1 = require("@apollo/subgraph");
const glob_1 = require("glob");
const graphql_tag_1 = require("graphql-tag");
const command_action_1 = require("../command-action");
const common_1 = require("../common");
const loggable_command_1 = require("../loggable-command");
/**
 * Read in a schema.graphql file. If there is no problems with gql it is passed to
 * buildSubgraphSchema to build and validate.
 *
 * @returns The check command
 */
function check() {
    return new loggable_command_1.LoggableCommand("check")
        .description("Check the syntax subgraph schema")
        .option("-s, --subgraph <subraph-path>", "Path to the subgraph you want to check")
        .option("-a, --all", "Check all subgraphs")
        .action((options, cmd) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield CheckAction.execute(options, cmd);
    }));
}
exports.check = check;
class CheckAction extends command_action_1.CommandAction {
    /**
     * Check the GraphQL syntax.
     *
     * @param options - The options parsed by the CLI
     *
     */
    actionHandler(options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (options.subgraph) {
                return this.loader(options.subgraph);
            }
            if (options.all) {
                return this.collectGraphPaths();
            }
            this.logger.fatal("You must provide the --subgraph flag or the --all flag");
        });
    }
    /*
     * Load the schema.graphql file
     *
     * @param subgraphPath - Path to the subgraph file, provided by user, or -a
     */
    loader(subgraphPath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const schemaPath = this.joiner(this.sanitizeSubgraphPath(subgraphPath).relativePath);
            this.currentGraphPath = schemaPath;
            try {
                const schema = yield (0, promises_1.readFile)(schemaPath, {
                    encoding: "utf8",
                });
                const typeDefs = this.validateSchema(schema);
                this.validateGraph(typeDefs);
                this.logger.succeed(`GraphQL schema syntax check was successful for ${schemaPath}`);
            }
            catch (err) {
                this.logger.fatal(`Unable to check GraphQL schema file\n   ${schemaPath}\n   Does it exist?`);
            }
        });
    }
    /**
     * Check that the GraphQL schema is parseable.
     *
     * @param schema - The SDL string
     */
    validateSchema(schema) {
        try {
            return (0, graphql_tag_1.default)(schema);
        }
        catch (err) {
            this.logger.debug(err);
            this.logger.fatal(`${err.extensions.code} ${err.message.replace("[<unnamed>]")} in ${this.currentGraphPath}`);
        }
    }
    /**
     * Check that AST can be built into a consumable schema. This catches errors that gql-tag library
     * does not.
     *
     * @param typeDefs - The parsed AST tree
     */
    validateGraph(typeDefs) {
        try {
            (0, subgraph_1.buildSubgraphSchema)([{ typeDefs }]);
        }
        catch (err) {
            this.logger.debug(err);
            this.logger.fatal(`${err.extensions.code} ${err.message.replace("[<unnamed>]")} in ${this.currentGraphPath}`);
        }
    }
    /**
     * Creates a collection of paths where a domain/graph structure is present.
     * Will fail on missing schema.graphql files and failing schema.graphql
     *
     */
    collectGraphPaths() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const subgraphPathList = yield (0, glob_1.glob)(`${common_1.SUBGRAPH_DIR}/**/${common_1.SCHEMA_FILE}`);
            subgraphPathList.forEach((path) => {
                this.loader(path);
            });
        });
    }
}
//# sourceMappingURL=check.js.map