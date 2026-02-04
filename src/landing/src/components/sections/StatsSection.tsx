import { makeStyles } from "@fluentui/react-components";
import Section from "../layout/Section";
import Container from "../layout/Container";
import Grid from "../layout/Grid";
import StatCard from "../content/StatCard";
import { stats } from "../../data/content";
import * as FluentIcons from "@fluentui/react-icons";

const useStyles = makeStyles({
  section: {
    position: "relative",
    background: "linear-gradient(135deg, rgba(255,107,0,0.08), transparent 70%)",
  },
});

export default function StatsSection() {
  const styles = useStyles();

  return (
    <Section backgroundColor="subtle" paddingSize="medium" className={styles.section}>
      <Container>
        <Grid columns={4} gap="large">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              value={stat.value}
              label={stat.label}
              icon={stat.icon as keyof typeof FluentIcons}
            />
          ))}
        </Grid>
      </Container>
    </Section>
  );
}
