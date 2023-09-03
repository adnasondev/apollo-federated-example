import { Command, Option } from "commander";

import { CliLogger, LoggerOptions, LoggerVerbosity } from "./logger";

/**
 * Extend the Commander.js Command type with logging capabilities. Hidden logger options are added
 * automatically and an initialization function is provided to insantiate the logger accessible
 * throughout the command context.
 */
export class LoggableCommand extends Command {
  logger: CliLogger;

  constructor(name?: string) {
    super(name);
    // Add the logger options
    this.addLoggerOptions();
  }

  /**
   * Instantiate a CLI logger object that will be accessible throughout the command context. This
   * should be called by the CommmandAction#execute function.
   */
  init() {
    this.logger = new CliLogger(Object.assign(this.opts()) as LoggerOptions);
  }

  /**
   * Add two hidden options to the command that enables control of log verbosity which gives greater
   * control when debugging.
   */
  private addLoggerOptions() {
    // Set up of the verbosity option
    const verbosityOption = new Option("-l, --level <level>", "The logger verbosity level")
      .choices(Object.values(LoggerVerbosity))
      .env("GUVNA_LOG_LEVEL")
      .default(LoggerVerbosity.INFO);

    // Set up the hide-progress option
    const hideProgressOption = new Option(
      "-h, --hide-progress",
      "Do not show progress spinner, recommended for CI envs"
    )
      .env("GUVNA_HIDE_PROGRESS")
      .default(false);

    // Add the logger options to the given command
    this.passThroughOptions(true);
    this.addOption(verbosityOption);
    this.addOption(hideProgressOption);
  }
}
