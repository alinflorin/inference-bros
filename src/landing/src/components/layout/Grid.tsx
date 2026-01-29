import { makeStyles } from "@fluentui/react-components";
import { ReactNode } from "react";

interface GridProps {
  children: ReactNode;
  columns?: number;
  gap?: "small" | "medium" | "large";
  className?: string;
}

const useStyles = makeStyles({
  grid: {
    display: "grid",
    width: "100%",
  },
  gapSmall: {
    gap: "1rem",
  },
  gapMedium: {
    gap: "2rem",
  },
  gapLarge: {
    gap: "3rem",
  },
  cols1: {
    gridTemplateColumns: "1fr",
  },
  cols2: {
    gridTemplateColumns: "1fr",
    "@media (min-width: 768px)": {
      gridTemplateColumns: "repeat(2, 1fr)",
    },
  },
  cols3: {
    gridTemplateColumns: "1fr",
    "@media (min-width: 768px)": {
      gridTemplateColumns: "repeat(2, 1fr)",
    },
    "@media (min-width: 1024px)": {
      gridTemplateColumns: "repeat(3, 1fr)",
    },
  },
  cols4: {
    gridTemplateColumns: "1fr",
    "@media (min-width: 768px)": {
      gridTemplateColumns: "repeat(2, 1fr)",
    },
    "@media (min-width: 1024px)": {
      gridTemplateColumns: "repeat(4, 1fr)",
    },
  },
});

export default function Grid({ children, columns = 3, gap = "medium", className }: GridProps) {
  const styles = useStyles();

  const gapClass = gap === "small" ? styles.gapSmall : gap === "large" ? styles.gapLarge : styles.gapMedium;

  const colClass =
    columns === 1
      ? styles.cols1
      : columns === 2
        ? styles.cols2
        : columns === 4
          ? styles.cols4
          : styles.cols3;

  return <div className={`${styles.grid} ${gapClass} ${colClass} ${className || ""}`}>{children}</div>;
}
