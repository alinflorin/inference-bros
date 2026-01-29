import { Button, makeStyles, shorthands, Text, tokens, Drawer, DrawerBody, DrawerHeader, DrawerHeaderTitle } from "@fluentui/react-components";
import { Dismiss24Regular, Navigation24Regular } from "@fluentui/react-icons";
import { useState } from "react";
import Container from "../layout/Container";

const useStyles = makeStyles({
  header: {
    position: "sticky",
    top: 0,
    zIndex: 1000,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke2),
    boxShadow: tokens.shadow4,
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "70px",
  },
  logo: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    cursor: "pointer",
    textDecoration: "none",
  },
  nav: {
    display: "none",
    "@media (min-width: 768px)": {
      display: "flex",
      alignItems: "center",
      ...shorthands.gap("2rem"),
    },
  },
  navLink: {
    color: tokens.colorNeutralForeground2,
    textDecoration: "none",
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightMedium,
    cursor: "pointer",
    ":hover": {
      color: tokens.colorBrandForeground1,
    },
  },
  ctaButton: {
    display: "none",
    "@media (min-width: 768px)": {
      display: "inline-flex",
    },
  },
  mobileMenuButton: {
    display: "inline-flex",
    "@media (min-width: 768px)": {
      display: "none",
    },
  },
  drawerContent: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("1.5rem"),
    ...shorthands.padding("1rem"),
  },
  drawerNavLink: {
    color: tokens.colorNeutralForeground2,
    textDecoration: "none",
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightMedium,
    ...shorthands.padding("0.75rem", "0"),
    cursor: "pointer",
  },
});

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

export default function Header() {
  const styles = useStyles();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className={styles.header}>
      <Container>
        <div className={styles.headerContent}>
          <a href="/" className={styles.logo}>
            <Text>Inference Bros</Text>
          </a>

          <nav className={styles.nav}>
            {navLinks.map((link) => (
              <a key={link.href} className={styles.navLink} onClick={() => handleNavClick(link.href)}>
                {link.label}
              </a>
            ))}
            <Button appearance="primary" onClick={() => handleNavClick("#contact")}>
              Request Demo
            </Button>
          </nav>

          <Button
            appearance="subtle"
            icon={<Navigation24Regular />}
            className={styles.mobileMenuButton}
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          />
        </div>
      </Container>

      <Drawer
        type="overlay"
        position="end"
        open={mobileMenuOpen}
        onOpenChange={(_, { open }) => setMobileMenuOpen(open)}
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                icon={<Dismiss24Regular />}
                onClick={() => setMobileMenuOpen(false)}
              />
            }
          >
            Menu
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
          <div className={styles.drawerContent}>
            {navLinks.map((link) => (
              <a
                key={link.href}
                className={styles.drawerNavLink}
                onClick={() => handleNavClick(link.href)}
              >
                {link.label}
              </a>
            ))}
            <Button appearance="primary" size="large" onClick={() => handleNavClick("#contact")}>
              Request Demo
            </Button>
          </div>
        </DrawerBody>
      </Drawer>
    </header>
  );
}
