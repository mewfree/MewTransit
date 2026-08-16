export const Colors = {
  light: {
    text: "#111318",
    textSecondary: "#5C6170",
    background: "#F4F5F8",
    sheet: "#FFFFFF",
    border: "#E4E6EE",
    pin: "#111318",
  },
  dark: {
    text: "#F4F5F8",
    textSecondary: "#A7ACB8",
    background: "#111318",
    sheet: "#1B1D24",
    border: "#2A2D36",
    pin: "#F4F5F8",
  },
} as const;

export type ThemeColors = (typeof Colors)[keyof typeof Colors];

export const AgencyColor: Record<string, string> = {
  stm: "#00A651",
  rem: "#82C341",
  exo: "#5C2D91",
};
