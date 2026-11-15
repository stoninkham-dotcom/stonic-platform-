
# STONIC Platform

STONIC is a mobile-friendly AI website-building platform.

## Current Modules

- Website Builder
- Gemini AI website generation
- AI prompt-based website editing
- Website preview
- Local project saving
- Version history
- HTML export
- ZIP export
- Offline dashboard caching

## Setup

1. Open the STONIC website.
2. Enter your Gemini API key.
3. Connect Gemini AI.
4. Add your business details.
5. Describe the website you want.
6. Generate and preview your website.
7. Save your project.
8. Export the HTML or ZIP when ready.

## Storage

Projects and the Gemini API key are stored in the browser's local storage on the device.

Clearing browser data may delete locally saved projects.

## Offline Support

The service worker caches the main dashboard files.

Offline access does not provide Gemini AI generation or online publishing.

## Publishing Status

Public client website publishing is not connected yet.

The Publish button does not deploy a website.

A secure publishing integration is still required.

## Important Security Note

The Gemini API key is used by the browser to contact Google's API.

Do not share your API key or publish it in a public repository.

A production multi-user platform should use a secure server-side API connection.

## Current Limitations

- No visual drag-and-drop editor yet.
- No secure public publishing integration yet.
- Projects are stored locally on the current device and browser.
- ZIP export currently contains the generated HTML and optional README only.
- Generated websites may reference external assets that are not included in the ZIP.

## Project

STONIC Platform
