import { Card, makeStyles, shorthands, Text, tokens } from "@fluentui/react-components";
import Section from "../layout/Section";
import Container from "../layout/Container";
import Grid from "../layout/Grid";
import { useCases } from "../../data/content";
import * as FluentIcons from "@fluentui/react-icons";

const useStyles = makeStyles({
  section: {
    position: "relative",
    background: "radial-gradient(circle at bottom left, rgba(255,107,0,0.12), transparent 60%)",
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
  useCaseCard: {
    ...shorthands.padding("2.5rem"),
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("1.25rem"),
    height: "100%",
    backgroundColor: tokens.colorNeutralBackground1,
    backgroundImage: "linear-gradient(135deg, rgba(255,107,0,0.14), transparent 60%)",
    ...shorthands.border("1px", "solid", "rgba(255, 107, 0, 0.25)"),
    boxShadow: tokens.shadow4,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.transition("all", "0.2s", "ease-in-out"),
    ":hover": {
      boxShadow: tokens.shadow16,
      transform: "translateY(-4px)",
    },
  },
  iconWrapper: {
    fontSize: "44px",
    color: tokens.colorBrandForeground1,
    marginBottom: "0.5rem",
  },
  useCaseTitle: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    lineHeight: "1.3",
  },
  useCaseDescription: {
    fontSize: tokens.fontSizeBase400,
    lineHeight: "1.7",
    color: tokens.colorNeutralForeground2,
  },
});

export default function UseCasesSection() {
  const styles = useStyles();

  return (
    <Section id="use-cases" backgroundColor="subtle" paddingSize="large" className={styles.section}>
      <Container>
        <div className={styles.header}>
          <Text className={styles.title}>Built for Intermediaries</Text>
          <Text className={styles.subtitle}>
            Powering AI features for platforms across industries with secure, scalable infrastructure.
          </Text>
        </div>
        <Grid columns={2} gap="large">
          {useCases.map((useCase, index) => {
            const IconComponent = FluentIcons[useCase.icon as keyof typeof FluentIcons] as React.ComponentType<{ className?: string }>;
            return (
              <Card key={index} className={styles.useCaseCard}>
                <div className={styles.iconWrapper}>
                  {IconComponent && <IconComponent />}
                </div>
                <Text className={styles.useCaseTitle}>{useCase.title}</Text>
                <Text className={styles.useCaseDescription}>{useCase.description}</Text>
              </Card>
            );
          })}
        </Grid>
      </Container>
    </Section>
  );
}
