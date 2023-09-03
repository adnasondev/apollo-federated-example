"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggableCommand = void 0;
const commander_1 = require("commander");
const logger_1 = require("./logger");
/**
 * Extend the Commander.js Command type with logging capabilities. Hidden logger options are added
 * automatically and an initialization function is provided to insantiate the logger accessible
 * throughout the command context.
 */
class LoggableCommand extends commander_1.Command {
    constructor(name) {
        super(name);
        // Add the logger options
        this.addLoggerOptions();
    }
    /**
     * Instantiate a CLI logger object that will be accessible throughout the command context. This
     * should be called by the CommmandAction#execute function.
     */
    init() {
        this.logger = new logger_1.CliLogger(Object.assign(this.opts()));
    }
    /**
     * Add two hidden options to the command that enables control of log verbosity which gives greater
     * control when debugging.
     */
    addLoggerOptions() {
        // Set up of the verbosity option
        const verbosityOption = new commander_1.Option("-l, --level <level>", "The logger verbosity level")
            .choices(Object.values(logger_1.LoggerVerbosity))
            .env("GUVNA_LOG_LEVEL")
            .default(logger_1.LoggerVerbosity.INFO);
        // Set up the hide-progress option
        const hideProgressOption = new commander_1.Option("-h, --hide-progress", "Do not show progress spinner, recommended for CI envs")
            .env("GUVNA_HIDE_PROGRESS")
            .default(false);
        // Add the logger options to the given command
        this.passThroughOptions(true);
        this.addOption(verbosityOption);
        this.addOption(hideProgressOption);
    }
}
exports.LoggableCommand = LoggableCommand;
//# sourceMappingURL=loggable-command.js.map