import { registerPrompt } from "./index";

registerPrompt({
  version: "resume-builder-v1",
  feature: "RESUME_BUILDER",
  description:
    "Forward-focused resume content generation from profile + career intent. Rewrites bullets as achievements, generates professional summary, optimises for ATS.",
  build: () => {
    throw new Error("resume-builder-v1 not yet implemented");
  },
});
