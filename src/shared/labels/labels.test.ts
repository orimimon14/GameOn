import { describe, expect, it } from 'vitest';

import { enumLabels } from './index';

import {
  LOOKING_FOR,
  PLATFORMS,
  REPORT_REASONS,
  SHOP_ITEM_CATEGORIES,
  SHOP_ITEM_RARITIES,
  SKILL_LEVELS,
} from '@/shared/enums';


// TC-X-002 (partial): every canonical enum value has a non-empty label in every supported locale.
const CASES = [
  ['skillLevel', SKILL_LEVELS],
  ['platform', PLATFORMS],
  ['lookingFor', LOOKING_FOR],
  ['shopItemCategory', SHOP_ITEM_CATEGORIES],
  ['shopItemRarity', SHOP_ITEM_RARITIES],
  ['reportReason', REPORT_REASONS],
] as const;

describe('enum label maps (TC-X-002)', () => {
  for (const locale of ['he', 'en'] as const) {
    for (const [field, values] of CASES) {
      it(`covers every ${field} value in "${locale}"`, () => {
        for (const value of values) {
          const label = enumLabels[locale][field][value as never];
          expect(label, `${locale}.${field}.${value}`).toBeTruthy();
          expect(String(label).trim().length).toBeGreaterThan(0);
        }
      });
    }
  }
});
