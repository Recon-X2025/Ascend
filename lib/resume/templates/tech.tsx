import React from "react";
import type { TemplateProps } from "./types";
import { TemplateLayout } from "./TemplateLayout";

/** Tech-focused single-column resume. Skills before Experience. Calibri. ATS-safe. */
export function TechTemplate(props: TemplateProps) {
  return <TemplateLayout {...props} templateId="tech" fontFamily="Calibri, sans-serif" />;
}

export default TechTemplate;
