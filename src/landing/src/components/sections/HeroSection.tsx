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
