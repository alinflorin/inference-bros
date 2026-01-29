import {
  createLightTheme,
  type BrandVariants,
} from "@fluentui/react-components";

// Custom brand colors based on #1098CA
const inferenceBrosBrand: BrandVariants = {
  10: "#030608",
  20: "#0A1419",
  30: "#0E1F28",
  40: "#122A37",
  50: "#153546",
  60: "#184056",
  70: "#1B4C66",
  80: "#1E5876",
  90: "#1098CA", // Primary brand color
  100: "#2BA4D3",
  110: "#46B0DC",
  120: "#61BCE5",
  130: "#7CC8EE",
  140: "#97D4F7",
  150: "#B2E0FF",
  160: "#CDECFF",
};

// Create the custom light theme
const inferenceBrosTheme = createLightTheme(inferenceBrosBrand);

export default inferenceBrosTheme;
