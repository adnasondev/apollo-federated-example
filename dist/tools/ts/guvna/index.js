"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkExecutionContextIsRoot = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const common_1 = require("./common");
const ello_1 = require("./ello");
const loggable_command_1 = require("./loggable-command");
const subgraph_1 = require("./subgraph");
const supergraph_1 = require("./supergraph");
const program = new loggable_command_1.LoggableCommand();
program
    .name("guvna")
    .description("CLI to enable Fidelity GraphQL governance process")
    .version("1.0.0-rc.0")
    .hook("preAction", (thisCommand, actionCommand) => {
    checkExecutionContextIsRoot(thisCommand.name(), actionCommand);
});
// Add commands
program.addCommand((0, ello_1.ello)());
program.addCommand((0, subgraph_1.subgraph)());
program.addCommand((0, supergraph_1.supergraph)());
program.parseAsync();
/**
 * Ensure that guvna commands are running in the root directory.
 *
 * @throws Will throw and error and stop execution if users is no in project root.
 */
function checkExecutionContextIsRoot(commandName, action) {
    action.init();
    if (!(0, node_fs_1.existsSync)((0, node_path_1.join)(process.cwd(), "package.json"))) {
        action.logger.fatal([
            `The command \`${commandName} ${action.name()} ...\`, must be executed in the root`,
            `of the ${common_1.ROOT_DIR} repository. For details on`,
            "usage see the README.md:",
            `${action.logger.SET_CYAN}https://github.com/Fidelity-Green/federated-graphql-governance${action.logger.RESET_COLOR}\n`,
        ].join("\n"));
    }
}
exports.checkExecutionContextIsRoot = checkExecutionContextIsRoot;
//# sourceMappingURL=index.js.map