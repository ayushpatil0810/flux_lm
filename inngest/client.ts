import { Inngest } from "inngest";

/**
 * Shared Inngest Client instance for Flux background workflows & durable functions.
 */
export const inngest = new Inngest({
  id: "flux-ai",
});
