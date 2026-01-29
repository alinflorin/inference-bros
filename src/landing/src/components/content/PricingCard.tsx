import { Badge, Card, makeStyles, shorthands, Text, tokens } from "@fluentui/react-components";
import { Checkmark24Regular } from "@fluentui/react-icons";

interface PricingCardProps {
  title: string;
  subtitle: string;
  price: string;
  features: string[];
  highlighted?: boolean;
}

const useStyles = makeStyles({
  card: {
    ...shorthands.padding("3rem", "2.5rem"),
    height: "100%",
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("1.5rem"),
    backgroundColor: tokens.colorNeutralBackground1,
    position: "relative",
    boxShadow: tokens.shadow4,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.transition("all", "0.2s", "ease-in-out"),
    ...shorthands.overflow("visible"),
  },
  cardHighlighted: {
    ...shorthands.border("2px", "solid", tokens.colorBrandForeground1),
    boxShadow: tokens.shadow16,
    transform: "scale(1.03)",
    "@media (max-width: 768px)": {
      transform: "scale(1)",
    },
  },
  badge: {
    position: "absolute",
    top: "-12px",
    right: "20px",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("0.5rem"),
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
  },
  subtitle: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
  },
  price: {
    fontSize: "2.25rem",
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
    paddingTop: "0.5rem",
    paddingBottom: "0.5rem",
  },
  features: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("1rem"),
    flexGrow: 1,
  },
  feature: {
    display: "flex",
    ...shorthands.gap("0.75rem"),
    alignItems: "flex-start",
  },
  featureIcon: {
    color: tokens.colorPaletteGreenForeground1,
    flexShrink: 0,
    marginTop: "2px",
  },
  featureText: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    lineHeight: "1.6",
  },
});

export default function PricingCard({
  title,
  subtitle,
  price,
  features,
  highlighted = false,
}: PricingCardProps) {
  const styles = useStyles();

  return (
    <Card className={`${styles.card} ${highlighted ? styles.cardHighlighted : ""}`}>
      {highlighted && (
        <Badge className={styles.badge} appearance="filled" color="brand" size="large">
          Most Popular
        </Badge>
      )}
      <div className={styles.header}>
        <Text className={styles.title}>{title}</Text>
        <Text className={styles.subtitle}>{subtitle}</Text>
      </div>
      {price && <Text className={styles.price}>{price}</Text>}
      <div className={styles.features}>
        {features.map((feature, index) => (
          <div key={index} className={styles.feature}>
            <Checkmark24Regular className={styles.featureIcon} />
            <Text className={styles.featureText}>{feature}</Text>
          </div>
        ))}
      </div>
    </Card>
  );
}
