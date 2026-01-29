import { Badge, Button, Card, makeStyles, shorthands, Text, tokens } from "@fluentui/react-components";
import { Checkmark24Regular } from "@fluentui/react-icons";

interface PricingCardProps {
  title: string;
  subtitle: string;
  price: string;
  features: string[];
  highlighted?: boolean;
  ctaText: string;
  onCtaClick?: () => void;
}

const useStyles = makeStyles({
  card: {
    ...shorthands.padding("2.5rem", "2rem"),
    height: "100%",
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("1.5rem"),
    backgroundColor: tokens.colorNeutralBackground1,
    position: "relative",
  },
  cardHighlighted: {
    ...shorthands.border("2px", "solid", tokens.colorBrandForeground1),
    boxShadow: tokens.shadow16,
    transform: "scale(1.05)",
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
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  subtitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
  },
  price: {
    fontSize: "2rem",
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
    paddingTop: "1rem",
    paddingBottom: "1rem",
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
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    lineHeight: "1.5",
  },
  ctaButton: {
    marginTop: "auto",
  },
});

export default function PricingCard({
  title,
  subtitle,
  price,
  features,
  highlighted = false,
  ctaText,
  onCtaClick,
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
      <Text className={styles.price}>{price}</Text>
      <div className={styles.features}>
        {features.map((feature, index) => (
          <div key={index} className={styles.feature}>
            <Checkmark24Regular className={styles.featureIcon} />
            <Text className={styles.featureText}>{feature}</Text>
          </div>
        ))}
      </div>
      <Button
        appearance={highlighted ? "primary" : "outline"}
        size="large"
        className={styles.ctaButton}
        onClick={onCtaClick}
      >
        {ctaText}
      </Button>
    </Card>
  );
}
