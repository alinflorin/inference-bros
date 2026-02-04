import {
  Button,
  Field,
  Input,
  makeStyles,
  MessageBar,
  MessageBarBody,
  shorthands,
  Textarea,
} from "@fluentui/react-components";
import { useState } from "react";

const useStyles = makeStyles({
  form: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("1.75rem"),
    maxWidth: "100%",
    marginLeft: "auto",
    marginRight: "auto",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr",
    ...shorthands.gap("1.75rem"),
    "@media (min-width: 768px)": {
      gridTemplateColumns: "1fr 1fr",
    },
  },
  submitButton: {
    marginTop: "0.5rem",
    width: "100%",
    boxShadow: "0 10px 30px rgba(255, 107, 0, 0.25)",
    "@media (min-width: 768px)": {
      width: "auto",
      minWidth: "200px",
    },
  },
});

interface FormData {
  name: string;
  email: string;
  company: string;
  message: string;
}

export default function ContactForm() {
  const styles = useStyles();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitted, setSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!formData.company.trim()) {
      newErrors.company = "Company is required";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      console.log("Form submitted:", formData);
      setSubmitted(true);

      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({ name: "", email: "", company: "", message: "" });
        setSubmitted(false);
      }, 3000);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {submitted && (
        <MessageBar intent="success">
          <MessageBarBody>
            Thank you for your interest! We'll get back to you soon.
          </MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.row}>
        <Field
          label="Name"
          required
          validationMessage={errors.name}
          validationState={errors.name ? "error" : undefined}
        >
          <Input
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="John Doe"
          />
        </Field>

        <Field
          label="Email"
          required
          validationMessage={errors.email}
          validationState={errors.email ? "error" : undefined}
        >
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="john@company.com"
          />
        </Field>
      </div>

      <Field
        label="Company"
        required
        validationMessage={errors.company}
        validationState={errors.company ? "error" : undefined}
      >
        <Input
          value={formData.company}
          onChange={(e) => handleChange("company", e.target.value)}
          placeholder="Your Company Inc."
        />
      </Field>

      <Field
        label="Message"
        required
        validationMessage={errors.message}
        validationState={errors.message ? "error" : undefined}
      >
        <Textarea
          value={formData.message}
          onChange={(e) => handleChange("message", e.target.value)}
          placeholder="Tell us about your use case and requirements..."
          rows={5}
        />
      </Field>

      <Button type="submit" appearance="primary" size="large" className={styles.submitButton}>
        Send Message
      </Button>
    </form>
  );
}
