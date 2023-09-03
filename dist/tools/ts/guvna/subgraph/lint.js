"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lint = void 0;
const tslib_1 = require("tslib");
const node_path_1 = require("node:path");
const eslint_1 = require("eslint");
const command_action_1 = require("../command-action");
const loggable_command_1 = require("../loggable-command");
/**
 * Lints the subgraph schema file provided by the user.
 *
 * @returns The lint command
 */
function lint() {
    return new loggable_command_1.LoggableCommand("lint")
        .usage(`-s ${(0, node_path_1.join)("subgraphs", "<domain>", "<subgraph-name>")}`)
        .description("Lint a subgraph to enforce standards")
        .requiredOption("-s, --subgraph <path>", "The path to the subgraph dir to lint")
        .option("-f, --fix", "Allows eslint to fix auto-fixable errors")
        .action(function (options, cmd) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield LintAction.execute(options, cmd);
        });
    });
}
exports.lint = lint;
class LintAction extends command_action_1.CommandAction {
    /**
     * Executing the linter.
     *
     * @param options - The Lint command's CLI options
     */
    actionHandler(options) {
        var _a;
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const schemaPath = this.joiner(this.sanitizeSubgraphPath(options.subgraph).relativePath);
            const isFixFlag = options.fix;
            const eslint = new eslint_1.ESLint({
                fix: isFixFlag,
                useEslintrc: true,
            });
            try {
                // Lint the specified subgraph file
                const results = yield eslint.lintFiles([schemaPath]);
                // Fix the files if specified
                if (isFixFlag) {
                    yield eslint_1.ESLint.outputFixes(results);
                }
                // Format the results so they are easily readable in the console
                const formatter = yield eslint.loadFormatter("stylish");
                // Use relative paths instead of the longer absolute paths for better readability
                const resultText = ((_a = formatter.format(results)) !== null && _a !== void 0 ? _a : "").replaceAll(process.cwd() + "/", "");
                // Print the formatted result or a success message
                if (resultText) {
                    this.logger.error(resultText);
                }
                else {
                    this.logger.succeed("Linting completed");
                }
                // Set the exit code to a non-zero value if there are unfixable errors
                results.forEach((result) => {
                    if (result.errorCount > results.fixableErrorCount ||
                        (!isFixFlag && result.errorCount > 0)) {
                        this.logger.stop();
                        process.exit(1);
                    }
                });
            }
            catch (err) {
                this.logger.fatal(`Unable to lint subgraph schema file\n   ${schemaPath}\n   Does it exist?`);
            }
        });
    }
}
//# sourceMappingURL=lint.js.map