export const COLLECTIONS = {
  USERS: "users",

  PAYMENTS: "payments",

  SUBSCRIPTIONS: "subscriptions",

  CONVERSATIONS: "conversations",

  MESSAGES: "messages",

  NOTIFICATIONS: "notifications",

  REFERRALS: "referrals",

  AI_PROFILES: "aiProfiles",

  REPORTS: "reports",

  SETTINGS: "settings",

  PLANS: "plans",

  COUNTRIES: "countries",
} as const;

export type CollectionName =
  (typeof COLLECTIONS)[keyof typeof COLLECTIONS];