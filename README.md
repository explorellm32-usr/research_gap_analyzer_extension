# Research Gap Analyzer - Chrome Extension

This Chrome Extension reads the abstract and introduction of an academic research paper on the current webpage, actively identifies logical or methodological gaps, and generates novel, mathematically-backed problem statements for future research.

## Features
- Scrapes academic text directly from the active tab.
- Evaluates the core methodology and limitations.
- Uses strict prompt-engineering constraints to output structured JSON data containing logical gaps and newly proposed hypotheses.
- Sleek "Glassmorphism" UI design.



## Test Output
*Note: Include a screenshot or raw JSON output from testing here before submitting.*

## Installation (Developer Mode)
1. Download or clone this repository.
2. Open Chrome and navigate to \`chrome://extensions/\`.
3. Toggle "Developer mode" ON in the top right corner.
4. Click "Load unpacked" and select this project directory.
5. Click the extension icon, open "Settings" (⚙️), and add your OpenAI API Key.
6. Navigate to an arXiv paper and click "Analyze Paper"!
