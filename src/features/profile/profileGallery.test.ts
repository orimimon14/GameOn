import { describe, expect, it } from 'vitest';

import {
  GALLERY_MAX_BASIC,
  GALLERY_MAX_PRO,
  GALLERY_VIDEO_MAX_BYTES,
  galleryRejection,
} from './profileApi';

// ADR-042 — client-side mirror of the rules: Basic up to 3 photos, Pro up to
// 9 items including videos (≤50MB, mp4/webm/quicktime).
describe('galleryRejection', () => {
  const image = { type: 'image/jpeg', size: 2_000_000 };
  const video = { type: 'video/mp4', size: 20_000_000 };

  it('accepts images under the tier cap', () => {
    expect(galleryRejection(image, 0, false)).toBeNull();
    expect(galleryRejection(image, GALLERY_MAX_BASIC - 1, false)).toBeNull();
    expect(galleryRejection(image, GALLERY_MAX_PRO - 1, true)).toBeNull();
  });

  it('rejects when the tier cap is reached', () => {
    expect(galleryRejection(image, GALLERY_MAX_BASIC, false)).toBe('full');
    expect(galleryRejection(image, GALLERY_MAX_PRO, true)).toBe('full');
  });

  it('gates videos to Pro', () => {
    expect(galleryRejection(video, 0, false)).toBe('video_pro_only');
    expect(galleryRejection(video, 0, true)).toBeNull();
  });

  it('accepts quicktime (iPhone) and strips codecs suffixes', () => {
    expect(galleryRejection({ type: 'video/quicktime', size: 1_000 }, 0, true)).toBeNull();
    expect(galleryRejection({ type: 'video/webm;codecs=vp8', size: 1_000 }, 0, true)).toBeNull();
  });

  it('rejects oversized videos and unsupported types', () => {
    expect(galleryRejection({ type: 'video/mp4', size: GALLERY_VIDEO_MAX_BYTES + 1 }, 0, true)).toBe(
      'video_too_big',
    );
    expect(galleryRejection({ type: 'application/pdf', size: 1_000 }, 0, true)).toBe('bad_type');
  });
});
