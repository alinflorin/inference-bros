import { useState } from "react";
import { Link, useLocation } from "react-router";
import {
  makeStyles,
  shorthands,
  tokens,
  Text,
  Button,
} from "@fluentui/react-components";
import { Navigation24Regular, Dismiss24Regular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    ...shorthands.padding("16px", "32px"),
    backgroundColor: tokens.colorBrandBackground,
    boxShadow: tokens.shadow4,
    position: "relative",
    "@media (max-width: 768px)": {
      ...shorthands.padding("12px", "16px"),
    },
  },
  leftSection: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("16px"),
    zIndex: 1001,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("12px"),
    textDecoration: "none",
    color: "white",
  },
  logoImage: {
    height: "32px",
    width: "auto",
    "@media (max-width: 768px)": {
      height: "28px",
    },
  },
  logoText: {
    fontSize: "20px",
    fontWeight: 600,
    color: "white",
    "@media (max-width: 768px)": {
      fontSize: "18px",
    },
  },
  nav: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("24px"),
    "@media (max-width: 768px)": {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: tokens.colorBrandBackground,
      flexDirection: "column",
      justifyContent: "center",
      ...shorthands.gap("32px"),
      zIndex: 1000,
    },
  },
  navHidden: {
    "@media (max-width: 768px)": {
      display: "none",
    },
  },
  navLink: {
    color: "white",
    textDecoration: "none",
    fontSize: "15px",
    fontWeight: 500,
    ...shorthands.padding("8px", "12px"),
    ...shorthands.borderRadius("4px"),
    ...shorthands.transition("background-color", "0.2s"),
    ":hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    "@media (max-width: 768px)": {
      fontSize: "24px",
      ...shorthands.padding("12px", "24px"),
    },
  },
  navLinkActive: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  menuButton: {
    display: "none",
    color: "white",
    zIndex: 1001,
    "@media (max-width: 768px)": {
      display: "flex",
    },
  },
});

export function Header() {
  const styles = useStyles();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <Link to="/" className={styles.logo} onClick={closeMenu}>
          <img src="/logo.svg" alt="InferenceBros" className={styles.logoImage} />
          <Text className={styles.logoText}>InferenceBros</Text>
        </Link>
      </div>

      <Button
        appearance="transparent"
        icon={mobileMenuOpen ? <Dismiss24Regular /> : <Navigation24Regular />}
        onClick={toggleMenu}
        className={styles.menuButton}
        aria-label="Toggle menu"
      />

      <nav className={`${styles.nav} ${!mobileMenuOpen ? styles.navHidden : ""}`}>
        <Link
          to="/"
          className={`${styles.navLink} ${isActive("/") ? styles.navLinkActive : ""}`}
          onClick={closeMenu}
        >
          Home
        </Link>
        <Link
          to="/about"
          className={`${styles.navLink} ${isActive("/about") ? styles.navLinkActive : ""}`}
          onClick={closeMenu}
        >
          About
        </Link>
        <Link
          to="/services"
          className={`${styles.navLink} ${isActive("/services") ? styles.navLinkActive : ""}`}
          onClick={closeMenu}
        >
          Services
        </Link>
        <Link
          to="/contact"
          className={`${styles.navLink} ${isActive("/contact") ? styles.navLinkActive : ""}`}
          onClick={closeMenu}
        >
          Contact
        </Link>
      </nav>
    </header>
  );
}
