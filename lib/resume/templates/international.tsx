import React from "react";
import type { TemplateProps } from "./types";
import { TemplateLayout } from "./TemplateLayout";

/** International / EU-style single-column resume. Times New Roman. ATS-safe. */
export function InternationalTemplate(props: TemplateProps) {
  return (
    <TemplateLayout
      {...props}
      templateId="international"
      fontFamily="'Times New Roman', Times, serif"
    />
  );
}

export default InternationalTemplate;
