import { Command } from "commander";

import { compose } from "./compose";
import { diff } from "./diff";
import { serve } from "./serve";

/**
 * The parent command to which all nested 'supergraph' commands will be added.
 *
 * @returns The supergraph sub command
 */
export function supergraph() {
  const cmd = new Command("supergraph");

  cmd.description("Collection of supergraph commands");

  // Add nested sub commands
  cmd.addCommand(serve());
  cmd.addCommand(compose());
  cmd.addCommand(diff());
  return cmd;
}
