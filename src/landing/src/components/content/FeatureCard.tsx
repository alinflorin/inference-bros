import { Card, makeStyles, shorthands, Text, tokens } from "@fluentui/react-components";
import * as FluentIcons from "@fluentui/react-icons";

interface FeatureCardProps {
  icon: keyof typeof FluentIcons;
  title: string;
  description: string;
}

const useStyles = makeStyles({
  card: {
    ...shorthands.padding("2.5rem"),
    height: "100%",
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("1.25rem"),
    backgroundColor: tokens.colorNeutralBackground1,
    backgroundImage: "linear-gradient(135deg, rgba(255,107,0,0.12), transparent 60%)",
    ...shorthands.border("1px", "solid", "rgba(255, 107, 0, 0.2)"),
    boxShadow: tokens.shadow4,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.transition("all", "0.2s", "ease-in-out"),
    ":hover": {
      boxShadow: tokens.shadow16,
      transform: "translateY(-4px)",
    },
  },
  iconWrapper: {
    fontSize: "40px",
    color: tokens.colorBrandForeground1,
    lineHeight: "1",
    marginBottom: "0.5rem",
  },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    lineHeight: "1.3",
  },
  description: {
    fontSize: tokens.fontSizeBase400,
    lineHeight: "1.7",
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
