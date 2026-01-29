import {
  makeStyles,
  shorthands,
  tokens,
  Card,
  Input,
  Textarea,
  Button,
  Label,
} from "@fluentui/react-components";
import { Send24Regular, Mail24Regular, Phone24Regular, Location24Regular } from "@fluentui/react-icons";

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
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr",
      ...shorthands.gap("32px"),
    },
  },
  formCard: {
    ...shorthands.padding("40px"),
  },
  form: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("24px"),
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
  },
  label: {
    fontSize: "14px",
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  input: {
    width: "100%",
  },
  textarea: {
    width: "100%",
    minHeight: "150px",
    resize: "vertical",
  },
  submitButton: {
    alignSelf: "flex-start",
  },
  infoSection: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("32px"),
  },
  infoCard: {
    ...shorthands.padding("32px"),
  },
  infoTitle: {
    fontSize: "24px",
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    ...shorthands.margin(0, 0, "24px", 0),
  },
  contactInfo: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("20px"),
  },
  contactItem: {
    display: "flex",
    alignItems: "start",
    ...shorthands.gap("16px"),
  },
  contactIcon: {
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ...shorthands.borderRadius("8px"),
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
  },
  contactDetails: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("4px"),
  },
  contactLabel: {
    fontSize: "14px",
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  contactValue: {
    fontSize: "15px",
    color: tokens.colorNeutralForeground2,
    ...shorthands.margin(0),
  },
  hoursCard: {
    ...shorthands.padding("32px"),
    backgroundColor: tokens.colorBrandBackground2,
  },
  hoursTitle: {
    fontSize: "20px",
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    ...shorthands.margin(0, 0, "16px", 0),
  },
  hoursText: {
    fontSize: "15px",
    lineHeight: 1.8,
    color: tokens.colorNeutralForeground2,
    ...shorthands.margin(0),
  },
});

export default function Contact() {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Get in Touch</h1>
        <p className={styles.subtitle}>
          Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </p>
      </div>

      <div className={styles.content}>
        <Card className={styles.formCard}>
          <form className={styles.form}>
            <div className={styles.formGroup}>
              <Label className={styles.label} htmlFor="name">
                Name *
              </Label>
              <Input
                id="name"
                className={styles.input}
                placeholder="Your name"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <Label className={styles.label} htmlFor="email">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                className={styles.input}
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <Label className={styles.label} htmlFor="company">
                Company
              </Label>
              <Input
                id="company"
                className={styles.input}
                placeholder="Your company name"
              />
            </div>

            <div className={styles.formGroup}>
              <Label className={styles.label} htmlFor="subject">
                Subject *
              </Label>
              <Input
                id="subject"
                className={styles.input}
                placeholder="What's this about?"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <Label className={styles.label} htmlFor="message">
                Message *
              </Label>
              <Textarea
                id="message"
                className={styles.textarea}
                placeholder="Tell us more about your project or question..."
                required
              />
            </div>

            <Button
              appearance="primary"
              className={styles.submitButton}
              icon={<Send24Regular />}
              iconPosition="after"
              type="submit"
            >
              Send Message
            </Button>
          </form>
        </Card>

        <div className={styles.infoSection}>
          <Card className={styles.infoCard}>
            <h2 className={styles.infoTitle}>Contact Information</h2>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <div className={styles.contactIcon}>
                  <Mail24Regular />
                </div>
                <div className={styles.contactDetails}>
                  <span className={styles.contactLabel}>Email</span>
                  <p className={styles.contactValue}>hello@inferencebros.com</p>
                </div>
              </div>

              <div className={styles.contactItem}>
                <div className={styles.contactIcon}>
                  <Phone24Regular />
                </div>
                <div className={styles.contactDetails}>
                  <span className={styles.contactLabel}>Phone</span>
                  <p className={styles.contactValue}>+1 (555) 123-4567</p>
                </div>
              </div>

              <div className={styles.contactItem}>
                <div className={styles.contactIcon}>
                  <Location24Regular />
                </div>
                <div className={styles.contactDetails}>
                  <span className={styles.contactLabel}>Office</span>
                  <p className={styles.contactValue}>
                    123 AI Street, Suite 100<br />
                    San Francisco, CA 94105<br />
                    United States
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className={styles.hoursCard}>
            <h3 className={styles.hoursTitle}>Support Hours</h3>
            <p className={styles.hoursText}>
              Monday - Friday: 9:00 AM - 6:00 PM PST<br />
              Saturday - Sunday: Closed<br />
              <br />
              Enterprise customers have access to 24/7 support via our dedicated channels.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
