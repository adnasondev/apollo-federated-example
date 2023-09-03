/**
 * Do NOT allow using `npm install` instead prefer npm ci.
 */
if (process.env.npm_command === "install") {
  console.error(
    "\nThis repository locks the versions of dependencies\nto ensure everyone gets the same experience."
  );
  console.error("\nYou must use `npm ci` to install dependencies, e.g.:");
  console.error("\n\n$ npm ci\n");
  process.exit(1);
}
