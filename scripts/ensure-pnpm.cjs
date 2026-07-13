const ua = process.env.npm_config_user_agent || "";
if (!/\bpnpm\b/i.test(ua)) {
  console.error("Use pnpm instead");
  process.exit(1);
}
