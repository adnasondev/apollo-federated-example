"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ello = void 0;
const tslib_1 = require("tslib");
const command_action_1 = require("../command-action");
const loggable_command_1 = require("../loggable-command");
/**
 * Return a command that simply prints a static response. This function shows how to separate
 * commands into their own files.
 *
 * @returns The sub command
 */
function ello() {
    return new loggable_command_1.LoggableCommand("ello").description("say hello").action(function (options, cmd) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield ElloAction.execute(options, cmd);
        });
    });
}
exports.ello = ello;
class ElloAction extends command_action_1.CommandAction {
    /**
     * Execute the action handler for the 'ello command.
     */
    actionHandler() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.logger.log("🧐 'ello guvna!");
            this.logger.verbose("🧐 'ello verbose guvna!");
            this.logger.debug("🧐 'ello debug guvna!");
            this.logger.silly("🧐 'ello silly guvna!");
        });
    }
}
//# sourceMappingURL=index.js.map