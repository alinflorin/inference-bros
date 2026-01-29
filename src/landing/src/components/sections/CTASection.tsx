import { makeStyles, shorthands, Text, tokens } from "@fluentui/react-components";
import Section from "../layout/Section";
import Container from "../layout/Container";
import ContactForm from "../cta/ContactForm";
import { ctaSection } from "../../data/content";

const useStyles = makeStyles({
  content: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("3rem"),
    alignItems: "center",
  },
  header: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("1rem"),
  },
  headline: {
    fontSize: "2.5rem",
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    "@media (min-width: 768px)": {
      fontSize: "3rem",
    },
  },
  subheadline: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    maxWidth: "600px",
    marginLeft: "auto",
    marginRight: "auto",
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
