import React from "react";
import type { TemplateProps } from "./types";
import { TemplateLayout } from "./TemplateLayout";

/** Executive single-column resume. Times New Roman. Section order: Summary → Experience → Achievements → Education → Board. ATS-safe. */
export function ExecutiveTemplate(props: TemplateProps) {
  return (
    <TemplateLayout
      {...props}
      templateId="executive"
      fontFamily="'Times New Roman', Times, serif"
    />
  );
}

export default ExecutiveTemplate;
