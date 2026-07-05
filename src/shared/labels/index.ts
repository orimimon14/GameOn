
import { enLabels } from './en';
import { heLabels } from './he';
import type { EnumLabels } from './types';

import { useLocale } from '@/shared/i18n/useLocale';
import type { Locale } from '@/config/i18n';

export type { EnumLabels } from './types';

export const enumLabels: Record<Locale, EnumLabels> = {
  he: heLabels,
  en: enLabels,
};

// Locale-aware enum labels for components: const labels = useLabels(); labels.skillLevel[profile.skillLevel]
export const useLabels = (): EnumLabels => {
  const { locale } = useLocale();
  return enumLabels[locale];
};
