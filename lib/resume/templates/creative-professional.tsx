import React from "react";
import type { TemplateProps } from "./types";
import { TemplateLayout } from "./TemplateLayout";

/** Creative professional single-column resume. Arial. ATS-safe (no graphics). */
export function CreativeProfessionalTemplate(props: TemplateProps) {
  return (
    <TemplateLayout
      {...props}
      templateId="creative-professional"
      fontFamily="Arial, sans-serif"
    />
  );
}

export default CreativeProfessionalTemplate;
