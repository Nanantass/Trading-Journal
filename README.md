# Rothschilds Desktop

> A focused trading journal for recording, reviewing, and improving crypto perpetuals trading performance.

Rothschilds Desktop is a React + Vite trading journal designed to help traders document positions, review performance, and turn trade screenshots into structured records. It includes a dashboard for performance review, a searchable trade log, automatic risk/reward and PnL-percentage calculations, and an optional AI-assisted screenshot parser.

**Important:** This project is a journaling and analysis tool. It does not place orders or guarantee trading outcomes. Treat calculated values as estimates and verify them against your exchange history.

---

## Contents

- [Highlights](#highlights)
- [Tech stack](#tech-stack)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [AI screenshot parsing](#ai-screenshot-parsing)
- [Using the app](#using-the-app)
- [Data storage and backups](#data-storage-and-backups)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [Troubleshooting](#troubleshooting)
- [Security notes](#security-notes)
- [Limitations](#limitations)
- [Disclaimer](#disclaimer)

## Highlights

### Performance dashboard
- Review recorded trades and performance summaries.
- Visualize the trade equity curve and performance dimensions.
- Use dashboard statistics as a review aid, not as a prediction of future results.

### Trade journal
- Record trade details such as pair, direction, entry, exit, position size, leverage, stop-loss, take-profit, liquidation price, fees, duration, strategy, tags, and notes.
- Search, review, edit, and remove recorded trades.
- Track trade status and distinguish LONG from SHORT positions.
- Add strategy labels to help organize and compare approaches.

### Calculation helpers
- Calculate risk/reward (RR) from entry, take-profit, stop-loss, and direction when sufficient valid inputs are provided.
- Estimate PnL percentage from entry, exit, leverage, and direction.
- Estimate PnL in USDT when a margin/collateral amount is supplied.
- Recheck all results against the exchange's realized PnL, fees, and funding records.

### AI-assisted screenshot parsing
- Upload a trade screenshot to extract visible fields into a draft trade.
- Review and correct the extracted values before saving them.
- Parsing requires a working Anthropic API connection configured through the development proxy.

### Profile and export
- Store a display name and journal settings in the browser.
- Export journal data as a JSON file for backup or migration.

## Tech stack

- **React 18**
- **Vite 5**
- **Recharts** for charts
- **Lucide React** for icons
- **Anthropic Messages API** for optional screenshot parsing
- **Browser `localStorage`** for local persistence

## Requirements

- Node.js (an active LTS release is recommended)
- npm
- A modern browser
- An Anthropic API key only if you want to use AI screenshot parsing

Check your installation:

```bash
node -v
npm -v
```

## Getting started

### 1. Download the project

Clone the repository or download the ZIP, then open a terminal in the project directory—the directory containing `package.json`.

```bash
git clone <YOUR_REPOSITORY_URL>
cd <PROJECT_DIRECTORY>
```

If you downloaded a ZIP, extract it and `cd` into the extracted project folder instead.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the optional AI feature

Copy `.env.example` to `.env` and set your Anthropic API key if you intend to use screenshot parsing.

Example `.env`:

```dotenv
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
```

Do not commit `.env` or share your API key. See [Security notes](#security-notes) before enabling the AI feature.

### 4. Start the development server

```bash
npm run dev
```

The current Vite configuration uses port **5174**. Open the local URL printed in the terminal, usually:

```text
http://localhost:5174
```

Keep the terminal running while using the development server. Stop it with `Ctrl+C`.

### 5. Create a production build

```bash
npm run build
```

Vite writes the production build to `dist/`.

To preview that build locally:

```bash
npm run preview
```

Use the URL printed by Vite to open the preview.

## AI screenshot parsing

The screenshot parser sends the selected image to the app's `/api/v1/messages` endpoint. In development, `vite.config.js` proxies `/api` requests to Anthropic.

1. Add your API key to the local `.env` file.
2. Restart the Vite development server after changing environment variables.
3. Open the Add Trade page and upload a supported trade screenshot.
4. Review every parsed field—especially pair, direction, entry/exit, size, leverage, PnL, fees, SL, and TP.
5. Correct mistakes before saving the trade.

AI extraction can misread small text, decimal places, dates, direction, or PnL signs. Never assume parsed values are correct without checking the source screenshot or exchange history.

**Deployment note:** The proxy in the included Vite configuration is a development-server proxy. Do not deploy a production app that exposes an API key in browser code or relies on the Vite development proxy. For production, route Anthropic requests through a secure backend that stores the key server-side and applies authentication, rate limits, and usage controls.

## Using the app

A practical workflow:

1. Review the dashboard to understand your recorded history.
2. Add a trade manually or start with AI screenshot parsing.
3. Verify all extracted or entered values.
4. Save the trade and add notes, tags, and a strategy label.
5. Review the Trade Log to search, edit, or remove records.
6. Export your journal regularly and compare recorded PnL with your exchange statement.

For consistent performance statistics, define a single convention for position size, margin/collateral, realized PnL, fees, and funding, then use it consistently for every trade.

## Data storage and backups

Trade records, profile information, capital, and strategies are stored in the browser's `localStorage` for the current browser origin.

- Data is not automatically synchronized between browsers or computers.
- Clearing browser site data can remove locally stored records.
- Export JSON backups regularly and store them somewhere safe.
- Before replacing the project or changing browsers, export your data first.
- The project initializes with demonstration trades when no saved trade data exists. Confirm whether records are demo data before using dashboard statistics as your own performance history.

## Project structure

```text
rothschilds-desktop/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── .env.example
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── components/
    │   └── Sidebar.jsx
    ├── contexts/
    │   └── AppContext.jsx
    ├── pages/
    │   ├── Dashboard.jsx
    │   ├── TradeLog.jsx
    │   ├── AddTrade.jsx
    │   └── Profile.jsx
    └── utils/
        ├── aiParser.js
        └── tradeCalc.js
```

## Scripts

| Command | Purpose |
|---|---|
| `npm install` | Install project dependencies |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the production assets |
| `npm run preview` | Preview the production build locally |

## Troubleshooting

### `node` or `npm` is not recognized
Install Node.js, close and reopen the terminal, and rerun `node -v` and `npm -v`.

### The app does not start
- Confirm you are in the directory containing `package.json`.
- Run `npm install`.
- Read the full error printed by `npm run dev`.
- Check whether port `5174` is already in use.

### AI parsing fails
- Confirm the API key is set in `.env`.
- Restart the development server after editing `.env`.
- Check API access, billing/usage limits, and the terminal's error output.
- Ensure the request is being made through the configured development server.
- Do not paste your API key into public issues, screenshots, or chat messages.

### My trades disappeared
The app uses browser-local storage. Check that you are using the same browser and origin, and restore from a JSON backup if needed. Avoid clearing site data until you have exported any records you want to keep.

## Security notes

- Keep `.env` out of version control. Review `.gitignore` before pushing changes.
- If a key has been committed to a public repository, revoke or rotate it immediately; deleting it in a later commit does not remove it from Git history.
- The included `VITE_ANTHROPIC_API_KEY` variable is read by the Vite development configuration. Vite environment variables prefixed with `VITE_` are generally exposed to client-side code when imported into the frontend. Never put secrets in frontend code or ship them to browsers.
- For public or production deployment, implement a server-side API proxy and protect it with appropriate access controls.
- Do not store exchange API keys, seed phrases, passwords, or other high-risk credentials in the journal.

## Limitations

- The app is a journal, not an exchange execution engine.
- AI screenshot parsing is probabilistic and may produce incorrect or incomplete values.
- PnL estimates may not include all exchange fees, funding, slippage, partial fills, or exchange-specific contract rules.
- Browser-local data is not a cloud backup and is not automatically synchronized.
- Dashboard metrics are only as reliable as the trade data entered or parsed.

## Disclaimer

Rothschilds Desktop is provided for personal tracking, educational, and analytical purposes. It is not financial advice, does not guarantee performance, and should not be used as the sole basis for a trading decision. Verify trade records and calculations independently against your exchange.
