import { existsSync } from "node:fs";
import { join } from "node:path";

import { ROOT_DIR } from "./common";
import { ello } from "./ello";
import { LoggableCommand } from "./loggable-command";
import { subgraph } from "./subgraph";
import { supergraph } from "./supergraph";

const program = new LoggableCommand();

program
  .name("guvna")
  .description("CLI to enable Fidelity GraphQL governance process")
  .version("1.0.0-rc.0")
  .hook("preAction", (thisCommand, actionCommand) => {
    checkExecutionContextIsRoot(thisCommand.name(), actionCommand as LoggableCommand);
  });

// Add commands
program.addCommand(ello());
program.addCommand(subgraph());
program.addCommand(supergraph());

program.parseAsync();

/**
 * Ensure that guvna commands are running in the root directory.
 *
 * @throws Will throw and error and stop execution if users is no in project root.
 */
export function checkExecutionContextIsRoot(commandName: string, action: LoggableCommand): void {
  action.init();

  if (!existsSync(join(process.cwd(), "package.json"))) {
    action.logger.fatal(
      [
        `The command \`${commandName} ${action.name()} ...\`, must be executed in the root`,
        `of the ${ROOT_DIR} repository. For details on`,
        "usage see the README.md:",
        `${action.logger.SET_CYAN}https://github.com/Fidelity-Green/federated-graphql-governance${action.logger.RESET_COLOR}\n`,
      ].join("\n")
    );
  }
}
