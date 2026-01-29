import { makeStyles, shorthands, Text, tokens } from "@fluentui/react-components";
import Section from "../layout/Section";
import Container from "../layout/Container";
import Grid from "../layout/Grid";
import FeatureCard from "../content/FeatureCard";
import { features } from "../../data/content";
import * as FluentIcons from "@fluentui/react-icons";

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

export default function FeaturesSection() {
  const styles = useStyles();

  return (
    <Section id="features" paddingSize="large">
      <Container>
        <div className={styles.header}>
          <Text className={styles.title}>Production-Ready Infrastructure</Text>
          <Text className={styles.subtitle}>
            Everything you need to power AI features at scale, backed by battle-tested Kubernetes infrastructure.
          </Text>
        </div>
        <Grid columns={3} gap="large">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon as keyof typeof FluentIcons}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </Grid>
      </Container>
    </Section>
  );
}
