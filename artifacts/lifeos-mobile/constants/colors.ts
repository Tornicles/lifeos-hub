/**
 * Semantic design tokens for the LifeOS Mobile app.
 *
 * Synced from the sibling web artifact (artifacts/lifeos/src/index.css)
 * so both artifacts share a cohesive visual identity (deep blue primary,
 * gold accent, green success).
 */

const colors = {
  light: {
    text: "#14181F",
    tint: "#1F517A",

    background: "#F9FAFB",
    foreground: "#14181F",

    card: "#FFFFFF",
    cardForeground: "#14181F",

    primary: "#1F517A",
    primaryForeground: "#FFFFFF",

    secondary: "#EDEFF2",
    secondaryForeground: "#14181F",

    muted: "#F2F2F2",
    mutedForeground: "#676F7E",

    accent: "#FFBF00",
    accentForeground: "#14181F",

    success: "#74B800",
    successForeground: "#FFFFFF",

    warning: "#F5A623",
    warningForeground: "#14181F",

    destructive: "#E31627",
    destructiveForeground: "#FFFFFF",

    border: "#E2E4E9",
    input: "#E2E4E9",
  },

  dark: {
    text: "#F0F2F4",
    tint: "#3387CC",

    background: "#0F131A",
    foreground: "#F0F2F4",

    card: "#131720",
    cardForeground: "#F0F2F4",

    primary: "#3387CC",
    primaryForeground: "#FFFFFF",

    secondary: "#1F242E",
    secondaryForeground: "#F0F2F4",

    muted: "#181D25",
    mutedForeground: "#8F96A3",

    accent: "#FFC61A",
    accentForeground: "#14181F",

    success: "#8FD400",
    successForeground: "#0F131A",

    warning: "#F7B733",
    warningForeground: "#14181F",

    destructive: "#FF4D5E",
    destructiveForeground: "#FFFFFF",

    border: "#2A2F3A",
    input: "#2A2F3A",
  },

  radius: 12,
};

export default colors;
