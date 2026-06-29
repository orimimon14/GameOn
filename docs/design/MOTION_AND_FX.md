# Swish & Game — Motion & FX: Cosmetic Rendering System

## 1. Document Metadata

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Motion & FX Rendering Contract |
| Repository Path | `docs/design/MOTION_AND_FX.md` |
| Product | Swish & Game |
| Source of Truth | `docs/product/DECISIONS.md` (`ADR-039`), `docs/design/DESIGN_SYSTEM.md`, `docs/architecture/DATA_MODEL.md`, `docs/architecture/ARCHITECTURE.md`, `docs/engineering/CONVENTIONS.md` |
| Scope | Rendering, animation formats, performance budgets, asset delivery, sound, accessibility, cosmetics pipeline |
| Product Goal | חוויית גיימרים מרשימה, פרימיום, חיה ודינמית — בלי לפגוע בביצועים, סוללה או נגישות |
| Current Platform | Web / React + Vite |
| Future Platform | Capacitor-ready native shell for iOS/Android |
| Rendering Principle | Use each technology only where it is strongest |
| Ownership | Technical Art Director / Frontend Graphics Lead + Frontend Platform |
| Data Impact | Requires sync to `DATA_MODEL.md` for `shopItems.renderType` and asset fields |

---

## Table of Contents

- [1. Document Metadata](#1-document-metadata)
- [2. Rendering Philosophy](#2-rendering-philosophy)
- [3. The Layered Stack](#3-the-layered-stack)
- [4. Asset Formats & Pipeline](#4-asset-formats--pipeline)
- [5. Asset Delivery](#5-asset-delivery)
- [6. Performance Budgets](#6-performance-budgets)
- [7. Accessibility & Safety](#7-accessibility--safety)
- [8. Shop Item Schema Impact](#8-shop-item-schema-impact)
- [9. Sound Design](#9-sound-design)
- [10. Curation](#10-curation)
- [11. Implementation Guidelines](#11-implementation-guidelines)
- [12. QA Checklist](#12-qa-checklist)
- [13. Open Items](#13-open-items)

---

## 2. Rendering Philosophy

### 2.1 Core Principle

Swish & Game צריכה להרגיש כמו מוצר גיימינג מודרני: עשיר, חי, זוהר, פרימיום ומלא אנרגיה.  
אבל האיכות לא באה על חשבון:

- FPS יציב.
- טעינה מהירה.
- סוללה.
- memory.
- נגישות.
- mobile performance.
- compatibility ב-WebView עתידי של Capacitor.

המטרה היא **לא** “להכניס כמה שיותר אפקטים”, אלא לבנות מערכת rendering חכמה שמרכיבה אפקטים בשכבות, לפי תפקיד, משקל, device tier והקשר UI.

### 2.2 Product Feel

ה-cosmetics צריכים להרגיש:

| Trait | Meaning |
|---|---|
| Gaming-native | אנימציות שמרגישות כמו inventory / battle pass / profile showcase. |
| Premium | תנועה חלקה, glow מדויק, sound design נקי. |
| Reactive | cosmetics יכולים להגיב ל-hover/tap/equip/state. |
| Layered | character / particles / background / UI glow / sound מחולקים לשכבות. |
| Performant | fallback איכותי במכשירים חלשים. |
| Accessible | reduced motion, no dangerous flashing, sound off by default. |

### 2.3 Web Now, Capacitor-Ready

המערכת מיועדת ל-Web היום, אבל צריכה להיות מוכנה ל-Capacitor בעתיד.

כל capability גרפי חייב להיבדק בהמשך ב:

- mobile browser אמיתי.
- iOS Safari.
- Android Chrome.
- Capacitor iOS WebView.
- Capacitor Android WebView.
- מכשירים חלשים, בינוניים וחזקים.

> חובה לאמת ביצועים ב-WebView על מכשירים אמיתיים לפני store launch. Desktop browser performance אינו מספיק.

### 2.4 Rendering Rules

- אין GIF ל-cosmetics.
- אין PNG sequences ארוכות.
- אין autoplay audio.
- אין forced motion כש-`prefers-reduced-motion` פעיל.
- אין אפקט שמסתיר content קריטי.
- אין infinite flashing.
- אין animation כבדה מחוץ למסך.
- כל אפקט חייב fallback ל-static image.
- כל asset חייב versioning ו-cache strategy.

---

## 3. The Layered Stack

### 3.1 Canonical Stack — ADR-039

| Layer | Technology | Format | Use For |
|---|---|---|---|
| Interactive / skeletal / state-machine | Rive | `.riv` | avatars, dynamic frames, animated characters, dragons, reactive cosmetics |
| UI micro animations | Lottie | `.json` / `.lottie` | coin burst, glow, success, equip feedback, small UI effects |
| Particles / fire / ambient lights | PixiJS / WebGL | particle systems | fire breath, sparks, aura, magical glow, background particles |
| Cinematic pre-rendered background | Alpha video | HEVC for iOS/Safari + VP9/WebM for Android/Chrome | complex cinematic backgrounds |
| Simple loops | Sprite sheets | PNG atlas | low-cost loops, simple repeating effects |
| Sound | Howler.js / Web Audio | audio sprites | equip sfx, UI sfx, ambient loops |

### 3.2 Technology Selection Matrix

| Need | Use | Avoid |
|---|---|---|
| Character with bones/state machine | Rive | Lottie if complex interaction needed |
| Small UI burst | Lottie | full WebGL scene |
| Fire / sparks / magic particles | PixiJS | video if interaction needed |
| Heavy cinematic background | Alpha video | live JS animation if too expensive |
| Simple repeating sparkle | Sprite sheet | Rive/Pixi if static timing is enough |
| One-shot equip sound | Howler audio sprite | separate audio file per effect |
| Ambient loop | Howler loop with low volume | autoplay without user consent |

### 3.3 Rive

Rive is the default for interactive/skeletal cosmetics.

Use Rive for:

- animated avatars.
- dynamic avatar frames.
- dragons/characters.
- stateful cosmetics: idle / hover / selected / equipped.
- controlled timelines.
- input-driven animations.
- profile showcase characters.

Pros:

- small vector/skeletal assets.
- state machines.
- interactive inputs.
- cleaner than frame-by-frame animation.
- good for character motion.

Cons:

- WASM/runtime cost.
- complex art pipeline.
- not ideal for dense particles.
- not ideal for cinematic pre-rendered backgrounds.

Approximate bundle/runtime note:

```text
Rive runtime/WASM: ~200KB class cost, depending package/build.
```

Use lazy loading for Rive runtime where possible.

### 3.4 Lottie

Lottie is for micro-interactions and lightweight UI motion.

Use Lottie for:

- coin burst.
- item purchased success.
- equip confirmation.
- small glow pulse.
- loading/success empty state decorations.
- Pro upgrade sparkle.

Pros:

- designer-friendly.
- good for small vector animations.
- easy UI embedding.
- lower runtime cost than full WebGL for UI effects.

Cons:

- can become heavy with complex masks/effects.
- JSON can be large.
- performance varies by renderer/features.
- not ideal for skeletal characters or heavy particles.

Approximate bundle/runtime note:

```text
Lottie runtime: ~60KB class cost, depending package/build.
```

Prefer `.lottie` for compressed bundles where supported.

### 3.5 PixiJS / WebGL

PixiJS is for GPU-powered particles and ambient effects.

Use PixiJS for:

- fire breath.
- sparks.
- smoke.
- electric aura.
- glowing dust.
- profile background particles.
- dynamic lighting illusions.
- layered atmospheric effects.

Pros:

- GPU accelerated.
- great for particles.
- scalable quality tiers.
- can pause/render on demand.
- ideal for game-like FX.

Cons:

- WebGL context cost.
- memory/GPU pressure.
- requires careful cleanup.
- can drain battery.
- needs fallbacks for weak devices.

Rule:

```text
Only one active heavy PixiJS scene per viewport unless explicitly approved.
```

### 3.6 Alpha Video

Alpha video is for cinematic pre-rendered backgrounds where live rendering would be too expensive.

Use alpha video for:

- complex cinematic background loops.
- high-fidelity smoke/flame/portal backgrounds.
- pre-rendered animated scenes.
- hero cosmetics with art-directed motion.

Canonical dual format:

| Browser / Platform | Format |
|---|---|
| iOS / Safari | HEVC with alpha |
| Android / Chrome | VP9/WebM with alpha |

Dual format is mandatory because Safari does not reliably support VP9 alpha for this use case.

Pros:

- highest visual fidelity.
- predictable art output.
- low CPU if hardware-decoded.
- great for background loops.

Cons:

- file size.
- codec support fragmentation.
- alpha compatibility requires testing.
- can impact memory/battery.
- no deep interactivity.

### 3.7 Sprite Sheets

Sprite sheets are for simple, predictable loops.

Use sprite sheets for:

- small sparkle loops.
- low-cost animated border details.
- fallback effects.
- tiny repeating UI decorations.
- simple aura shimmer.

Pros:

- predictable.
- easy fallback.
- no heavy runtime.
- can be GPU-friendly with CSS/Canvas.

Cons:

- memory heavy if too many frames.
- not scalable for complex animation.
- lower fidelity if overused.

Use PNG atlas or WebP/AVIF where supported for static previews, but canonical sprite sheet format remains PNG atlas unless updated.

### 3.8 Howler.js / Web Audio

Sound is part of the cosmetic experience, but must be user-controlled.

Use Howler.js / Web Audio for:

- equip sfx.
- purchase success.
- hover/tap UI sfx if enabled.
- ambient loops for premium cosmetics.
- audio sprites.

Pros:

- cross-browser abstraction.
- audio sprite support.
- volume/mute control.
- good for short effects.

Cons:

- autoplay restrictions.
- accessibility concerns.
- can annoy users.
- memory if many files loaded.

Rule:

```text
Sound is off by default until user enables it, or only plays after explicit user gesture.
```

### 3.9 Full Example — “רקע דרקון נושף אש שעף ברקע”

Use layered rendering, not one giant asset.

| Layer | Technology | Why |
|---|---|---|
| Dragon body / wings / idle flight | Rive `.riv` | skeletal animation, state machine, interactive quality |
| Fire breath particles | PixiJS / WebGL | dynamic flame, sparks, smoke, glow |
| Far cinematic sky / clouds | Alpha video or static/video background | expensive background pre-rendered |
| Small UI glow around profile card | Lottie or CSS | lightweight micro-animation |
| Ambient embers | PixiJS low-particle tier or sprite sheet | scalable by device tier |
| Roar/equip sound | Howler audio sprite | triggered on equip or preview |
| Low-end fallback | static image + subtle CSS glow | battery/performance safety |

Rendering flow:

```text
Profile banner loads
  → static poster shown immediately
  → equipped cosmetic assets lazy-load
  → Rive dragon starts idle if motion allowed
  → Pixi fire system enabled only on preview/equip/visible state
  → alpha video background starts muted if high tier and visible
  → Howler equip sfx plays only after user gesture and sound enabled
  → when offscreen, all animation pauses
```

---

## 4. Asset Formats & Pipeline

### 4.1 Canonical Asset Formats

| Asset Type | Format | Notes |
|---|---|---|
| Rive animation | `.riv` | interactive/skeletal/state machine |
| Lottie animation | `.json` / `.lottie` | micro UI motion |
| Particle config | `.json` + textures | PixiJS particle systems |
| Alpha video iOS | HEVC with alpha | required for Safari/iOS path |
| Alpha video Android/Chrome | VP9/WebM with alpha | required for Chromium path |
| Sprite sheet | PNG atlas + metadata JSON | simple loops |
| Static poster | WebP/AVIF/PNG fallback | first paint/fallback |
| Audio sprite | compressed audio + sprite map | Howler |
| Preview thumbnail | WebP/AVIF/PNG | shop grid |

### 4.2 Forbidden Formats

| Format / Pattern | Status | Reason |
|---|---|---|
| GIF | forbidden | huge files, poor alpha/color, battery cost, banding |
| Long PNG sequences | forbidden | memory-heavy, network-heavy, bad battery |
| Uncompressed video | forbidden | excessive size |
| Autoplay audio | forbidden | UX/accessibility/store risk |
| Full-screen flashing loops | forbidden | safety/accessibility risk |
| Single-format alpha video only | forbidden | codec support fragmentation |

### 4.3 Alpha Video Dual-Format Requirement

Every alpha video cosmetic must include both:

```text
HEVC with alpha for iOS/Safari
VP9/WebM with alpha for Android/Chrome
```

Also required:

- static poster fallback.
- non-alpha fallback if alpha is unsupported.
- reduced-motion fallback.
- quality-tier variants if file is large.
- device testing in Safari/Chrome/WebView.

### 4.4 Texture Atlases

For particles and sprite sheets:

- pack small textures into atlases.
- minimize draw calls.
- use power-of-two sizes when helpful.
- avoid huge transparent padding.
- prefer shared texture atlases by theme.
- include metadata JSON.

Recommended atlas naming:

```text
cosmetic_<itemId>_<effectName>_atlas_v001.png
cosmetic_<itemId>_<effectName>_atlas_v001.json
```

### 4.5 Compression Guidelines

| Asset | Compression Guidance |
|---|---|
| `.riv` | optimize artboards, remove unused states/assets |
| Lottie | remove hidden layers, simplify masks, prefer `.lottie` |
| Particles | compress textures, reuse atlas, cap texture size |
| Alpha video | encode per platform; test alpha edges and banding |
| Static poster | WebP/AVIF primary + PNG fallback if needed |
| Audio | short compressed clips, audio sprite, avoid long uncompressed loops |

### 4.6 Naming and Versioning

Canonical pattern:

```text
cosmetics/{category}/{itemId}/{version}/...
```

Examples:

```text
cosmetics/avatar_border/dragon_flame/v001/dragon_frame.riv
cosmetics/global_background/dragon_sky/v001/background_ios_hevc.mov
cosmetics/global_background/dragon_sky/v001/background_android_vp9.webm
cosmetics/profile_banner/neon_storm/v002/poster.webp
cosmetics/sfx/equip_pack/v001/ui_sfx_sprite.webm
```

Rules:

- never overwrite published asset versions.
- add new `v002`, `v003` for changes.
- `shopItems` should reference immutable versioned URLs/paths.
- keep `poster` and fallback asset for every animated cosmetic.
- maintain a changelog for asset updates when visible behavior changes.

### 4.7 Asset Review Checklist

Before publishing a cosmetic:

- [ ] correct format for render type.
- [ ] static poster exists.
- [ ] fallback exists.
- [ ] mobile file size budget checked.
- [ ] animation loop seamless if looped.
- [ ] alpha edges tested.
- [ ] no dangerous flashing.
- [ ] reduced-motion version exists.
- [ ] sound optional/off by default.
- [ ] asset versioned.
- [ ] tested on low/mid/high device tier.
- [ ] does not hide UI or text.

---

## 5. Asset Delivery

### 5.1 Delivery Sources

Assets may be delivered through:

| Source | Use |
|---|---|
| Firebase Hosting | stable public assets, versioned builds |
| Firebase Storage | catalog cosmetics assets, CDN-backed delivery |
| CDN layer | future performance optimization |
| local bundle | only tiny critical UI animations |

Do not bundle heavy cosmetic assets into the main app bundle.

### 5.2 Loading Strategy

| Asset | Loading Strategy |
|---|---|
| equipped cosmetic | preload after user/session/profile load |
| shop grid thumbnails | lazy-load as visible |
| shop item preview | load on demand |
| heavy Rive/Pixi/video | load only on preview/equipped/visible |
| audio sprites | load after sound enabled or first user gesture |
| fallback poster | load immediately or before animation |

### 5.3 Preload Rules

Preload only:

- currently equipped avatar border.
- currently equipped profile banner.
- currently equipped global background.
- tiny UI micro animation needed for immediate feedback.

Do not preload:

- entire shop catalog.
- all Rive files.
- all video variants.
- all audio sprites.
- all particle textures.

### 5.4 Caching

Use immutable versioned asset URLs:

```text
Cache-Control: public, max-age=31536000, immutable
```

Only for versioned paths.  
For catalog metadata (`shopItems`) use normal Firestore cache/listener strategy.

### 5.5 Size Budgets — Draft

Final budgets are open, but initial guidance:

| Asset Type | Target | Hard Warning |
|---|---:|---:|
| Shop thumbnail | `< 80KB` | `> 150KB` |
| Static poster | `< 200KB` | `> 400KB` |
| Lottie micro-animation | `< 150KB` | `> 300KB` |
| Rive cosmetic | `< 500KB` | `> 1MB` |
| Particle texture atlas | `< 512KB` | `> 1MB` |
| Alpha video short loop | `< 2MB` | `> 5MB` |
| Audio sprite | `< 300KB` | `> 800KB` |

Heavy cosmetics above warning size require approval and fallback.

---

## 6. Performance Budgets

### 6.1 FPS Targets

| Device Tier | Target FPS | Minimum Acceptable |
|---|---:|---:|
| High | 60 FPS | 50 FPS |
| Mid | 60 FPS for UI, 30–60 for FX | 30 FPS |
| Low | 30 FPS or static fallback | no jank on core UI |

Core UI must remain responsive even if cosmetics are disabled.

### 6.2 Concurrent Animation Budget

| Context | Max Recommended Active Effects |
|---|---:|
| Profile screen | 1 heavy + 2 light |
| Discovery card | 1 medium + 1 light |
| Shop grid | thumbnails only; no heavy active animations |
| Shop preview | 1 heavy preview at a time |
| Chat | no heavy background effects by default |
| Global app shell | 1 subtle background only if high tier |

Heavy means:

- PixiJS scene.
- alpha video.
- complex Rive.
- multiple particle emitters.
- ambient sound loop.

### 6.3 Pause Rules

Animations must pause when:

- offscreen.
- tab hidden.
- route changes.
- modal covers the effect if not relevant.
- battery saver / low-power mode detected where possible.
- `prefers-reduced-motion` enabled.
- user disables animations.
- device tier is low and budget exceeded.

Use:

```text
IntersectionObserver
Page Visibility API
prefers-reduced-motion
runtime quality tier
feature flags
```

### 6.4 Memory / Battery Rules

- reuse WebGL contexts when possible.
- destroy Pixi applications on unmount.
- unload textures not needed.
- avoid multiple videos playing.
- prefer GPU decoding for video where supported.
- stop ambient loops when not visible.
- avoid full-screen bright static OLED-heavy elements.
- avoid permanent high-brightness borders.

### 6.5 Quality Tiers

Runtime should choose quality tier.

```text
low
mid
high
```

Draft behavior:

| Tier | Behavior |
|---|---|
| `low` | static poster, no Pixi, no alpha video, minimal Lottie |
| `mid` | Rive + limited Lottie, small particles, no heavy alpha video by default |
| `high` | full Rive/Pixi/video stack, still with visibility pause |

Quality tier inputs may include:

- device memory.
- hardware concurrency.
- WebGL support.
- measured FPS.
- user setting.
- battery saver if available.
- mobile browser/WebView detection.

### 6.6 Fallback Strategy

Every animated cosmetic must define:

```text
fallbackStaticUrl
fallbackReducedMotionUrl
fallbackLowTierUrl
```

If rendering fails:

- show poster/static fallback.
- log safe technical error.
- do not crash profile/shop.
- do not block core user action.
- never retry in tight loop.

### 6.7 Performance Test Scenarios

Must test:

- profile with equipped heavy cosmetic.
- discovery card with animated border.
- shop grid with 20+ items.
- shop preview with Rive/Pixi/video.
- route switching while effect active.
- background tab / return.
- low-end Android.
- iOS Safari.
- Capacitor WebView before store launch.

---

## 7. Accessibility & Safety

### 7.1 Reduced Motion

Respect:

```css
@media (prefers-reduced-motion: reduce) {
  /* disable or simplify motion */
}
```

Behavior:

| User Setting | Result |
|---|---|
| `prefers-reduced-motion: reduce` | disable heavy motion; use static/reduced assets |
| in-app motion off | disable non-essential animations |
| low device tier | fallback to static or simplified loop |

### 7.2 Flashing Safety

Forbidden:

- rapid flashing.
- high-contrast strobe.
- repeated full-screen white flashes.
- red/blue emergency-style flashing.
- motion that could trigger discomfort.

Guideline:

```text
No effect should flash more than 3 times per second.
```

Final flashing threshold requires accessibility review.

### 7.3 Visual Clarity

Effects must not:

- hide buttons.
- reduce text contrast.
- cover avatars/names in discovery.
- block chat input.
- make navigation unclear.
- create fake badges/trust signals.
- make `verifiedBadge` look like identity verification.

### 7.4 Sound Accessibility

Sound rules:

- sound off by default or only after explicit user gesture.
- global mute toggle.
- separate FX volume.
- no autoplay ambient loops.
- no sudden loud spikes.
- visual feedback must not rely on sound alone.
- save user preference.

Recommended settings:

```text
soundEnabled = false
sfxVolume = 0.5
ambientVolume = 0.2
```

### 7.5 User Controls

Settings should eventually include:

- motion on/off.
- sound on/off.
- FX volume.
- ambient volume.
- reduced effects mode.
- data saver mode.

---

## 8. Shop Item Schema Impact

### 8.1 Required `renderType`

Add or sync this enum to `DATA_MODEL.md`:

```ts
export type CosmeticRenderType =
  | "static_image"
  | "lottie"
  | "rive"
  | "particle"
  | "video"
  | "sprite";
```

### 8.2 `shopItems` Rendering Fields — Draft

Suggested fields:

```ts
type ShopItemRenderConfig = {
  renderType: CosmeticRenderType;
  assetVersion: string;

  thumbnailUrl: string;
  posterUrl: string;
  fallbackStaticUrl: string;

  lottie?: {
    jsonUrl?: string;
    dotLottieUrl?: string;
    loop: boolean;
    autoplay: boolean;
  };

  rive?: {
    rivUrl: string;
    artboard?: string;
    stateMachine?: string;
    inputs?: Record<string, string | number | boolean>;
  };

  particle?: {
    configUrl: string;
    textureAtlasUrl: string;
    textureAtlasMetaUrl?: string;
    maxParticles?: number;
  };

  video?: {
    hevcAlphaUrl: string;
    webmAlphaUrl: string;
    posterUrl: string;
    loop: boolean;
    muted: boolean;
  };

  sprite?: {
    atlasUrl: string;
    metaUrl: string;
    fps: number;
    loop: boolean;
  };

  sound?: {
    audioSpriteUrl: string;
    spriteMapUrl: string;
    equipSpriteKey?: string;
    ambientSpriteKey?: string;
    defaultVolume?: number;
  };

  performance?: {
    minTier: "low" | "mid" | "high";
    allowReducedMotion: boolean;
    maxConcurrent?: number;
  };
};
```

### 8.3 `ShopItemCategory` Mapping

Current cosmetic categories should map to rendering capabilities.

| `ShopItemCategory` | Recommended Render Types | Notes |
|---|---|---|
| `avatar_border` | `static_image`, `lottie`, `rive`, `sprite`, `particle` | Borders should stay lightweight in lists. |
| `profile_banner` | `static_image`, `video`, `rive`, `particle`, `sprite` | Banner can be more cinematic but must not hurt profile usability. |
| `global_background` | `static_image`, `video`, `particle`, `sprite` | Heavy backgrounds must have strict quality tiering. |

### 8.4 Catalog Examples

#### Static Border

```json
{
  "itemId": "border_neon_blue",
  "category": "avatar_border",
  "renderType": "static_image",
  "assetVersion": "v001",
  "thumbnailUrl": "cosmetics/avatar_border/border_neon_blue/v001/thumb.webp",
  "posterUrl": "cosmetics/avatar_border/border_neon_blue/v001/poster.webp",
  "fallbackStaticUrl": "cosmetics/avatar_border/border_neon_blue/v001/static.webp"
}
```

#### Rive Dragon Frame

```json
{
  "itemId": "border_dragon_flame",
  "category": "avatar_border",
  "renderType": "rive",
  "assetVersion": "v001",
  "thumbnailUrl": "cosmetics/avatar_border/border_dragon_flame/v001/thumb.webp",
  "posterUrl": "cosmetics/avatar_border/border_dragon_flame/v001/poster.webp",
  "fallbackStaticUrl": "cosmetics/avatar_border/border_dragon_flame/v001/static.webp",
  "rive": {
    "rivUrl": "cosmetics/avatar_border/border_dragon_flame/v001/dragon_frame.riv",
    "artboard": "AvatarBorder",
    "stateMachine": "BorderState"
  },
  "performance": {
    "minTier": "mid",
    "allowReducedMotion": true
  }
}
```

#### Alpha Video Background

```json
{
  "itemId": "bg_dragon_sky",
  "category": "global_background",
  "renderType": "video",
  "assetVersion": "v001",
  "thumbnailUrl": "cosmetics/global_background/bg_dragon_sky/v001/thumb.webp",
  "posterUrl": "cosmetics/global_background/bg_dragon_sky/v001/poster.webp",
  "fallbackStaticUrl": "cosmetics/global_background/bg_dragon_sky/v001/static.webp",
  "video": {
    "hevcAlphaUrl": "cosmetics/global_background/bg_dragon_sky/v001/dragon_sky_hevc.mov",
    "webmAlphaUrl": "cosmetics/global_background/bg_dragon_sky/v001/dragon_sky_vp9.webm",
    "posterUrl": "cosmetics/global_background/bg_dragon_sky/v001/poster.webp",
    "loop": true,
    "muted": true
  },
  "performance": {
    "minTier": "high",
    "allowReducedMotion": true
  }
}
```

### 8.5 Schema Rules

- `renderType` is required.
- `thumbnailUrl`, `posterUrl`, and `fallbackStaticUrl` are required for all animated cosmetics.
- `video` render type requires both HEVC and WebM alpha URLs.
- sound is optional.
- client treats catalog as curated/read-only.
- clients never upload cosmetics assets.
- `shopItems` write access remains server/admin-only.

---

## 9. Sound Design

### 9.1 Sound Categories

| Sound Type | Use | Default |
|---|---|---|
| Equip SFX | item equipped, cosmetic activated | allowed after user gesture if sound enabled |
| Purchase SFX | successful purchase | allowed after user gesture if sound enabled |
| UI SFX | taps, hover, modal open | subtle, optional |
| Ambient Loop | premium background atmosphere | off by default |
| Character SFX | dragon roar, magic pulse | preview/equip only, never spam |

### 9.2 Howler Audio Sprites

Use audio sprites to reduce requests.

Example sprite map:

```json
{
  "equip_dragon": [0, 900],
  "coin_burst": [1000, 700],
  "purchase_success": [1800, 850],
  "ambient_dragon_loop": [3000, 12000, true]
}
```

### 9.3 Volume Model

Recommended user settings:

```ts
type SoundSettings = {
  soundEnabled: boolean;
  sfxVolume: number;
  ambientVolume: number;
  muteAll: boolean;
};
```

Defaults:

```json
{
  "soundEnabled": false,
  "sfxVolume": 0.5,
  "ambientVolume": 0.2,
  "muteAll": true
}
```

### 9.4 Sound Rules

- no sound before user gesture.
- no sound if global mute is enabled.
- no looping ambient by default.
- stop sound on route change unless explicitly ambient and user enabled.
- pause ambient when tab hidden.
- do not play more than one ambient loop at a time.
- do not use sound to communicate critical state without visual feedback.

### 9.5 Sound Asset Pipeline

Naming:

```text
cosmetics/sfx/{packId}/{version}/sprite.webm
cosmetics/sfx/{packId}/{version}/sprite.mp3
cosmetics/sfx/{packId}/{version}/sprite-map.json
```

Use at least two formats if needed for browser compatibility.

---

## 10. Curation

### 10.1 Cosmetics Are Curated Catalog

Cosmetics are curated/catalog assets, not user-uploaded UGC.

This means:

- users can buy/equip cosmetics.
- users cannot upload arbitrary cosmetic animation files.
- `shopItems` are managed by admin/server process.
- assets are reviewed before publishing.
- catalog writes are forbidden to normal users.

### 10.2 Trust & Safety Boundary

User-uploaded content may include:

- profile image.
- banner if user-uploaded in future.
- bio.
- chat media.

Cosmetic catalog content is internal curated content and should go through internal art/QA review, not user moderation flow.

### 10.3 Catalog Governance

Before a cosmetic enters production catalog:

- art approved.
- performance approved.
- accessibility approved.
- no misleading trust/safety symbols.
- no fake identity verification imagery.
- no copyrighted/third-party IP unless licensed.
- no flashing hazard.
- no offensive content.
- fallback assets included.
- schema valid.

---

## 11. Implementation Guidelines

### 11.1 Component Architecture

Recommended components:

```text
CosmeticRenderer
  ├── StaticCosmeticRenderer
  ├── LottieCosmeticRenderer
  ├── RiveCosmeticRenderer
  ├── ParticleCosmeticRenderer
  ├── VideoCosmeticRenderer
  ├── SpriteCosmeticRenderer
  └── CosmeticSoundController
```

### 11.2 Renderer Contract

```ts
type CosmeticRendererProps = {
  itemId: string;
  category: ShopItemCategory;
  renderConfig: ShopItemRenderConfig;
  context: "profile" | "discovery_card" | "shop_grid" | "shop_preview" | "chat" | "global";
  qualityTier: "low" | "mid" | "high";
  reducedMotion: boolean;
  isVisible: boolean;
  soundEnabled: boolean;
};
```

### 11.3 Rendering Decision

```text
if reducedMotion:
  show fallbackReducedMotionUrl || fallbackStaticUrl
else if qualityTier < renderConfig.performance.minTier:
  show fallbackStaticUrl
else if !isVisible:
  pause and show poster/frozen state
else:
  load renderer by renderType
```

### 11.4 Lazy Imports

Heavy libraries should be lazy-imported:

```ts
const RiveRenderer = lazy(() => import("./RiveCosmeticRenderer"));
const ParticleRenderer = lazy(() => import("./ParticleCosmeticRenderer"));
const LottieRenderer = lazy(() => import("./LottieCosmeticRenderer"));
```

Do not put all heavy rendering runtimes in the first app shell bundle.

### 11.5 Error Handling

If renderer fails:

- fallback to static image.
- log safe error metadata.
- never expose technical error to user.
- never crash profile/discovery/shop.
- mark asset as failed in local session to avoid retry loop.

---

## 12. QA Checklist

### 12.1 Functional QA

- [ ] static cosmetic renders.
- [ ] Lottie cosmetic renders.
- [ ] Rive cosmetic renders.
- [ ] Pixi/particle cosmetic renders.
- [ ] video cosmetic chooses correct format.
- [ ] sprite cosmetic loops correctly.
- [ ] fallback works if asset missing.
- [ ] shop preview works.
- [ ] equipped item renders on profile.
- [ ] global background does not hide UI.

### 12.2 Performance QA

- [ ] low-tier fallback works.
- [ ] mid-tier limited animation works.
- [ ] high-tier full animation works.
- [ ] offscreen animations pause.
- [ ] tab hidden pauses.
- [ ] route change cleans up.
- [ ] memory does not grow after repeated previews.
- [ ] FPS budget passes on target devices.
- [ ] battery impact is acceptable.

### 12.3 Accessibility QA

- [ ] `prefers-reduced-motion` disables heavy motion.
- [ ] in-app motion toggle works if implemented.
- [ ] no dangerous flashing.
- [ ] sound starts muted/off.
- [ ] sound toggle works.
- [ ] animation does not reduce text contrast.
- [ ] keyboard/focus unaffected.

### 12.4 Store/Future QA

Before Capacitor/store launch:

- [ ] test in iOS WebView.
- [ ] test in Android WebView.
- [ ] test HEVC alpha on iOS.
- [ ] test WebM alpha on Android.
- [ ] test audio restrictions.
- [ ] test native memory and thermal behavior.
- [ ] verify no store policy issue from audio/autoplay/flashing.

---

## 13. Open Items

| Item | Status | Impact |
|---|---|---|
| Final quality-tier thresholds | Open | Need exact device classification logic. |
| Final asset size caps | Open | Draft budgets exist; production limits need approval. |
| Final animation concurrency budget | Open | Needs real device profiling. |
| Rive runtime package choice | Open | Affects bundle and WASM loading. |
| Lottie runtime choice | Open | `.json` vs `.lottie` support decision. |
| PixiJS particle framework | Open | Need library/config standard. |
| Alpha video encoder settings | Open | Need HEVC/WebM encoding presets. |
| CDN strategy | Open | Firebase Storage/Hosting now; CDN layer future. |
| Sound default policy | Draft | Current rule: off by default; product approval needed. |
| In-app motion/sound settings UI | Open | Needed for full accessibility/user control. |
| Reduced-motion asset requirements | Open | Need exact rule per category. |
| WebView performance baseline | Future | Required before Capacitor store launch. |
| DATA_MODEL sync | Required | Add `renderType` and render config fields to `shopItems`. |
| Asset review ownership | Open | Define who approves art/performance/accessibility. |
| Licensed IP policy | Open | Need legal/art approval process for themed cosmetics. |
