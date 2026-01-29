import { makeStyles, shorthands, Text, tokens } from "@fluentui/react-components";
import Section from "../layout/Section";
import Container from "../layout/Container";
import Grid from "../layout/Grid";
import PricingCard from "../content/PricingCard";
import { pricingTiers } from "../../data/content";

const useStyles = makeStyles({
  header: {
    textAlign: "center",
    marginBottom: "4rem",
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("1rem"),
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    "@media (min-width: 768px)": {
      fontSize: "3rem",
    },
  },
  subtitle: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    maxWidth: "700px",
    marginLeft: "auto",
    marginRight: "auto",
  },
});

export default function PricingSection() {
  const styles = useStyles();

  const handleCtaClick = () => {
    const contactSection = document.querySelector("#contact");
    contactSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Section id="pricing" paddingSize="large">
      <Container maxWidth="large">
        <div className={styles.header}>
          <Text className={styles.title}>Flexible Pricing for Every Scale</Text>
          <Text className={styles.subtitle}>
            From prototyping to production, we have a plan that fits your needs.
          </Text>
        </div>
        <Grid columns={3} gap="large">
          {pricingTiers.map((tier, index) => (
            <PricingCard
              key={index}
              title={tier.title}
              subtitle={tier.subtitle}
              price={tier.price}
              features={tier.features}
              highlighted={tier.highlighted}
              ctaText={tier.ctaText}
              onCtaClick={handleCtaClick}
            />
          ))}
        </Grid>
      </Container>
    </Section>
  );
}
