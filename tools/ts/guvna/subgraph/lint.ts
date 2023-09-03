import { join } from "node:path";

import { ESLint } from "eslint";

import { CommandAction } from "../command-action";
import { LoggableCommand } from "../loggable-command";

/**
 * Lints the subgraph schema file provided by the user.
 *
 * @returns The lint command
 */
export function lint() {
  return new LoggableCommand("lint")
    .usage(`-s ${join("subgraphs", "<domain>", "<subgraph-name>")}`)
    .description("Lint a subgraph to enforce standards")
    .requiredOption("-s, --subgraph <path>", "The path to the subgraph dir to lint")
    .option("-f, --fix", "Allows eslint to fix auto-fixable errors")
    .action(async function (options, cmd) {
      await LintAction.execute(options, cmd);
    });
}

class LintAction extends CommandAction {
  /**
   * Executing the linter.
   *
   * @param options - The Lint command's CLI options
   */
  async actionHandler(options: { subgraph: string; fix: string }) {
    const schemaPath = this.joiner(this.sanitizeSubgraphPath(options.subgraph).relativePath);
    const isFixFlag = options.fix;

    const eslint = new ESLint({
      fix: isFixFlag,
      useEslintrc: true,
    });

    try {
      // Lint the specified subgraph file
      const results = await eslint.lintFiles([schemaPath]);
      // Fix the files if specified
      if (isFixFlag) {
        await ESLint.outputFixes(results);
      }
      // Format the results so they are easily readable in the console
      const formatter = await eslint.loadFormatter("stylish");
      // Use relative paths instead of the longer absolute paths for better readability
      const resultText = (formatter.format(results) ?? "").replaceAll(process.cwd() + "/", "");
      // Print the formatted result or a success message
      if (resultText) {
        this.logger.error(resultText);
      } else {
        this.logger.succeed("Linting completed");
      }

      // Set the exit code to a non-zero value if there are unfixable errors
      results.forEach((result) => {
        if (
          result.errorCount > results.fixableErrorCount ||
          (!isFixFlag && result.errorCount > 0)
        ) {
          this.logger.stop();
          process.exit(1);
        }
      });
    } catch (err) {
      this.logger.fatal(`Unable to lint subgraph schema file\n   ${schemaPath}\n   Does it exist?`);
    }
  }
}
