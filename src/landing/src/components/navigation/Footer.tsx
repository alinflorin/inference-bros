import { makeStyles, shorthands, Text, tokens } from "@fluentui/react-components";
import Container from "../layout/Container";
import { footerContent } from "../../data/content";

const useStyles = makeStyles({
  footer: {
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.padding("4rem", "0", "2rem", "0"),
    ...shorthands.borderTop("1px", "solid", tokens.colorNeutralStroke2),
  },
  footerContent: {
    display: "grid",
    gridTemplateColumns: "1fr",
    ...shorthands.gap("3rem"),
    "@media (min-width: 768px)": {
      gridTemplateColumns: "2fr 1fr 1fr 1fr",
      ...shorthands.gap("2rem"),
    },
  },
  footerBrand: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("1rem"),
  },
  brandName: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
  },
  tagline: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground2,
  },
  description: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    lineHeight: "1.6",
  },
  footerColumn: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("1rem"),
  },
  columnTitle: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: "0.5rem",
  },
  footerLink: {
    color: tokens.colorNeutralForeground2,
    textDecoration: "none",
    fontSize: tokens.fontSizeBase200,
    cursor: "pointer",
    ":hover": {
      color: tokens.colorBrandForeground1,
    },
  },
  footerBottom: {
    ...shorthands.margin("3rem", "0", "0", "0"),
    paddingTop: "2rem",
    ...shorthands.borderTop("1px", "solid", tokens.colorNeutralStroke2),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    ...shorthands.gap("1rem"),
    "@media (min-width: 768px)": {
      flexDirection: "row",
      justifyContent: "space-between",
    },
  },
  copyright: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  socialLinks: {
    display: "flex",
    ...shorthands.gap("1.5rem"),
  },
});

export default function Footer() {
  const styles = useStyles();

  const handleLinkClick = (href: string) => {
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      element?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.open(href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <Text className={styles.brandName}>{footerContent.companyName}</Text>
            <Text className={styles.tagline}>{footerContent.tagline}</Text>
            <Text className={styles.description}>{footerContent.description}</Text>
          </div>

          <div className={styles.footerColumn}>
            <Text className={styles.columnTitle}>Product</Text>
            {footerContent.links.product.map((link) => (
              <a key={link.label} className={styles.footerLink} onClick={() => handleLinkClick(link.href)}>
                {link.label}
              </a>
            ))}
          </div>

          <div className={styles.footerColumn}>
            <Text className={styles.columnTitle}>Company</Text>
            {footerContent.links.company.map((link) => (
              <a key={link.label} className={styles.footerLink} onClick={() => handleLinkClick(link.href)}>
                {link.label}
              </a>
            ))}
          </div>

          <div className={styles.footerColumn}>
            <Text className={styles.columnTitle}>Legal</Text>
            {footerContent.links.legal.map((link) => (
              <a key={link.label} className={styles.footerLink} onClick={() => handleLinkClick(link.href)}>
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className={styles.footerBottom}>
          <Text className={styles.copyright}>{footerContent.copyright}</Text>
          <div className={styles.socialLinks}>
            <a className={styles.footerLink} onClick={() => handleLinkClick(footerContent.social.slack)}>
              Slack
            </a>
            <a className={styles.footerLink} onClick={() => handleLinkClick(footerContent.social.github)}>
              GitHub
            </a>
            <a className={styles.footerLink} onClick={() => handleLinkClick(footerContent.social.linkedin)}>
              LinkedIn
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
