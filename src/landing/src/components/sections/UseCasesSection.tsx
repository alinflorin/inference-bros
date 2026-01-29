import { Card, makeStyles, shorthands, Text, tokens } from "@fluentui/react-components";
import Section from "../layout/Section";
import Container from "../layout/Container";
import Grid from "../layout/Grid";
import { useCases } from "../../data/content";
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
  useCaseCard: {
    ...shorthands.padding("2.5rem", "2rem"),
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("1.5rem"),
    height: "100%",
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
  },
  iconWrapper: {
    fontSize: "48px",
    color: tokens.colorBrandForeground1,
  },
  useCaseTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  useCaseDescription: {
    fontSize: tokens.fontSizeBase300,
    lineHeight: "1.6",
    color: tokens.colorNeutralForeground2,
  },
});

export default function UseCasesSection() {
  const styles = useStyles();

  return (
    <Section id="use-cases" backgroundColor="subtle" paddingSize="large">
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
