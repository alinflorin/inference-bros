import { Button, makeStyles, shorthands, Text, tokens } from "@fluentui/react-components";
import Section from "../layout/Section";
import Container from "../layout/Container";
import Grid from "../layout/Grid";
import PricingCard from "../content/PricingCard";
import { pricingTiers } from "../../data/content";

const useStyles = makeStyles({
  section: {
    position: "relative",
    background: "radial-gradient(circle at top right, rgba(255,107,0,0.12), transparent 55%)",
  },
  header: {
    textAlign: "center",
    marginBottom: "3rem",
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("1rem"),
    "@media (min-width: 768px)": {
      marginBottom: "4rem",
    },
  },
  title: {
    fontSize: "2rem",
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    lineHeight: "1.2",
    textAlign: "center",
    "@media (min-width: 768px)": {
      fontSize: "2.75rem",
    },
  },
  subtitle: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    maxWidth: "700px",
    marginLeft: "auto",
    marginRight: "auto",
    lineHeight: "1.6",
    textAlign: "center",
    "@media (min-width: 768px)": {
      fontSize: tokens.fontSizeBase500,
    },
  },
  gridContainer: {
    paddingTop: "1rem",
  },
  ctaContainer: {
    display: "flex",
    justifyContent: "center",
    marginTop: "3rem",
    "@media (min-width: 768px)": {
      marginTop: "4rem",
    },
  },
});

export default function PricingSection() {
  const styles = useStyles();

  const handleCtaClick = () => {
    const contactSection = document.querySelector("#contact");
    contactSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Section id="pricing" paddingSize="large" className={styles.section}>
      <Container maxWidth="large">
        <div className={styles.header}>
          <Text className={styles.title}>Flexible Pricing for Every Scale</Text>
          <Text className={styles.subtitle}>
            From prototyping to production, we have a plan that fits your needs.
          </Text>
        </div>
        <div className={styles.gridContainer}>
          <Grid columns={3} gap="large">
            {pricingTiers.map((tier, index) => (
              <PricingCard
                key={index}
                title={tier.title}
                subtitle={tier.subtitle}
                price={tier.price}
                features={tier.features}
                highlighted={tier.highlighted}
              />
            ))}
          </Grid>
        </div>
        <div className={styles.ctaContainer}>
          <Button appearance="primary" size="large" onClick={handleCtaClick}>
            Contact Sales
          </Button>
        </div>
      </Container>
    </Section>
  );
}
