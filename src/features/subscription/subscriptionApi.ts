import { httpsCallable } from 'firebase/functions';

import { getFirebase } from '@/config/firebase';

// API_CONTRACT §3.13 — asks the backend for a checkout URL. The redirect
// grants nothing; Pro flips only via the verified payment webhook (ADR-037).
export const startProCheckout = async (): Promise<string> => {
  const { functions } = getFirebase();
  const result = await httpsCallable(functions, 'createCheckoutSession')({});
  return (result.data as { checkoutUrl: string }).checkoutUrl;
};
