"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subgraph = void 0;
const loggable_command_1 = require("../loggable-command");
const check_1 = require("./check");
const create_1 = require("./create");
const diff_1 = require("./diff");
const lint_1 = require("./lint");
const register_1 = require("./register");
/**
 * The parent command to which all nested 'subgraph' commands will be added.
 *
 * @returns The subraph sub command
 */
function subgraph() {
    const cmd = new loggable_command_1.LoggableCommand("subgraph");
    cmd.description("Collection of subgraph commands");
    // Add nested sub commands
    cmd.addCommand((0, create_1.create)());
    cmd.addCommand((0, register_1.register)());
    cmd.addCommand((0, lint_1.lint)());
    cmd.addCommand((0, check_1.check)());
    cmd.addCommand((0, diff_1.diff)());
    return cmd;
}
exports.subgraph = subgraph;
//# sourceMappingURL=index.js.map