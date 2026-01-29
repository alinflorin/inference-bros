import { createLightTheme } from "@fluentui/react-components";
import type { Theme } from "@fluentui/react-components";

// Custom brand colors for Inference Bros - Professional B2B theme
const inferenceBrosBrand = {
  10: "#020305",
  20: "#0F1419",
  30: "#16202B",
  40: "#1C2A3A",
  50: "#233549",
  60: "#2B4158",
  70: "#344D68",
  80: "#3D5978",
  90: "#466689",
  100: "#50739A",
  110: "#5A81AC",
  120: "#658EBE",
  130: "#709CD1",
  140: "#7BAAE4",
  150: "#88B8F7",
  160: "#A0C7FF",
};

export const customTheme: Theme = createLightTheme(inferenceBrosBrand);

// Additional theme customizations
customTheme.fontFamilyBase = "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif";
customTheme.fontSizeBase300 = "14px";
customTheme.fontSizeBase400 = "16px";
customTheme.fontSizeBase500 = "18px";
customTheme.lineHeightBase300 = "1.5";
customTheme.lineHeightBase400 = "1.6";
customTheme.lineHeightBase500 = "1.7";
