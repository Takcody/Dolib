# Dolib v1.2.0 Release Notes

We're excited to announce version 1.2.0 of Dolib! This update focuses on enhancing the user experience with new organizational tools, refined security options, and UI improvements specifically tailored for larger devices.

## What's New & Improved:

*   **Circle & Anthology Support:** The "Add Book" menu has been expanded to support two brand new fields! You can now input the **Circle** (for doujinshi groups) and easily mark a book as an **Anthology** using the new checkbox.
*   **Expanded Sorting Options:** You can now sort your library by **Circle**, **Author**, and **Parody / Category**, making it much easier to organize and browse large collections.
*   **Anthology Filter:** The sorting menu now features an "Anthology" filter that exclusively displays books marked as anthologies, sorted by the date they were added!
*   **Customizable Auto-Lock Timer:** A highly requested feature! You can now customize exactly when Dolib locks itself. Choose between *Never*, *Immediately upon minimize*, or set a specific idle duration (1, 2, 5, 10, or 30 minutes). You can find this under *Settings > Security*.
*   **Lockscreen Optimization for Large Screens:** We've resolved an issue where the lockscreen would only cover 50% of the display on taller devices (like the Pixel 9 Pro XL). The UI now intelligently adapts to fill the entire screen space.
*   **Improved Fingerprint Button:** The 'Use Fingerprint' button on the lockscreen has been enlarged for easier access. We've also increased the spacing between the fingerprint button and the Privacy Terms link to prevent accidental taps.
*   **Settings Menu Reorganization:** The *Security* section in the Settings menu has been logically repositioned between *Appearance* and *About* for a more intuitive flow.
*   **Full Translation Support:** All new features, including the auto-lock options, the new Circle and Anthology fields, and the privacy policy modal, have been fully translated into all 10 supported languages!

## Bug Fixes

*   Fixed a critical race condition that caused the app to fail to unlock (or immediately re-lock) when using Fingerprint authentication alongside the "Immediate" Auto-Lock setting.

## Technical Details

*   **Version Code:** 5
*   **DEX Optimization:** Confirmed. R8 shrinking and obfuscation (`minifyEnabled true`) remain active for production releases to ensure maximum performance and minimal app size.
