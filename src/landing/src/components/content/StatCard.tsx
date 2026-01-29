import { makeStyles, Text, tokens } from "@fluentui/react-components";
import * as FluentIcons from "@fluentui/react-icons";

interface StatCardProps {
  value: string;
  label: string;
  icon: keyof typeof FluentIcons;
}

const useStyles = makeStyles({
  statCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "0.875rem",
    padding: "1rem",
  },
  iconWrapper: {
    fontSize: "32px",
    color: tokens.colorBrandForeground1,
  },
  value: {
    fontSize: "2.25rem",
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    lineHeight: "1.1",
    "@media (min-width: 768px)": {
      fontSize: "2.75rem",
    },
  },
  label: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: "1.4",
  },
});

export default function StatCard({ value, label, icon }: StatCardProps) {
  const styles = useStyles();

  const IconComponent = FluentIcons[icon] as React.ComponentType<{ className?: string }>;

  return (
    <div className={styles.statCard}>
      <div className={styles.iconWrapper}>
        {IconComponent && <IconComponent />}
      </div>
      <Text className={styles.value}>{value}</Text>
      <Text className={styles.label}>{label}</Text>
    </div>
  );
}
