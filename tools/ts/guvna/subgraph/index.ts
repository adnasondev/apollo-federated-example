import { LoggableCommand } from "../loggable-command";
import { check } from "./check";
import { create } from "./create";
import { diff } from "./diff";
import { lint } from "./lint";
import { register } from "./register";

/**
 * The parent command to which all nested 'subgraph' commands will be added.
 *
 * @returns The subraph sub command
 */
export function subgraph() {
  const cmd = new LoggableCommand("subgraph");

  cmd.description("Collection of subgraph commands");

  // Add nested sub commands
  cmd.addCommand(create());
  cmd.addCommand(register());
  cmd.addCommand(lint());
  cmd.addCommand(check());
  cmd.addCommand(diff());

  return cmd;
}
