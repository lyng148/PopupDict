# PopupDict - Japanese to Vietnamese Dictionary Extension

A Chrome extension based on the Soft Brutalism style for Japanese-Vietnamese word lookup and translation.

## Features
- **Japanese Selection Popup**: Automatically detects Japanese text selection and shows a popup.
- **Dictionary Lookup**: Fetches definitions from `jpdictionary.com`.
- **Kanji Mode**: Look up Kanji details.
- **Translation**: Uses Google Translate for sentence translation.
- **Text-to-Speech**: Listen to the pronunciation of selected text.
- **Soft Brutalism UI**: A bold, high-contrast design.

## Installation
1. Download or clone this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top right.
4. Click "Load unpacked" and select the folder containing this extension.

## Files
- `manifest.json`: Extension configuration.
- `content.js`: Main logic for text selection and UI rendering.
- `content.css`: Styles for the popup.
- `background.js`: Service worker for handling cross-origin API requests.
