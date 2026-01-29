import { makeStyles, shorthands, tokens } from "@fluentui/react-components";
import { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  id?: string;
  backgroundColor?: "default" | "subtle" | "brand";
  paddingSize?: "small" | "medium" | "large";
  className?: string;
}

const useStyles = makeStyles({
  section: {
    width: "100%",
    position: "relative",
  },
  paddingSmall: {
    ...shorthands.padding("3rem", "1.5rem"),
    "@media (min-width: 768px)": {
      ...shorthands.padding("4rem", "2rem"),
    },
  },
  paddingMedium: {
    ...shorthands.padding("4rem", "1.5rem"),
    "@media (min-width: 768px)": {
      ...shorthands.padding("6rem", "2rem"),
    },
  },
  paddingLarge: {
    ...shorthands.padding("5rem", "1.5rem"),
    "@media (min-width: 768px)": {
      ...shorthands.padding("8rem", "2rem"),
    },
  },
  bgDefault: {
    backgroundColor: tokens.colorNeutralBackground1,
  },
  bgSubtle: {
    backgroundColor: tokens.colorNeutralBackground2,
  },
  bgBrand: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
  },
});

export default function Section({
  children,
  id,
  backgroundColor = "default",
  paddingSize = "medium",
  className,
}: SectionProps) {
  const styles = useStyles();

  const paddingClass =
    paddingSize === "small"
      ? styles.paddingSmall
      : paddingSize === "large"
        ? styles.paddingLarge
        : styles.paddingMedium;

  const bgClass =
    backgroundColor === "subtle"
      ? styles.bgSubtle
      : backgroundColor === "brand"
        ? styles.bgBrand
        : styles.bgDefault;

  return (
    <section id={id} className={`${styles.section} ${paddingClass} ${bgClass} ${className || ""}`}>
      {children}
    </section>
  );
}
