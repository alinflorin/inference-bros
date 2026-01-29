import { Button } from "@fluentui/react-components";
import type { ButtonProps } from "@fluentui/react-components";

interface CTAButtonProps extends Omit<ButtonProps, "appearance"> {
  variant?: "primary" | "secondary";
  href?: string;
}

export default function CTAButton({ variant = "primary", href, children, onClick, ...props }: CTAButtonProps) {
  const appearance = variant === "primary" ? "primary" : "outline";

  const handleClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (href) {
      e.preventDefault();
      if (href.startsWith("#")) {
        const element = document.querySelector(href);
        element?.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.href = href;
      }
    }
    onClick?.(e as React.MouseEvent<HTMLButtonElement>);
  };

  return (
    <Button appearance={appearance} size="large" onClick={handleClick} {...props}>
      {children}
    </Button>
  );
}
