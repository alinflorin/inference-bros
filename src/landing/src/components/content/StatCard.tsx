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
    gap: "0.75rem",
  },
  iconWrapper: {
    fontSize: "28px",
    color: tokens.colorBrandForeground1,
  },
  value: {
    fontSize: "2.5rem",
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    lineHeight: "1",
    "@media (min-width: 768px)": {
      fontSize: "3rem",
    },
  },
  label: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    fontWeight: tokens.fontWeightMedium,
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
