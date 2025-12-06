import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  // EventTracker stores a single tracker per user with the event name and all recorded days
  // Each user can only access their own tracker (owner-based auth)
  EventTracker: a
    .model({
      eventName: a.string().required(),
      recordedDays: a.string().array(), // Array of date keys (YYYY-MM-DD)
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
