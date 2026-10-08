/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#f9f6f1",
      "foreground": "#232e3e",
      "border": "#e3ddd4",
      "card": "#fdfdfc",
      "cardForeground": "#232e3e",
      "popover": "#fdfdfc",
      "popoverForeground": "#232e3e",
      "primary": "#3a8267",
      "primaryForeground": "#ffffff",
      "secondary": "#efe9e1",
      "secondaryForeground": "#2c3a4e",
      "muted": "#f0ece6",
      "mutedForeground": "#6d7888",
      "accent": "#e1efea",
      "accentForeground": "#285845",
      "destructive": "#c33c32",
      "destructiveForeground": "#ffffff",
      "input": "#e3ddd4",
      "ring": "#3a8267",
      "chart1": "#3a8267",
      "chart2": "#d39845",
      "chart3": "#445c7e",
      "chart4": "#d17466",
      "chart5": "#589a9d",
      "sidebar": "#222d3f",
      "sidebarForeground": "#f3efe7",
      "sidebarBorder": "#3c4658",
      "sidebarPrimary": "#61b896",
      "sidebarPrimaryForeground": "#1a2332",
      "sidebarAccent": "#323e52",
      "sidebarAccentForeground": "#f6f4ee",
      "sidebarRing": "#61b896"
    },
    "dark": {
      "background": "#19212e",
      "foreground": "#f3efe7",
      "border": "#3c4658",
      "card": "#222b3a",
      "cardForeground": "#f3efe7",
      "popover": "#222b3a",
      "popoverForeground": "#f3efe7",
      "primary": "#61b896",
      "primaryForeground": "#171e2c",
      "secondary": "#323c4e",
      "secondaryForeground": "#f3efe7",
      "muted": "#2d3748",
      "mutedForeground": "#a1a9b5",
      "accent": "#2d493e",
      "accentForeground": "#b5dece",
      "destructive": "#d25951",
      "destructiveForeground": "#ffffff",
      "input": "#3c4658",
      "ring": "#61b896",
      "chart1": "#61b896",
      "chart2": "#daa862",
      "chart3": "#8199bb",
      "chart4": "#d98d81",
      "chart5": "#83b7b9",
      "sidebar": "#131a25",
      "sidebarForeground": "#f3efe7",
      "sidebarBorder": "#303846",
      "sidebarPrimary": "#61b896",
      "sidebarPrimaryForeground": "#1a2332",
      "sidebarAccent": "#27303f",
      "sidebarAccentForeground": "#f6f4ee",
      "sidebarRing": "#61b896"
    }
  },
  "fontFamily": {
    "sans": [
      "DM Sans",
      "sans-serif"
    ],
    "serif": [
      "Manrope",
      "sans-serif"
    ],
    "mono": [
      "IBM Plex Mono",
      "monospace"
    ]
  },
  "radius": "0.5rem",
  "spacing": "0.25rem"
} as const;

export type Tokens = typeof tokens;
export default tokens;
