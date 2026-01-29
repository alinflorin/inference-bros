import { createDarkTheme } from "@fluentui/react-components";
import type { Theme } from "@fluentui/react-components";

// Lamborghini-inspired theme - Orange Arancio with Black
const lamborghiniBrand = {
  10: "#1A0A00",
  20: "#331500",
  30: "#4D1F00",
  40: "#662A00",
  50: "#803500",
  60: "#993F00",
  70: "#B34A00",
  80: "#CC5500",
  90: "#E66000",
  100: "#FF6B00",
  110: "#FF7F1A",
  120: "#FF9333",
  130: "#FFA64D",
  140: "#FFB966",
  150: "#FFCC80",
  160: "#FFDF99",
};

export const customTheme: Theme = createDarkTheme(lamborghiniBrand);

// Additional theme customizations
customTheme.fontFamilyBase = "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif";
customTheme.fontSizeBase300 = "14px";
customTheme.fontSizeBase400 = "16px";
customTheme.fontSizeBase500 = "18px";
customTheme.lineHeightBase300 = "1.5";
customTheme.lineHeightBase400 = "1.6";
customTheme.lineHeightBase500 = "1.7";
