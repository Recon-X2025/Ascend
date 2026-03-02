import { registerPrompt } from "./index";

registerPrompt({
  version: "fit-score-v1",
  feature: "FIT_SCORER",
  description:
    "Multi-dimensional profile vs JD fit scoring. Returns 0-100 score with breakdown across skills, experience, education, location, keywords, completeness.",
  build: () => {
    throw new Error("fit-score-v1 not yet implemented");
  },
});
