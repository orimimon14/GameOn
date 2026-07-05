// Safe stub — AI is temporarily disabled during the production migration.
// Gemini will be reintroduced server-side only, via Cloud Functions (see docs/architecture/AI_INTEGRATION.md).
// This file must not import any AI SDK, contain any API key, or call any external API.

export const generateSquadStrategy = async (_playstyle: string) => {
  return {
    strategyName: "AI מושבת זמנית",
    description: "יכולות ה-AI מושבתות זמנית במהלך המעבר לסביבת production. הן יחזרו דרך שרת מאובטח.",
    roles: [],
    tips: [],
  };
};
