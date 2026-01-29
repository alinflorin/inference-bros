import { makeStyles } from "@fluentui/react-components";
import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  maxWidth?: "small" | "medium" | "large" | "full";
  className?: string;
}

const useStyles = makeStyles({
  container: {
    width: "100%",
    marginLeft: "auto",
    marginRight: "auto",
    paddingLeft: "1rem",
    paddingRight: "1rem",
  },
  maxWidthSmall: {
    maxWidth: "800px",
  },
  maxWidthMedium: {
    maxWidth: "1200px",
  },
  maxWidthLarge: {
    maxWidth: "1440px",
  },
  maxWidthFull: {
    maxWidth: "100%",
  },
});

export default function Container({ children, maxWidth = "medium", className }: ContainerProps) {
  const styles = useStyles();

  const maxWidthClass =
    maxWidth === "small"
      ? styles.maxWidthSmall
      : maxWidth === "large"
        ? styles.maxWidthLarge
        : maxWidth === "full"
          ? styles.maxWidthFull
          : styles.maxWidthMedium;

  return <div className={`${styles.container} ${maxWidthClass} ${className || ""}`}>{children}</div>;
}
