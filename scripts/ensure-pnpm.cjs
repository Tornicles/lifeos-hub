const markers = [
  process.env.npm_config_user_agent,
  process.env.npm_execpath,
  process.env.PNPM_HOME,
  process.env.npm_node_execpath,
  process.argv.join(" "),
]
  .filter(Boolean)
  .join(" ");

// Allow when clearly invoked under pnpm (CI + local).
if (!/pnpm/i.test(markers)) {
  console.error("Use pnpm instead");
  console.error(`Detected agent markers: ${markers || "(empty)"}`);
  process.exit(1);
}
