import {
  makeStyles,
  shorthands,
  tokens,
  Card,
} from "@fluentui/react-components";

const useStyles = makeStyles({
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    ...shorthands.padding("80px", "32px"),
    "@media (max-width: 768px)": {
      ...shorthands.padding("48px", "20px"),
    },
  },
  hero: {
    textAlign: "center",
    marginBottom: "64px",
  },
  title: {
    fontSize: "56px",
    fontWeight: 800,
    color: tokens.colorNeutralForeground1,
    ...shorthands.margin(0, 0, "16px", 0),
    "@media (max-width: 768px)": {
      fontSize: "40px",
    },
  },
  subtitle: {
    fontSize: "20px",
    color: tokens.colorNeutralForeground2,
    lineHeight: 1.6,
    maxWidth: "700px",
    margin: "0 auto",
    "@media (max-width: 768px)": {
      fontSize: "18px",
    },
  },
  content: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    ...shorthands.gap("48px"),
    marginBottom: "64px",
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr",
      ...shorthands.gap("32px"),
    },
  },
  section: {
    ...shorthands.padding("32px"),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius("12px"),
  },
  sectionTitle: {
    fontSize: "28px",
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    ...shorthands.margin(0, 0, "16px", 0),
  },
  sectionText: {
    fontSize: "16px",
    lineHeight: 1.8,
    color: tokens.colorNeutralForeground2,
    ...shorthands.margin(0),
  },
  teamSection: {
    textAlign: "center",
    marginTop: "64px",
  },
  teamTitle: {
    fontSize: "36px",
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    ...shorthands.margin(0, 0, "48px", 0),
  },
  teamGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    ...shorthands.gap("32px"),
  },
  teamCard: {
    ...shorthands.padding("32px"),
    textAlign: "center",
    ...shorthands.transition("all", "0.3s"),
    ":hover": {
      transform: "translateY(-4px)",
      boxShadow: tokens.shadow8,
    },
  },
  avatar: {
    width: "80px",
    height: "80px",
    ...shorthands.borderRadius("50%"),
    backgroundColor: tokens.colorBrandBackground,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    color: "white",
    margin: "0 auto 16px",
    fontWeight: 700,
  },
  memberName: {
    fontSize: "20px",
    fontWeight: 600,
    ...shorthands.margin(0, 0, "4px", 0),
    color: tokens.colorNeutralForeground1,
  },
  memberRole: {
    fontSize: "14px",
    color: tokens.colorNeutralForeground2,
    ...shorthands.margin(0),
  },
});

export default function About() {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>About InferenceBros</h1>
        <p className={styles.subtitle}>
          We're on a mission to make AI inference fast, reliable, and accessible for developers everywhere.
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Our Story</h2>
          <p className={styles.sectionText}>
            Founded in 2024 by a team of AI engineers and infrastructure experts, InferenceBros was born from
            a simple frustration: deploying AI models was too slow, too expensive, and too complicated. We built
            the platform we wished existed—one that makes inference lightning-fast and developer-friendly.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Our Mission</h2>
          <p className={styles.sectionText}>
            We believe every developer should have access to enterprise-grade AI infrastructure. Our mission is
            to democratize AI inference by providing the fastest, most reliable, and easiest-to-use platform for
            deploying machine learning models at any scale.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Our Values</h2>
          <p className={styles.sectionText}>
            Speed matters. Reliability is non-negotiable. Developer experience comes first. We obsess over
            performance, maintain 99.99% uptime, and ship features that make your life easier. We're building
            for the long term, with transparency and trust at our core.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Technology</h2>
          <p className={styles.sectionText}>
            Our platform is built on cutting-edge infrastructure with custom-optimized inference engines,
            intelligent load balancing, and global edge deployment. We support 150+ model architectures and
            process over 1 million requests per second with sub-10ms latency.
          </p>
        </div>
      </div>

      <div className={styles.teamSection}>
        <h2 className={styles.teamTitle}>Meet the Team</h2>
        <div className={styles.teamGrid}>
          <Card className={styles.teamCard}>
            <div className={styles.avatar}>AJ</div>
            <h3 className={styles.memberName}>Alex Johnson</h3>
            <p className={styles.memberRole}>CEO & Co-Founder</p>
          </Card>

          <Card className={styles.teamCard}>
            <div className={styles.avatar}>SC</div>
            <h3 className={styles.memberName}>Sarah Chen</h3>
            <p className={styles.memberRole}>CTO & Co-Founder</p>
          </Card>

          <Card className={styles.teamCard}>
            <div className={styles.avatar}>MP</div>
            <h3 className={styles.memberName}>Michael Park</h3>
            <p className={styles.memberRole}>Head of Engineering</p>
          </Card>

          <Card className={styles.teamCard}>
            <div className={styles.avatar}>ER</div>
            <h3 className={styles.memberName}>Emma Rodriguez</h3>
            <p className={styles.memberRole}>Head of Product</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
