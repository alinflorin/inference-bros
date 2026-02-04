import { makeStyles, shorthands, Text, tokens } from "@fluentui/react-components";
import Section from "../layout/Section";
import Container from "../layout/Container";
import CTAButton from "../cta/CTAButton";
import { heroContent } from "../../data/content";

const useStyles = makeStyles({
  hero: {
    minHeight: "calc(100vh - 70px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    ...shorthands.overflow("hidden"),
    "::before": {
      content: '""',
      position: "absolute",
      top: "-30%",
      left: "-10%",
      width: "55%",
      height: "70%",
      background: "radial-gradient(circle, rgba(255,107,0,0.35), transparent 70%)",
      filter: "blur(10px)",
      opacity: 0.9,
      pointerEvents: "none",
    },
    "::after": {
      content: '""',
      position: "absolute",
      bottom: "-35%",
      right: "-10%",
      width: "60%",
      height: "80%",
      background: "radial-gradient(circle, rgba(255,179,80,0.25), transparent 70%)",
      filter: "blur(20px)",
      opacity: 0.8,
      pointerEvents: "none",
    },
  },
  heroContent: {
    maxWidth: "1100px",
    marginLeft: "auto",
    marginRight: "auto",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("2rem"),
    alignItems: "center",
    position: "relative",
    zIndex: 1,
  },
  eyebrow: {
    fontSize: tokens.fontSizeBase300,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: tokens.colorBrandForeground2,
    backgroundColor: "rgba(255, 107, 0, 0.12)",
    ...shorthands.padding("0.4rem", "1.1rem"),
    ...shorthands.borderRadius("999px"),
    border: `1px solid ${tokens.colorBrandForeground2}`,
  },
  headline: {
    fontSize: "2.5rem",
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    lineHeight: "1.2",
    textAlign: "center",
    "@media (min-width: 768px)": {
      fontSize: "3.5rem",
      whiteSpace: "nowrap",
    },
    "@media (min-width: 1024px)": {
      fontSize: "4rem",
      whiteSpace: "nowrap",
    },
  },
  subheadline: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    lineHeight: "1.6",
    maxWidth: "700px",
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("0.5rem"),
    textAlign: "center",
    alignItems: "center",
    "@media (min-width: 768px)": {
      fontSize: tokens.fontSizeBase500,
    },
  },
  highlights: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    ...shorthands.gap("0.75rem"),
    marginTop: "0.5rem",
  },
  highlightPill: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    backgroundColor: "rgba(16, 16, 16, 0.85)",
    ...shorthands.padding("0.5rem", "0.9rem"),
    ...shorthands.borderRadius("999px"),
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    boxShadow: tokens.shadow4,
    "@media (min-width: 768px)": {
      fontSize: tokens.fontSizeBase400,
    },
  },
  ctaGroup: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("1rem"),
    marginTop: "1rem",
    "@media (min-width: 768px)": {
      flexDirection: "row",
      ...shorthands.gap("1.5rem"),
    },
  },
});

export default function HeroSection() {
  const styles = useStyles();

  return (
    <Section paddingSize="large" className={styles.hero}>
      <Container maxWidth="large">
        <div className={styles.heroContent}>
          <Text className={styles.eyebrow}>Inference Bros</Text>
          <Text className={styles.headline}>{heroContent.headline}</Text>
          <div className={styles.subheadline}>
            {Array.isArray(heroContent.subheadline)
              ? heroContent.subheadline.map((line, index) => (
                  <Text key={index} as="p" style={{ margin: 0 }}>
                    {line}
                  </Text>
                ))
              : <Text>{heroContent.subheadline}</Text>
            }
          </div>
          {heroContent.highlights && (
            <div className={styles.highlights}>
              {heroContent.highlights.map((highlight) => (
                <Text key={highlight} className={styles.highlightPill}>
                  {highlight}
                </Text>
              ))}
            </div>
          )}
          <div className={styles.ctaGroup}>
            <CTAButton variant="primary" href="#contact">
              {heroContent.primaryCTA}
            </CTAButton>
            <CTAButton variant="secondary" href="#features">
              {heroContent.secondaryCTA}
            </CTAButton>
          </div>
        </div>
      </Container>
    </Section>
  );
}
