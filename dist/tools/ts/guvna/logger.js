"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CliLogger = exports.LoggerVerbosity = exports.SPINNER_LINE_BREAK = exports.RESET_COLOR = exports.SET_CYAN = exports.SET_BLUE = exports.SET_GREEN = exports.SET_YELLOW = exports.SET_RED = void 0;
const tslib_1 = require("tslib");
const ora = require("ora");
// Terminal color codes
exports.SET_RED = "\x1b[31m";
exports.SET_YELLOW = "\x1b[33m";
exports.SET_GREEN = "\x1b[32m";
exports.SET_BLUE = "\x1b[34m";
exports.SET_CYAN = "\x1b[36m";
exports.RESET_COLOR = "\x1b[0m";
exports.SPINNER_LINE_BREAK = `${exports.SET_CYAN}--------------------------------------------------------------------------------${exports.RESET_COLOR}\n`;
var LoggerVerbosity;
(function (LoggerVerbosity) {
    LoggerVerbosity["FATAL"] = "FATAL";
    LoggerVerbosity["ERROR"] = "ERROR";
    LoggerVerbosity["WARN"] = "WARN";
    LoggerVerbosity["INFO"] = "INFO";
    LoggerVerbosity["VERBOSE"] = "VERBOSE";
    LoggerVerbosity["DEBUG"] = "DEBUG";
    LoggerVerbosity["SILLY"] = "SILLY";
})(LoggerVerbosity || (exports.LoggerVerbosity = LoggerVerbosity = {}));
var LoggerVerbosityLevel;
(function (LoggerVerbosityLevel) {
    LoggerVerbosityLevel[LoggerVerbosityLevel["FATAL"] = 0] = "FATAL";
    LoggerVerbosityLevel[LoggerVerbosityLevel["ERROR"] = 1] = "ERROR";
    LoggerVerbosityLevel[LoggerVerbosityLevel["WARN"] = 2] = "WARN";
    LoggerVerbosityLevel[LoggerVerbosityLevel["INFO"] = 3] = "INFO";
    LoggerVerbosityLevel[LoggerVerbosityLevel["VERBOSE"] = 4] = "VERBOSE";
    LoggerVerbosityLevel[LoggerVerbosityLevel["DEBUG"] = 5] = "DEBUG";
    LoggerVerbosityLevel[LoggerVerbosityLevel["SILLY"] = 6] = "SILLY";
})(LoggerVerbosityLevel || (LoggerVerbosityLevel = {}));
/**
 * A logger class that is tailored to CLI applications. It has a spinner to indicate progress and
 * various log level functions that can be controlled via the configured verbosity level.
 */
class CliLogger {
    constructor(options) {
        // Allow read-only access to color codes
        this.SET_RED = exports.SET_RED;
        this.SET_YELLOW = exports.SET_YELLOW;
        this.SET_GREEN = exports.SET_GREEN;
        this.SET_BLUE = exports.SET_BLUE;
        this.SET_CYAN = exports.SET_CYAN;
        this.RESET_COLOR = exports.RESET_COLOR;
        this.spinner = ora();
        this.tmpSpinText = "";
        this.tmpWasSpinning = false;
        this.hideProgress = options.hideProgress;
        this.level = LoggerVerbosityLevel[options.level];
    }
    /**
     * Set the text that is displayed to the right of the spinner in the terminal.
     */
    set spinText(newText) {
        this.spinner.text = newText;
    }
    /**
     * Get the text that is currently displayed to the right of the spinner in the terminal.
     */
    get spinText() {
        return this.spinner.text;
    }
    /**
     * In the CLI it is reasurring to see the spinner loop a couple of times even if the work being done
     * completes almost instantly. You can use this function to achieve that pause by including it in a
     * Promise.all() statement along with the task being done.
     *
     * @param pauseInMs - The time in ms that the visual pause should last
     * @returns resolves an empty promise on completion
     */
    visualPause(pauseInMs = 750) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.hideProgress) {
                return new Promise((resolve) => {
                    setTimeout(resolve, pauseInMs);
                });
            }
            return Promise.resolve();
        });
    }
    /**
     * Log the things and exit the process with a non-zero exit code.
     *
     * @param message - The string to be logged
     */
    fatal(message, err) {
        if (this.spinner.isSpinning) {
            this.spinner.prefixText = "";
            this.spinner.stop();
        }
        // Create a buffer of whitespace around error for better readability
        this.log();
        // Log the error
        this.error(`${exports.SET_RED} ✖${exports.RESET_COLOR} ${message}`, err);
        // Create a buffer of whitespace around error for better readability
        this.log();
        // exit the process with non-zero exit code to indicate an error to calling systems
        process.exit(1);
    }
    /**
     * Log error criticality.
     *
     * @param message - The string to be logged
     */
    error(message, err) {
        if (this._doesPassVerbosityGate(LoggerVerbosityLevel.ERROR)) {
            this.pauseSpin();
            console.error(message);
            // If there is additional arguments given to log, pass them to the logger now
            if (err) {
                console.error("\n", err);
            }
            this.resumeSpin();
        }
    }
    /**
     * Log warn criticality.
     *
     * @param message - The string to be logged
     */
    warn(message) {
        if (this._doesPassVerbosityGate(LoggerVerbosityLevel.WARN)) {
            this.pauseSpin();
            console.warn(`${exports.SET_YELLOW} ⚠${exports.RESET_COLOR}`, message);
            this.resumeSpin();
        }
    }
    /**
     * Log info criticality.
     *
     * @param message - The string to be logged
     */
    info(message) {
        if (this._doesPassVerbosityGate(LoggerVerbosityLevel.INFO)) {
            this.pauseSpin();
            console.log(`${exports.SET_BLUE} ℹ${exports.RESET_COLOR}`, message);
            this.resumeSpin();
        }
    }
    /**
     * Log info criticality.
     *
     * @param message - The string to be logged
     */
    log(message = "") {
        if (this._doesPassVerbosityGate(LoggerVerbosityLevel.INFO)) {
            this.pauseSpin();
            console.log(message);
            this.resumeSpin();
        }
    }
    /**
     * Log verbose criticality.
     *
     * @param message - The string to be logged
     */
    verbose(message) {
        if (this._doesPassVerbosityGate(LoggerVerbosityLevel.VERBOSE)) {
            this.pauseSpin();
            console.debug(message);
            this.resumeSpin();
        }
    }
    /**
     * Log debug criticality.
     *
     * @param message - The string to be logged or an error object
     */
    debug(message) {
        if (this._doesPassVerbosityGate(LoggerVerbosityLevel.DEBUG)) {
            this.pauseSpin();
            console.debug(message);
            this.resumeSpin();
        }
    }
    /**
     * Log silly criticality.
     *
     * @param message - The string to be logged
     */
    silly(message) {
        if (this._doesPassVerbosityGate(LoggerVerbosityLevel.SILLY)) {
            this.pauseSpin();
            console.debug(message);
            this.resumeSpin();
        }
    }
    /**
     * Start the console spinner and optionally add text to be displayed.
     *
     * @param text - The text to be displayed to the right of the spinner
     */
    spin(text) {
        if (!this.hideProgress) {
            this.spinner.start(text);
        }
        else if (text) {
            this.info(text);
        }
    }
    /**
     * Stop the spinner.
     */
    stop() {
        this.spinner.stop();
    }
    /**
     * Set text to be shown above the spinner with a check mark next to it indicating a successful
     * task completion. The spinner will continue.
     *
     * @param text - The text to be displayed above the spinner
     */
    succeed(text) {
        if (this._doesPassVerbosityGate(LoggerVerbosityLevel.INFO)) {
            const currentText = this.pauseSpin();
            if (text) {
                console.log(`${exports.SET_GREEN} ✔${exports.RESET_COLOR}`, text);
            }
            else {
                // If we were not given any text we'll assume we should take the current text and mark it
                // as successful, and remove it from the active spinner text.
                this.spinner.text = "";
                console.log(`${exports.SET_GREEN} ✔${exports.RESET_COLOR}`, currentText);
            }
            this.resumeSpin();
        }
    }
    /**
     * Set text to be shown above the spinner with a check mark next to it indicating a successful
     * task completion. The spinner will continue.
     *
     * @param text - The text to be displayed above the spinner
     */
    fail(text) {
        if (this._doesPassVerbosityGate(LoggerVerbosityLevel.ERROR)) {
            const currentText = this.pauseSpin();
            if (text) {
                console.error(`${exports.SET_RED} ✖${exports.RESET_COLOR}`, text !== null && text !== void 0 ? text : currentText);
            }
            else {
                // If we were not given any text we'll assume we should take the current text and mark it
                // as successful, and remove it from the active spinner text.
                this.spinner.text = "";
                console.error(`${exports.SET_RED} ✖${exports.RESET_COLOR}`, currentText);
            }
            this.resumeSpin();
        }
    }
    /**
     * Stop the spinner and display a success message.
     *
     * @param message - The message to be displayed
     */
    stopSucceed(message) {
        this.spinner.prefixText = "";
        this.spinner.stop();
        this.succeed(message);
    }
    /**
     * Stop the spinner and display an info message.
     *
     * @param message - The message to be displayed
     */
    stopInfo(message) {
        this.spinner.prefixText = "";
        this.spinner.stop();
        this.info(message);
    }
    /**
     * Stop the spinner and display a warning message.
     *
     * @param message - The message to be displayed
     */
    stopWarn(message) {
        this.spinner.prefixText = "";
        this.spinner.stop();
        this.warn(message);
    }
    /**
     * Stop the spinner and display a failure message.
     *
     * @param message - The message to be displayed
     */
    stopFail(message) {
        this.spinner.prefixText = "";
        this.spinner.stop();
        this.fail(message);
    }
    /**
     * Return true if the gate is passed based on this logger's level level.
     *
     * @param gate - The level level being checked
     * @returns true if the gate is passed; else false
     */
    _doesPassVerbosityGate(gate) {
        if (this.level >= gate) {
            return true;
        }
        return false;
    }
    /**
     * Pause the spinner and store current values for resumption.
     *
     * @returns The current text of the spinner
     */
    pauseSpin() {
        this.tmpSpinText = this.spinner.text;
        this.tmpWasSpinning = this.spinner.isSpinning;
        if (this.tmpWasSpinning) {
            this.spinner.prefixText = "";
            this.spinner.text = "";
            this.spinner.stop();
        }
        return this.tmpSpinText;
    }
    /**
     * Resume spinning (if the spinner was spinning before)
     */
    resumeSpin() {
        this.spinner.prefixText = exports.SPINNER_LINE_BREAK;
        if (this.tmpWasSpinning) {
            // console.log("resume that spin???");
            this.spinner.start(this.tmpSpinText);
        }
    }
}
exports.CliLogger = CliLogger;
//# sourceMappingURL=logger.js.map