// @ts-ignore - explicit extension needed for CI/CD build resolution
import { auth } from "./auth/resource.ts";
// @ts-ignore
import { data } from "./data/resource.ts";
import { defineBackend } from "@aws-amplify/backend";

defineBackend({
  auth,
  data,
});
