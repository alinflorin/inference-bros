import {
  makeStyles,
  shorthands,
  tokens,
  Card,
  Button,
} from "@fluentui/react-components";
import {
  ArrowRight24Regular,
  Flash24Regular,
  Shield24Regular,
  Cloud24Regular,
  DataUsage24Regular,
  Settings24Regular,
  Headset24Regular,
} from "@fluentui/react-icons";

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
  servicesGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    ...shorthands.gap("32px"),
    marginBottom: "64px",
  },
  serviceCard: {
    ...shorthands.padding("40px"),
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    ...shorthands.gap("32px"),
    alignItems: "start",
    ...shorthands.transition("all", "0.3s"),
    ":hover": {
      transform: "translateY(-4px)",
      boxShadow: tokens.shadow16,
      ...shorthands.borderColor(tokens.colorBrandStroke1),
    },
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr",
      ...shorthands.padding("24px"),
      ...shorthands.gap("20px"),
    },
  },
  iconWrapper: {
    width: "64px",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ...shorthands.borderRadius("16px"),
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    fontSize: "32px",
    flexShrink: 0,
  },
  serviceContent: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("16px"),
  },
  serviceTitle: {
    fontSize: "28px",
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    ...shorthands.margin(0),
  },
  serviceDescription: {
    fontSize: "16px",
    lineHeight: 1.7,
    color: tokens.colorNeutralForeground2,
    ...shorthands.margin(0),
  },
  featureList: {
    listStyle: "none",
    ...shorthands.padding(0),
    ...shorthands.margin(0),
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
  },
  featureItem: {
    fontSize: "15px",
    color: tokens.colorNeutralForeground2,
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
    "::before": {
      content: '"✓"',
      color: tokens.colorBrandForeground1,
      fontWeight: 700,
      fontSize: "16px",
    },
  },
  learnMoreButton: {
    alignSelf: "flex-start",
    marginTop: "8px",
  },
  cta: {
    textAlign: "center",
    ...shorthands.padding("64px", "32px"),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius("16px"),
  },
  ctaTitle: {
    fontSize: "32px",
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    ...shorthands.margin(0, 0, "16px", 0),
  },
  ctaText: {
    fontSize: "18px",
    color: tokens.colorNeutralForeground2,
    ...shorthands.margin(0, 0, "24px", 0),
  },
});

export default function Services() {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Our Services</h1>
        <p className={styles.subtitle}>
          Enterprise-grade AI inference solutions designed to scale with your business
        </p>
      </div>

      <div className={styles.servicesGrid}>
        <Card className={styles.serviceCard}>
          <div className={styles.iconWrapper}>
            <Flash24Regular />
          </div>
          <div className={styles.serviceContent}>
            <h2 className={styles.serviceTitle}>Model Deployment</h2>
            <p className={styles.serviceDescription}>
              Deploy any ML model with a single API call. Support for PyTorch, TensorFlow, ONNX, and 150+
              architectures. Automatic optimization and scaling included.
            </p>
            <ul className={styles.featureList}>
              <li className={styles.featureItem}>One-click deployment from popular frameworks</li>
              <li className={styles.featureItem}>Automatic model optimization and quantization</li>
              <li className={styles.featureItem}>Version control and rollback support</li>
              <li className={styles.featureItem}>Custom runtime environments</li>
            </ul>
            <Button
              appearance="primary"
              className={styles.learnMoreButton}
              icon={<ArrowRight24Regular />}
              iconPosition="after"
            >
              Learn More
            </Button>
          </div>
        </Card>

        <Card className={styles.serviceCard}>
          <div className={styles.iconWrapper}>
            <Cloud24Regular />
          </div>
          <div className={styles.serviceContent}>
            <h2 className={styles.serviceTitle}>Scalable Infrastructure</h2>
            <p className={styles.serviceDescription}>
              Global edge network with automatic scaling. Handle traffic spikes effortlessly with intelligent
              load balancing and distributed inference.
            </p>
            <ul className={styles.featureList}>
              <li className={styles.featureItem}>Auto-scaling based on traffic patterns</li>
              <li className={styles.featureItem}>Global CDN with 50+ edge locations</li>
              <li className={styles.featureItem}>Zero-downtime deployments</li>
              <li className={styles.featureItem}>Built-in redundancy and failover</li>
            </ul>
            <Button
              appearance="primary"
              className={styles.learnMoreButton}
              icon={<ArrowRight24Regular />}
              iconPosition="after"
            >
              Learn More
            </Button>
          </div>
        </Card>

        <Card className={styles.serviceCard}>
          <div className={styles.iconWrapper}>
            <Shield24Regular />
          </div>
          <div className={styles.serviceContent}>
            <h2 className={styles.serviceTitle}>Enterprise Security</h2>
            <p className={styles.serviceDescription}>
              Bank-level security with SOC 2 Type II compliance, end-to-end encryption, and private deployment
              options for sensitive workloads.
            </p>
            <ul className={styles.featureList}>
              <li className={styles.featureItem}>SOC 2 Type II certified infrastructure</li>
              <li className={styles.featureItem}>End-to-end encryption for all data</li>
              <li className={styles.featureItem}>Private VPC and dedicated instances</li>
              <li className={styles.featureItem}>Role-based access control (RBAC)</li>
            </ul>
            <Button
              appearance="primary"
              className={styles.learnMoreButton}
              icon={<ArrowRight24Regular />}
              iconPosition="after"
            >
              Learn More
            </Button>
          </div>
        </Card>

        <Card className={styles.serviceCard}>
          <div className={styles.iconWrapper}>
            <DataUsage24Regular />
          </div>
          <div className={styles.serviceContent}>
            <h2 className={styles.serviceTitle}>Analytics & Monitoring</h2>
            <p className={styles.serviceDescription}>
              Real-time insights into model performance, latency metrics, and usage patterns. Identify issues
              before they impact users.
            </p>
            <ul className={styles.featureList}>
              <li className={styles.featureItem}>Real-time performance dashboards</li>
              <li className={styles.featureItem}>Custom alerts and notifications</li>
              <li className={styles.featureItem}>Detailed request logs and tracing</li>
              <li className={styles.featureItem}>Cost optimization recommendations</li>
            </ul>
            <Button
              appearance="primary"
              className={styles.learnMoreButton}
              icon={<ArrowRight24Regular />}
              iconPosition="after"
            >
              Learn More
            </Button>
          </div>
        </Card>

        <Card className={styles.serviceCard}>
          <div className={styles.iconWrapper}>
            <Settings24Regular />
          </div>
          <div className={styles.serviceContent}>
            <h2 className={styles.serviceTitle}>Custom Solutions</h2>
            <p className={styles.serviceDescription}>
              Need something specific? Our team works with you to build custom inference pipelines, optimize
              models, and integrate with your existing systems.
            </p>
            <ul className={styles.featureList}>
              <li className={styles.featureItem}>Dedicated solution architects</li>
              <li className={styles.featureItem}>Custom model optimization</li>
              <li className={styles.featureItem}>White-label options available</li>
              <li className={styles.featureItem}>On-premise deployment support</li>
            </ul>
            <Button
              appearance="primary"
              className={styles.learnMoreButton}
              icon={<ArrowRight24Regular />}
              iconPosition="after"
            >
              Learn More
            </Button>
          </div>
        </Card>

        <Card className={styles.serviceCard}>
          <div className={styles.iconWrapper}>
            <Headset24Regular />
          </div>
          <div className={styles.serviceContent}>
            <h2 className={styles.serviceTitle}>Premium Support</h2>
            <p className={styles.serviceDescription}>
              24/7 expert support from our team of ML engineers. Get help with deployment, optimization,
              troubleshooting, and best practices.
            </p>
            <ul className={styles.featureList}>
              <li className={styles.featureItem}>24/7 technical support</li>
              <li className={styles.featureItem}>Dedicated Slack channel</li>
              <li className={styles.featureItem}>Priority bug fixes and feature requests</li>
              <li className={styles.featureItem}>Regular performance reviews</li>
            </ul>
            <Button
              appearance="primary"
              className={styles.learnMoreButton}
              icon={<ArrowRight24Regular />}
              iconPosition="after"
            >
              Learn More
            </Button>
          </div>
        </Card>
      </div>

      <div className={styles.cta}>
        <h2 className={styles.ctaTitle}>Ready to Get Started?</h2>
        <p className={styles.ctaText}>
          Talk to our team about your specific needs
        </p>
        <Button appearance="primary" size="large">
          Schedule a Demo
        </Button>
      </div>
    </div>
  );
}
