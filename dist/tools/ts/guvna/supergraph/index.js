"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supergraph = void 0;
const commander_1 = require("commander");
const compose_1 = require("./compose");
const diff_1 = require("./diff");
const serve_1 = require("./serve");
/**
 * The parent command to which all nested 'supergraph' commands will be added.
 *
 * @returns The supergraph sub command
 */
function supergraph() {
    const cmd = new commander_1.Command("supergraph");
    cmd.description("Collection of supergraph commands");
    // Add nested sub commands
    cmd.addCommand((0, serve_1.serve)());
    cmd.addCommand((0, compose_1.compose)());
    cmd.addCommand((0, diff_1.diff)());
    return cmd;
}
exports.supergraph = supergraph;
//# sourceMappingURL=index.js.map