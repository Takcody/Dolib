<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/374c1d17-7af9-4b7c-aada-76235fff12cb

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Version 1.1.1 Patch Notes
- **Lock Screen UI Scaling**: Updated lockscreen layout to scale adaptively across all device screen sizes (Pixel 3 Pro XL, Pixel 9 Pro XL, and tablets). Keypad buttons, typography, and passcode dots scale dynamically.
- **System Inset Protection**: Allocated dynamic safe area padding for notification bars, camera notches (Pixel 9 Pro XL punch hole), and bottom navigation bars.
- **Portrait Orientation**: Locked Android native activity to portrait mode across all devices.
