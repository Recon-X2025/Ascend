import { registerPrompt } from "./index";

registerPrompt({
  version: "interview-prep-v1",
  feature: "INTERVIEW_PREP",
  description:
    "Generates contextual interview questions + STAR answers based on the specific JD and candidate profile.",
  build: () => {
    throw new Error("interview-prep-v1 not yet implemented");
  },
});
