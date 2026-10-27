# Shuttio for Twenty

Adds an **Import with Shuttio** page to the left menu of your Twenty workspace. From that page you move your HubSpot data into Twenty: link a Shuttio account, connect HubSpot, review the field mapping, check a free sample, pay, and run the full migration. The command **Import data with Shuttio** (Cmd+K) opens the same page.

HubSpot is the first source on this page. Pipedrive, Affinity, Attio, another Twenty workspace and CSV files still go through https://www.shuttio.com with Twenty as the destination.

## Setup

**App owner, once per Twenty server.** In Twenty, open Settings → Developers → Shuttio → Config and fill in `HUBSPOT_CLIENT_ID` and `HUBSPOT_CLIENT_SECRET`: the client ID and secret of the Shuttio HubSpot app. The HubSpot app must list `https://api.twenty.com/auth/apps/callback` (Twenty Cloud) as a redirect URL.

**Workspace admin, once per workspace.**

1. Install Shuttio from Settings → Apps.
2. Open Settings → Apps → Shuttio and click **Add connection** in the HubSpot section. A HubSpot super admin approves read access.
3. Open **Import with Shuttio** in the left menu and follow the six steps.

Step 1 opens Shuttio in a new tab: you sign in to Shuttio and connect this workspace there with Twenty's OAuth. Use an admin account: Shuttio adds custom fields, options and objects.

## What moves into Twenty

- Companies, contacts and deals go into Twenty's companies, people and opportunities. Other HubSpot objects (tickets, products, custom objects) become custom objects with their fields, options and links.
- You choose where each HubSpot field lands: an existing Twenty field, a new field, or nowhere.
- Links between records: a deal stays linked to its company and contact.
- Notes and tasks land on the records they belong to. Calls and meetings arrive as notes titled "Call" or "Meeting".
- People are matched by email and companies by domain. A matched record is linked to and never changed or removed.

Not moved: emails (Twenty takes in mail only through its own mailbox sync), HubSpot lists (Twenty has views, not static lists), and a deal's contacts beyond the first (an opportunity has one point of contact).

## Sample first, then everything

The sample is free: 5% of each object, 10 to 1,000 records, picked at random, with linked records. You check it in Twenty, then pay and run the rest. Records the sample created are matched, not duplicated. **Roll back** removes the records, notes, tasks and links the migration created, then the fields and empty objects it added.

## Price

The sample is free. The full migration is paid once, by the number of records counted in HubSpot:

| Records | Price |
|---|---|
| up to 50,000 | $249 |
| up to 100,000 | $499 |
| up to 200,000 | $749 |
| up to 500,000 | $999 |
| up to 1,000,000 | $1,499 |
| up to 5,000,000 | $4,749 |
| over 5,000,000 | email help@shuttio.com |

Payment runs through Stripe Checkout in a new tab. Current prices: https://www.shuttio.com/pricing

## Privacy

**What leaves the workspace, and where it goes.** Everything goes to Shuttio at https://www.shuttio.com. Processing runs on Vercel in the United States; the subprocessor list is at https://www.shuttio.com/security.

- Each request from the page carries the signed-in member's short-lived Twenty token (30 minutes) and the workspace's API address. Shuttio uses them to check which workspace and member is asking.
- When Shuttio reads HubSpot, it asks the app for the workspace's HubSpot access token. Twenty keeps and refreshes the HubSpot connection; Shuttio stores no HubSpot token.
- HubSpot records pass through Shuttio on their way into Twenty. Shuttio writes them with its own Twenty OAuth connection, which you grant in step 1.

**What Shuttio keeps, and for how long.** Shuttio does not keep your records. It keeps the structure, the field mapping and a map of HubSpot ids to Twenty ids, which makes a re-run safe and a rollback complete. A value that failed to import is kept in the error report and cleared 14 days after the migration finishes. Shuttio's Twenty OAuth token is encrypted at rest and deleted 14 days after the migration finishes.

**How to delete.** Uninstalling the app deletes the HubSpot connection from Twenty. To delete your Shuttio account and everything it holds, email help@shuttio.com.

**What the app can read in Twenty.** Nothing. Its role has no object permissions; Shuttio writes through its own OAuth connection.

## Supported Twenty versions

Twenty Cloud, server version 2.51.0 or later (`engines.twenty` in `package.json`).

Self-hosted Twenty 2.51.0 or later should work but is not tested. Its server admin enters the client ID and secret of a HubSpot app that lists `https://<your-twenty-server>/auth/apps/callback` as a redirect URL, and Shuttio must reach the server over HTTPS.

## Security note for workspace admins

Shuttio fetches the HubSpot token from the app's route `/shuttio/source-token`. Twenty authenticates every caller of that route but does not tell the app which OAuth client issued the caller's token, so the app also requires a secret it generated, kept in its own key-value store and sent only to Shuttio. A member or API key of this workspace without that secret gets a 403.

Help: help@shuttio.com. Terms: https://www.shuttio.com/terms

Development and publishing: [SETUP.md](https://github.com/gmaramigin/shuttio-twenty-app/blob/main/SETUP.md).
