import { Card, makeStyles, shorthands, Text, tokens } from "@fluentui/react-components";
import * as FluentIcons from "@fluentui/react-icons";

interface FeatureCardProps {
  icon: keyof typeof FluentIcons;
  title: string;
  description: string;
}

const useStyles = makeStyles({
  card: {
    ...shorthands.padding("2rem"),
    height: "100%",
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("1rem"),
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    ":hover": {
      boxShadow: tokens.shadow8,
      transform: "translateY(-2px)",
      ...shorthands.transition("all", "0.3s", "ease"),
    },
  },
  iconWrapper: {
    fontSize: "32px",
    color: tokens.colorBrandForeground1,
    lineHeight: "1",
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  description: {
    fontSize: tokens.fontSizeBase300,
    lineHeight: "1.6",
    color: tokens.colorNeutralForeground2,
  },
});

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const styles = useStyles();

  // Dynamically get the icon component
  const IconComponent = FluentIcons[icon] as React.ComponentType<{ className?: string }>;

  return (
    <Card className={styles.card}>
      <div className={styles.iconWrapper}>
        {IconComponent && <IconComponent />}
      </div>
      <Text className={styles.title}>{title}</Text>
      <Text className={styles.description}>{description}</Text>
    </Card>
  );
}
