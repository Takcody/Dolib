# Changelog

## [1.1.1]

### Patch Notes: Lock Screen Resolution & Device Scaling

- **Responsive Screen Scaling**:
  - Upgraded the lock screen layout from a fixed 320px (`max-w-xs`) / 600px height frame to an adaptive breakpoint layout (`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg` up to `900px` max height).
  - Resolved small lockscreen rendering on high-resolution and large-screen phones (e.g., Pixel 9 Pro XL) as well as tablets (e.g., Pixel Tablet, iPads).
  - Keypad buttons now scale dynamically from 56px (`h-14`) on compact phones to 64px (`sm:h-16`) on large phones, and 80–88px (`md:h-20` / `lg:h-22`) on tablets.
  - Scaled passcode indicator dots, typography, logo dimensions, and action buttons proportionally across all screen densities.

- **Safe Area Insets & Cutout Protection**:
  - Implemented dynamic top inset calculation (`max(1.5rem, calc(var(--safe-area-inset-top) + 1rem))`) to guarantee clearance for status bars and camera punch-hole notches (e.g. Pixel 9 Pro XL camera cutout).
  - Implemented dynamic bottom inset calculation (`max(1.5rem, calc(var(--safe-area-inset-bottom) + 1rem))`) to prevent bottom navigation bars or gesture pills from obscuring UI buttons.

- **Portrait Mode Enforcement**:
  - Configured `android:screenOrientation="portrait"` on `MainActivity` in `AndroidManifest.xml` to lock native Android windows in portrait orientation on both phones and tablets.
  - Preserved `OrientationGuard` for Web/PWA environments to detect orientation changes and guide users back to portrait mode.
