import { makeStyles, shorthands, Text, tokens } from "@fluentui/react-components";
import Section from "../layout/Section";
import Container from "../layout/Container";
import ContactForm from "../cta/ContactForm";
import { ctaSection } from "../../data/content";

const useStyles = makeStyles({
  content: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("2.5rem"),
    alignItems: "center",
    "@media (min-width: 768px)": {
      ...shorthands.gap("3rem"),
    },
  },
  header: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("1rem"),
  },
  headline: {
    fontSize: "2rem",
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    lineHeight: "1.2",
    textAlign: "center",
    "@media (min-width: 768px)": {
      fontSize: "2.75rem",
    },
  },
  subheadline: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    maxWidth: "650px",
    marginLeft: "auto",
    marginRight: "auto",
    lineHeight: "1.6",
    textAlign: "center",
    "@media (min-width: 768px)": {
      fontSize: tokens.fontSizeBase500,
    },
  },
  formContainer: {
    width: "100%",
    maxWidth: "700px",
  },
});

export default function CTASection() {
  const styles = useStyles();

  return (
    <Section id="contact" backgroundColor="subtle" paddingSize="large">
      <Container maxWidth="medium">
        <div className={styles.content}>
          <div className={styles.header}>
            <Text className={styles.headline}>{ctaSection.headline}</Text>
            <Text className={styles.subheadline}>{ctaSection.subheadline}</Text>
          </div>
          <div className={styles.formContainer}>
            <ContactForm />
          </div>
        </div>
      </Container>
    </Section>
  );
}
