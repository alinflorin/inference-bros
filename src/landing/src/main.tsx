import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Route, Routes } from "react-router";
import Home from "./routes/Home.tsx";
import NotFound from "./routes/NotFound.tsx";
import { FluentProvider } from "@fluentui/react-components";
import inferenceBrosTheme from "./theme.ts";
import About from "./routes/About.tsx";
import Contact from "./routes/Contact.tsx";
import Services from "./routes/Services.tsx";


createRoot(document.getElementById("root")!).render(
  <FluentProvider theme={inferenceBrosTheme} style={{height: '100vh'}}>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route path="" element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="services" element={<Services />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </FluentProvider>,
);
