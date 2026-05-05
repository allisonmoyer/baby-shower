# Baby Shower Website

A small static site for QR-code guest notes:

- `index.html` is the landing page / QR hub.
- `traditions.html` collects favorite family traditions.
- `advice.html` collects advice and well wishes.
- `dashboard.html` shows local preview submissions and links to your Google Sheet.
- `.nojekyll` keeps GitHub Pages from trying to process the site with Jekyll.

## Why this setup

For your use case, a static site plus Google Sheets is the right shape:

- Guests get fast mobile pages with no login.
- You and Melissa get a familiar private spreadsheet for the results.
- Hosting stays simple because the site has no required backend server.

## Local preview

This repo is configured for Google Sheets, but it safely falls back to local preview until you add the Apps Script URL.

1. Start a static server from this folder.
2. Open `index.html`, `traditions.html`, `advice.html`, or `dashboard.html`.
3. Submit a few test entries.
4. Review them on `dashboard.html`.

Before Sheets is connected, submissions are stored only in the current browser with `localStorage`.

## Connect to Google Sheets

1. Create a new Google Sheet.
2. Open `Extensions -> Apps Script`.
3. Paste in [`google-apps-script/Code.gs`](./google-apps-script/Code.gs).
4. Make sure the Apps Script project is bound to the spreadsheet you want to use.
5. Deploy the script as a web app:
   - Execute as: `Me`
   - Who has access: `Anyone`
6. Copy the deployed web app URL.
7. Update [`config.js`](./config.js):

```js
window.BABY_SHOWER_CONFIG = {
  eventTitle: "Allie + Mel's Baby Shower",
  parents: {
    allie: "Allie",
    mel: "Melissa"
  },
  submission: {
    mode: "google-apps-script",
    endpoint: "PASTE_YOUR_WEB_APP_URL_HERE",
    sheetLinks: {
      combined: "OPTIONAL_MAIN_SHEET_LINK",
      allie: "",
      mel: "",
      both: "",
      traditions: "",
      advice: ""
    }
  }
};
```

Once that is set, guest submissions post directly to the hidden Apps Script endpoint and your spreadsheet will auto-create these tabs if they do not already exist:

- `All Submissions`
- `Allie View`
- `Melissa View`
- `Send to Both`
- `Traditions`
- `Advice`

Recommended reading model:

- `All Submissions` is the master log.
- `Allie View` contains notes addressed to Allie plus notes sent to both.
- `Melissa View` contains notes addressed to Melissa plus notes sent to both.
- `Send to Both` contains only notes explicitly addressed to both.
- `Traditions` and `Advice` let you skim by prompt type.

## Set up GitHub Pages

1. Put this folder in a GitHub repository.
2. Push the files to your default branch, usually `main`.
3. In GitHub, open `Settings -> Pages`.
4. Under `Build and deployment`, choose:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main`
   - `Folder`: `/ (root)`
5. Save and wait for the Pages URL to appear.

Because all page links in this site are relative and the repo includes [`.nojekyll`](./.nojekyll), it is already shaped correctly for a repo-based GitHub Pages URL.

Your live links will look like this:

- `https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY_NAME/`
- `https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY_NAME/traditions.html`
- `https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY_NAME/advice.html`

## Recommended QR codes

Point your QR codes straight at the live page URLs:

- `https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY_NAME/traditions.html`
- `https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY_NAME/advice.html`

That is better than sending guests to the homepage and asking them to choose.

## Files to customize

- [`config.js`](./config.js): names, endpoint, and sheet links
- [`styles.css`](./styles.css): colors and layout
- [`index.html`](./index.html): homepage copy
- [`traditions.html`](./traditions.html): tradition prompts
- [`advice.html`](./advice.html): advice prompts
- [`google-apps-script/Code.gs`](./google-apps-script/Code.gs): Apps Script receiver logic
