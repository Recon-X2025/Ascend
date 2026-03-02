import { registerPrompt } from "./index";

registerPrompt({
  version: "jd-optimiser-v1",
  feature: "JD_OPTIMISER",
  description:
    "Repositions and reframes existing experience to match a specific JD. Never fabricates. Returns diff of changes for user review.",
  build: () => {
    throw new Error("jd-optimiser-v1 not yet implemented");
  },
});
