# ICML 2026 Supplementary Material Skeleton

This is a lightweight, static website skeleton for anonymous media submissions. It requires no build tools, no external dependencies, and is designed to run completely offline or on a simple static server.

## Features

*   **No Build Step**: Pure HTML, CSS, and vanilla JavaScript.
*   **Anonymous**: No external fonts (Google Fonts), analytics, or tracking scripts.
*   **Responsive**: Clean, minimal, "Vercel-like" aesthetic that works on mobile and desktop.
*   **Data-Driven**: Content is managed via `data/videos.json`, making it easy to update without touching HTML.

## Quick Start

1.  **Add Videos**: Place your video files (MP4/WebM) in the `samples/` directory. Subdirectories are supported and will be used as section headers.
2.  **Generate Data**: Run the generator script to automatically update `data/videos.json`:
    ```bash
    node scripts/generate_videos_json.mjs
    ```
3.  **Preview Locally**:
    Run a simple Python server (included in most macOS/Linux systems):

    ```bash
    python3 -m http.server 8000
    ```

    Then open `http://localhost:8000` in your browser.

## Customization

*   **Content**: Organize files in `samples/` to define sections. Run `scripts/generate_videos_json.mjs` to update.
*   **Descriptions**: The generator uses filenames as titles. You can manually tweak `data/videos.json` for custom descriptions if needed.
*   **Styling**: Edit `styles.css`. The design uses CSS variables (top of file) for easy color/font updates.
*   **Structure**: Edit `index.html` if you need to add global headers or footers.

## Anonymity Checklist (Crucial for Review)

*   [ ] **No Authors**: Ensure no author names appear in HTML, title tags, or file names.
*   [ ] **No Affiliations**: Do not include university/company logos or names.
*   [ ] **No External Requests**: This template is designed to be self-contained. Do not add CDNs (like jQuery, Bootstrap, Google Fonts) as these can leak IP addresses or reveal identity.
*   [ ] **Metadata**: Scrub metadata from your video and image files before uploading.

## Directory Structure

```
.
├── index.html          # Main entry point
├── styles.css          # Styling (CSS Variables)
├── main.js             # Logic (renders JSON to DOM)
├── scripts/
│   └── generate_videos_json.mjs # Script to generate JSON from samples
├── data/
│   └── videos.json     # Generated content database
└── samples/            # Store your media files here (supports subdirectories)
```
