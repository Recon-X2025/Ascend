import { registerPrompt } from "./index";

registerPrompt({
  version: "career-intelligence-v1",
  feature: "CAREER_INTELLIGENCE",
  description:
    "Generates personalised career insights from profile data, application history, and market trends.",
  build: () => {
    throw new Error("career-intelligence-v1 not yet implemented");
  },
});
