import React from "react";
import type { TemplateProps } from "./types";
import { TemplateLayout } from "./TemplateLayout";

/** Modern single-column resume. Calibri. ATS-safe. */
export function ModernTemplate(props: TemplateProps) {
  return <TemplateLayout {...props} templateId="modern" fontFamily="Calibri, Arial, sans-serif" />;
}

export default ModernTemplate;
