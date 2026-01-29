import Section from "../layout/Section";
import Container from "../layout/Container";
import Grid from "../layout/Grid";
import StatCard from "../content/StatCard";
import { stats } from "../../data/content";
import * as FluentIcons from "@fluentui/react-icons";

export default function StatsSection() {
  return (
    <Section backgroundColor="subtle" paddingSize="medium">
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
