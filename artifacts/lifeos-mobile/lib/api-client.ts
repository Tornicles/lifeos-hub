import { setBaseUrl } from "@workspace/api-client-react";

// Expo bundles run outside the web proxy and need an absolute URL to reach
// the API server. The deployment domain is injected at build time.
setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
