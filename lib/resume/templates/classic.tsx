import React from "react";
import type { TemplateProps } from "./types";
import { TemplateLayout } from "./TemplateLayout";

/** Classic single-column resume. Arial. ATS-safe. */
export function ClassicTemplate(props: TemplateProps) {
  return <TemplateLayout {...props} templateId="classic" fontFamily="Arial, sans-serif" />;
}

export default ClassicTemplate;
