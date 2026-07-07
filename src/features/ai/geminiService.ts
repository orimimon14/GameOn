import { httpsCallable } from 'firebase/functions';

import { getFirebase } from '@/config/firebase';

// AI goes through the server-side Gemini proxy only (AI_INTEGRATION §2):
// no AI SDK, no API key and no model id ever reach the client.
export type SquadStrategyRole = {
  role: string;
  description: string;
};

export type SquadStrategy = {
  strategyName: string;
  summary: string;
  roles?: SquadStrategyRole[];
  tips: string[];
  warnings?: string[];
};

export const generateSquadStrategy = async (
  gameId: string,
  gameName: string,
  playstyle: string,
  rank?: string,
): Promise<SquadStrategy> => {
  const { functions } = getFirebase();
  const response = await httpsCallable<
    { gameId: string; gameName: string; playstyle?: string; rank?: string },
    SquadStrategy
  >(functions, 'sendAISquadAdvice')({ gameId, gameName, playstyle, ...(rank ? { rank } : {}) });
  return response.data;
};
