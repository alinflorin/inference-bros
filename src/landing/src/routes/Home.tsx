import {
  makeStyles,
  shorthands,
  tokens,
  Button,
  Card,
} from "@fluentui/react-components";
import { ArrowRight24Regular, Sparkle24Regular, Flash24Regular, Shield24Regular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  hero: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "calc(100vh - 64px)",
    ...shorthands.padding("64px", "32px"),
    background: `linear-gradient(135deg, ${tokens.colorBrandBackground} 0%, #0d7ba8 50%, #094d6b 100%)`,
    position: "relative",
    ...shorthands.overflow("hidden"),
    "@media (max-width: 768px)": {
      minHeight: "calc(100vh - 52px)",
      ...shorthands.padding("48px", "20px"),
    },
  },
  heroBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)",
    backgroundSize: "50px 50px",
  },
  heroContent: {
    position: "relative",
    zIndex: 1,
    maxWidth: "900px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    ...shorthands.gap("32px"),
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
    ...shorthands.padding("8px", "20px"),
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(10px)",
    ...shorthands.borderRadius("24px"),
    color: "white",
    fontSize: "14px",
    fontWeight: 600,
    ...shorthands.border("1px", "solid", "rgba(255, 255, 255, 0.2)"),
  },
  heroTitle: {
    fontSize: "72px",
    fontWeight: 800,
    color: "white",
    lineHeight: 1.1,
    ...shorthands.margin(0),
    letterSpacing: "-0.02em",
    "@media (max-width: 768px)": {
      fontSize: "48px",
    },
  },
  heroSubtitle: {
    fontSize: "24px",
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 1.5,
    maxWidth: "700px",
    ...shorthands.margin(0),
    "@media (max-width: 768px)": {
      fontSize: "18px",
    },
  },
  ctaButtons: {
    display: "flex",
    ...shorthands.gap("16px"),
    "@media (max-width: 768px)": {
      flexDirection: "column",
      width: "100%",
    },
  },
  primaryButton: {
    fontSize: "16px",
    fontWeight: 600,
    ...shorthands.padding("14px", "32px"),
    height: "auto",
    backgroundColor: "white",
    color: tokens.colorBrandBackground,
    ...shorthands.border("none"),
    ...shorthands.transition("all", "0.3s"),
    ":hover": {
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      transform: "translateY(-2px)",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
    },
  },
  secondaryButton: {
    fontSize: "16px",
    fontWeight: 600,
    ...shorthands.padding("14px", "32px"),
    height: "auto",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "white",
    ...shorthands.border("1px", "solid", "rgba(255, 255, 255, 0.3)"),
    backdropFilter: "blur(10px)",
    ...shorthands.transition("all", "0.3s"),
    ":hover": {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      transform: "translateY(-2px)",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
    },
  },
  features: {
    ...shorthands.padding("80px", "32px"),
    backgroundColor: tokens.colorNeutralBackground1,
    "@media (max-width: 768px)": {
      ...shorthands.padding("48px", "20px"),
    },
  },
  featuresContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  featuresTitle: {
    textAlign: "center",
    fontSize: "48px",
    fontWeight: 700,
    ...shorthands.margin(0, 0, "16px", 0),
    color: tokens.colorNeutralForeground1,
    "@media (max-width: 768px)": {
      fontSize: "36px",
    },
  },
  featuresSubtitle: {
    textAlign: "center",
    fontSize: "20px",
    color: tokens.colorNeutralForeground2,
    ...shorthands.margin(0, 0, "64px", 0),
    maxWidth: "600px",
    marginLeft: "auto",
    marginRight: "auto",
    "@media (max-width: 768px)": {
      fontSize: "16px",
      ...shorthands.margin(0, 0, "48px", 0),
    },
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    ...shorthands.gap("32px"),
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr",
      ...shorthands.gap("24px"),
    },
  },
  featureCard: {
    ...shorthands.padding("32px"),
    height: "100%",
    ...shorthands.transition("all", "0.3s"),
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    ":hover": {
      transform: "translateY(-4px)",
      boxShadow: tokens.shadow16,
      ...shorthands.borderColor(tokens.colorBrandStroke1),
    },
  },
  featureIcon: {
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ...shorthands.borderRadius("12px"),
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    marginBottom: "20px",
    fontSize: "24px",
  },
  featureTitle: {
    fontSize: "24px",
    fontWeight: 600,
    ...shorthands.margin(0, 0, "12px", 0),
    color: tokens.colorNeutralForeground1,
  },
  featureDescription: {
    fontSize: "16px",
    lineHeight: 1.6,
    color: tokens.colorNeutralForeground2,
    ...shorthands.margin(0),
  },
  stats: {
    ...shorthands.padding("80px", "32px"),
    backgroundColor: tokens.colorBrandBackground,
    color: "white",
    "@media (max-width: 768px)": {
      ...shorthands.padding("48px", "20px"),
    },
  },
  statsContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    ...shorthands.gap("48px"),
    "@media (max-width: 768px)": {
      ...shorthands.gap("32px"),
    },
  },
  statItem: {
    textAlign: "center",
  },
  statNumber: {
    fontSize: "56px",
    fontWeight: 800,
    ...shorthands.margin(0, 0, "8px", 0),
    color: "white",
    "@media (max-width: 768px)": {
      fontSize: "42px",
    },
  },
  statLabel: {
    fontSize: "18px",
    color: "rgba(255, 255, 255, 0.9)",
    ...shorthands.margin(0),
  },
  useCases: {
    ...shorthands.padding("80px", "32px"),
    backgroundColor: tokens.colorNeutralBackground2,
    "@media (max-width: 768px)": {
      ...shorthands.padding("48px", "20px"),
    },
  },
  useCasesContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  useCasesTitle: {
    textAlign: "center",
    fontSize: "48px",
    fontWeight: 700,
    ...shorthands.margin(0, 0, "16px", 0),
    color: tokens.colorNeutralForeground1,
    "@media (max-width: 768px)": {
      fontSize: "36px",
    },
  },
  useCasesSubtitle: {
    textAlign: "center",
    fontSize: "20px",
    color: tokens.colorNeutralForeground2,
    ...shorthands.margin(0, 0, "64px", 0),
    maxWidth: "600px",
    marginLeft: "auto",
    marginRight: "auto",
    "@media (max-width: 768px)": {
      fontSize: "16px",
      ...shorthands.margin(0, 0, "48px", 0),
    },
  },
  useCasesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    ...shorthands.gap("24px"),
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr",
    },
  },
  useCaseCard: {
    ...shorthands.padding("24px"),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius("8px"),
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    ...shorthands.transition("all", "0.3s"),
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: tokens.shadow8,
    },
  },
  useCaseTitle: {
    fontSize: "20px",
    fontWeight: 600,
    ...shorthands.margin(0, 0, "8px", 0),
    color: tokens.colorNeutralForeground1,
  },
  useCaseDescription: {
    fontSize: "15px",
    lineHeight: 1.6,
    color: tokens.colorNeutralForeground2,
    ...shorthands.margin(0),
  },
  cta: {
    ...shorthands.padding("100px", "32px"),
    background: `linear-gradient(135deg, ${tokens.colorBrandBackground} 0%, #0d7ba8 100%)`,
    textAlign: "center",
    "@media (max-width: 768px)": {
      ...shorthands.padding("64px", "20px"),
    },
  },
  ctaContainer: {
    maxWidth: "800px",
    margin: "0 auto",
  },
  ctaTitle: {
    fontSize: "48px",
    fontWeight: 700,
    color: "white",
    ...shorthands.margin(0, 0, "16px", 0),
    "@media (max-width: 768px)": {
      fontSize: "36px",
    },
  },
  ctaSubtitle: {
    fontSize: "20px",
    color: "rgba(255, 255, 255, 0.9)",
    ...shorthands.margin(0, 0, "32px", 0),
    lineHeight: 1.5,
    "@media (max-width: 768px)": {
      fontSize: "18px",
    },
  },
  ctaButtonLarge: {
    fontSize: "18px",
    fontWeight: 600,
    ...shorthands.padding("16px", "40px"),
    height: "auto",
    backgroundColor: "white",
    color: tokens.colorBrandBackground,
    ...shorthands.border("none"),
    ...shorthands.transition("all", "0.3s"),
    ":hover": {
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      transform: "translateY(-2px)",
      boxShadow: "0 12px 32px rgba(0, 0, 0, 0.3)",
    },
  },
});

export default function Home() {
  const styles = useStyles();

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroBackground} />
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <Sparkle24Regular />
            <span>AI-Powered Inference Solutions</span>
          </div>

          <h1 className={styles.heroTitle}>
            Lightning-Fast Inference<br />for Modern AI
          </h1>

          <p className={styles.heroSubtitle}>
            Deploy, scale, and optimize your AI models with our cutting-edge inference platform.
            Built for developers who demand speed, reliability, and performance.
          </p>

          <div className={styles.ctaButtons}>
            <Button
              appearance="primary"
              className={styles.primaryButton}
              icon={<ArrowRight24Regular />}
              iconPosition="after"
            >
              Get Started
            </Button>
            <Button
              appearance="subtle"
              className={styles.secondaryButton}
            >
              View Documentation
            </Button>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.featuresContainer}>
          <h2 className={styles.featuresTitle}>Built for Performance</h2>
          <p className={styles.featuresSubtitle}>
            Everything you need to deploy AI models at scale with confidence
          </p>

          <div className={styles.featuresGrid}>
            <Card className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Flash24Regular />
              </div>
              <h3 className={styles.featureTitle}>Blazing Fast</h3>
              <p className={styles.featureDescription}>
                Sub-millisecond latency with optimized inference pipelines.
                Deliver AI-powered experiences that feel instant to your users.
              </p>
            </Card>

            <Card className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Shield24Regular />
              </div>
              <h3 className={styles.featureTitle}>Enterprise Ready</h3>
              <p className={styles.featureDescription}>
                Production-grade reliability with 99.99% uptime SLA.
                Built-in security, compliance, and monitoring tools.
              </p>
            </Card>

            <Card className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Sparkle24Regular />
              </div>
              <h3 className={styles.featureTitle}>Easy Integration</h3>
              <p className={styles.featureDescription}>
                Simple REST API and SDKs for all major languages.
                Deploy your models in minutes, not days.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className={styles.stats}>
        <div className={styles.statsContainer}>
          <div className={styles.statItem}>
            <h3 className={styles.statNumber}>99.99%</h3>
            <p className={styles.statLabel}>Uptime SLA</p>
          </div>
          <div className={styles.statItem}>
            <h3 className={styles.statNumber}>&lt;10ms</h3>
            <p className={styles.statLabel}>Average Latency</p>
          </div>
          <div className={styles.statItem}>
            <h3 className={styles.statNumber}>1M+</h3>
            <p className={styles.statLabel}>Requests per Second</p>
          </div>
          <div className={styles.statItem}>
            <h3 className={styles.statNumber}>150+</h3>
            <p className={styles.statLabel}>Model Architectures</p>
          </div>
        </div>
      </section>

      <section className={styles.useCases}>
        <div className={styles.useCasesContainer}>
          <h2 className={styles.useCasesTitle}>Built for Every Use Case</h2>
          <p className={styles.useCasesSubtitle}>
            From startups to enterprises, our platform scales with your needs
          </p>

          <div className={styles.useCasesGrid}>
            <div className={styles.useCaseCard}>
              <h3 className={styles.useCaseTitle}>💬 Conversational AI</h3>
              <p className={styles.useCaseDescription}>
                Power chatbots and virtual assistants with low-latency language models
              </p>
            </div>

            <div className={styles.useCaseCard}>
              <h3 className={styles.useCaseTitle}>🎨 Image Generation</h3>
              <p className={styles.useCaseDescription}>
                Deploy diffusion models for creative applications and content creation
              </p>
            </div>

            <div className={styles.useCaseCard}>
              <h3 className={styles.useCaseTitle}>🔍 Computer Vision</h3>
              <p className={styles.useCaseDescription}>
                Run object detection, classification, and segmentation at scale
              </p>
            </div>

            <div className={styles.useCaseCard}>
              <h3 className={styles.useCaseTitle}>📊 Data Analysis</h3>
              <p className={styles.useCaseDescription}>
                Process and analyze structured data with specialized ML models
              </p>
            </div>

            <div className={styles.useCaseCard}>
              <h3 className={styles.useCaseTitle}>🎵 Audio Processing</h3>
              <p className={styles.useCaseDescription}>
                Transcription, synthesis, and audio generation in real-time
              </p>
            </div>

            <div className={styles.useCaseCard}>
              <h3 className={styles.useCaseTitle}>🔒 Content Moderation</h3>
              <p className={styles.useCaseDescription}>
                Keep your platform safe with automated content filtering
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaContainer}>
          <h2 className={styles.ctaTitle}>Ready to Get Started?</h2>
          <p className={styles.ctaSubtitle}>
            Join thousands of developers already building the future with InferenceBros.
            Start deploying your models in minutes with our free tier.
          </p>
          <Button
            appearance="primary"
            className={styles.ctaButtonLarge}
            icon={<ArrowRight24Regular />}
            iconPosition="after"
          >
            Start Building Now
          </Button>
        </div>
      </section>
    </>
  );
}
