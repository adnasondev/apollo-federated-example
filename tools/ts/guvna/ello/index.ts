import { CommandAction } from "../command-action";
import { LoggableCommand } from "../loggable-command";

/**
 * Return a command that simply prints a static response. This function shows how to separate
 * commands into their own files.
 *
 * @returns The sub command
 */
export function ello() {
  return new LoggableCommand("ello").description("say hello").action(async function (options, cmd) {
    await ElloAction.execute(options, cmd);
  });
}

class ElloAction extends CommandAction {
  /**
   * Execute the action handler for the 'ello command.
   */
  async actionHandler() {
    this.logger.log("🧐 'ello guvna!");
    this.logger.verbose("🧐 'ello verbose guvna!");
    this.logger.debug("🧐 'ello debug guvna!");
    this.logger.silly("🧐 'ello silly guvna!");
  }
}
