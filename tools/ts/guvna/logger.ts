import * as ora from "ora";

// Terminal color codes
export const SET_RED = "\x1b[31m";
export const SET_YELLOW = "\x1b[33m";
export const SET_GREEN = "\x1b[32m";
export const SET_BLUE = "\x1b[34m";
export const SET_CYAN = "\x1b[36m";
export const RESET_COLOR = "\x1b[0m";
export const SPINNER_LINE_BREAK = `${SET_CYAN}--------------------------------------------------------------------------------${RESET_COLOR}\n`;

export enum LoggerVerbosity {
  FATAL = "FATAL",
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  VERBOSE = "VERBOSE",
  DEBUG = "DEBUG",
  SILLY = "SILLY",
}

enum LoggerVerbosityLevel {
  FATAL = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  VERBOSE = 4,
  DEBUG = 5,
  SILLY = 6,
}

export interface LoggerOptions {
  hideProgress: boolean;
  level: LoggerVerbosity;
}

/**
 * A logger class that is tailored to CLI applications. It has a spinner to indicate progress and
 * various log level functions that can be controlled via the configured verbosity level.
 */
export class CliLogger {
  // Allow read-only access to color codes
  public readonly SET_RED = SET_RED;
  public readonly SET_YELLOW = SET_YELLOW;
  public readonly SET_GREEN = SET_GREEN;
  public readonly SET_BLUE = SET_BLUE;
  public readonly SET_CYAN = SET_CYAN;
  public readonly RESET_COLOR = RESET_COLOR;

  private spinner: ora.Ora;
  private tmpSpinText: string;
  private tmpWasSpinning: boolean;
  private hideProgress: boolean;
  private level: LoggerVerbosityLevel;

  constructor(options: LoggerOptions) {
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
  async visualPause(pauseInMs = 750): Promise<void> {
    if (!this.hideProgress) {
      return new Promise((resolve) => {
        setTimeout(resolve, pauseInMs);
      });
    }

    return Promise.resolve();
  }

  /**
   * Log the things and exit the process with a non-zero exit code.
   *
   * @param message - The string to be logged
   */
  fatal(message: string, err?: any) {
    if (this.spinner.isSpinning) {
      this.spinner.prefixText = "";
      this.spinner.stop();
    }
    // Create a buffer of whitespace around error for better readability
    this.log();
    // Log the error
    this.error(`${SET_RED} ✖${RESET_COLOR} ${message}`, err);
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
  error(message: string, err?: any) {
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
  warn(message: string) {
    if (this._doesPassVerbosityGate(LoggerVerbosityLevel.WARN)) {
      this.pauseSpin();
      console.warn(`${SET_YELLOW} ⚠${RESET_COLOR}`, message);
      this.resumeSpin();
    }
  }

  /**
   * Log info criticality.
   *
   * @param message - The string to be logged
   */
  info(message: string) {
    if (this._doesPassVerbosityGate(LoggerVerbosityLevel.INFO)) {
      this.pauseSpin();
      console.log(`${SET_BLUE} ℹ${RESET_COLOR}`, message);
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
  verbose(message: string) {
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
  debug(message: string | Error) {
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
  silly(message: string) {
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
  spin(text?: string) {
    if (!this.hideProgress) {
      this.spinner.start(text);
    } else if (text) {
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
  succeed(text?: string) {
    if (this._doesPassVerbosityGate(LoggerVerbosityLevel.INFO)) {
      const currentText = this.pauseSpin();

      if (text) {
        console.log(`${SET_GREEN} ✔${RESET_COLOR}`, text);
      } else {
        // If we were not given any text we'll assume we should take the current text and mark it
        // as successful, and remove it from the active spinner text.
        this.spinner.text = "";
        console.log(`${SET_GREEN} ✔${RESET_COLOR}`, currentText);
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
  fail(text?: string) {
    if (this._doesPassVerbosityGate(LoggerVerbosityLevel.ERROR)) {
      const currentText = this.pauseSpin();

      if (text) {
        console.error(`${SET_RED} ✖${RESET_COLOR}`, text ?? currentText);
      } else {
        // If we were not given any text we'll assume we should take the current text and mark it
        // as successful, and remove it from the active spinner text.
        this.spinner.text = "";
        console.error(`${SET_RED} ✖${RESET_COLOR}`, currentText);
      }
      this.resumeSpin();
    }
  }

  /**
   * Stop the spinner and display a success message.
   *
   * @param message - The message to be displayed
   */
  stopSucceed(message: string) {
    this.spinner.prefixText = "";
    this.spinner.stop();
    this.succeed(message);
  }

  /**
   * Stop the spinner and display an info message.
   *
   * @param message - The message to be displayed
   */
  stopInfo(message: string) {
    this.spinner.prefixText = "";
    this.spinner.stop();
    this.info(message);
  }

  /**
   * Stop the spinner and display a warning message.
   *
   * @param message - The message to be displayed
   */
  stopWarn(message: string) {
    this.spinner.prefixText = "";
    this.spinner.stop();
    this.warn(message);
  }

  /**
   * Stop the spinner and display a failure message.
   *
   * @param message - The message to be displayed
   */
  stopFail(message: string) {
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
  private _doesPassVerbosityGate(gate: LoggerVerbosityLevel) {
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
  private pauseSpin() {
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
  private resumeSpin() {
    this.spinner.prefixText = SPINNER_LINE_BREAK;

    if (this.tmpWasSpinning) {
      // console.log("resume that spin???");
      this.spinner.start(this.tmpSpinText);
    }
  }
}
