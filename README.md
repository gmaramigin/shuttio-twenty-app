# Shuttio for Twenty

Adds one command to Twenty: **Import data with Shuttio**. Press Cmd+K in Twenty and run it. Shuttio (https://www.shuttio.com) opens in a new tab with Twenty chosen as the destination, and moves your HubSpot, Pipedrive, Affinity, Attio, Twenty or CSV data into the workspace.

The app reads and writes no workspace data. Its role has no object permissions.

**Install:** in Twenty, open Settings, then Apps, find Shuttio in the marketplace and install it.

## About Shuttio

Shuttio copies your CRM data into Twenty. You pick the source and review the field mapping, then Shuttio runs a sample so you can check the result in Twenty before anything else moves.

## What moves into Twenty

Sources: HubSpot, Pipedrive, Affinity, Attio, another Twenty workspace (self-hosted or Cloud) and CSV files.

- Companies, people and opportunities go into Twenty's own objects. Every other record object in the source (tickets, products, custom objects) becomes a custom object in Twenty with its fields, select options and links.
- Fields: you review every source field and choose where it lands. Fields Twenty does not have yet are created for you (text, number, date, select, currency, email, phone, link, address, rating, relation).
- Links between records: a deal stays linked to its company and contact.
- Notes and tasks land on the records they belong to, with the source's body and dates where Twenty accepts them.
- Calls and meetings arrive as notes titled "Call" or "Meeting", with time, length and attendees in the text.
- Pipelines: deal stages go into Twenty's stage field. A source with several pipelines gets options named "Pipeline · Stage".
- Files: attachments land on their person, company or opportunity, in the full migration (the sample skips them). A source profile photo becomes the person's photo.

## From another Twenty workspace

Move a self-hosted Twenty into Cloud, or merge one workspace into another. Standard fields land on standard fields, custom objects and fields keep their names, and notes and tasks stay on their records, custom-object records included. After the records, Shuttio copies views (columns, filters, sorts, board columns), dashboards and workflows. Workflows arrive as drafts and stay off until you turn them on. Copying workflows needs the OAuth connection; with an API key they are skipped and the run says so. Shuttio refuses to use the same workspace as both source and destination.

## What does not move

- Emails. Twenty has no way to take in a message outside its own mailbox sync.
- Lists. Twenty has views, not static lists.
- From another Twenty workspace: calendar events (they come from Twenty's own sync), records in the trash, workflows with code, email or AI steps, and Twenty's built-in "All" views.
- A deal's contacts beyond the first. An opportunity in Twenty has one point of contact; the others are counted in the run's warnings.
- A won or lost deal keeps its stage. Twenty has no separate outcome.
- A rating outside 1 to 5, or a value a field cannot hold, is left out and listed in the Errors tab with its reason.

## Sample first, then everything

A migration starts with a free sample: 5% of each root object, 10 to 1,000 records, picked at random, with linked records. You check it in Twenty. "Run full migration" then moves the rest. Records already in Twenty are matched, not duplicated: people by email, companies by domain. A matched record is linked to and never changed or removed by Shuttio.

Every record gets a result. A failed record shows its reason and a suggested fix, and the report downloads as a CSV. Retry re-runs only the failed records. Rollback removes the records, notes, tasks and links the migration created, and then the custom fields and empty custom objects it added.

## Price

The sample is free. A CSV import is free at any size. A CRM migration is paid once, after you see the sample, by the number of records counted in the source:

| Records | Price |
|---|---|
| up to 50,000 | $249 |
| up to 100,000 | $499 |
| up to 200,000 | $749 |
| up to 500,000 | $999 |
| up to 1,000,000 | $1,499 |
| up to 5,000,000 | $4,749 |
| over 5,000,000 | email help@shuttio.com |

A payment covers its band and every smaller one. Current prices: https://www.shuttio.com/pricing

## Security

Shuttio reads the source over OAuth where the source offers it (Affinity takes an API key). It connects to Twenty with OAuth or with an API key you paste. The credential is checked before it is stored, encrypted at rest under a per-record data key, and never logged or sent through a job queue. You can revoke it in Twenty at any time. Shuttio does not keep your records: it keeps the structure, the field mapping and an id map, which is what makes a re-run safe and a rollback complete. A CSV file is deleted when the import finishes. Claude, Anthropic's model, reads at most three 80-character samples per CSV column to guess its type and never writes data. Details and the subprocessor list: https://www.shuttio.com/security

## How to connect

1. In Twenty, press Cmd+K and run **Import data with Shuttio**, or go to https://www.shuttio.com and choose Twenty as the destination.
2. Choose your source and sign in to Shuttio with Google or email.
3. Connect the source, then connect your Twenty workspace. Use an admin account: Shuttio adds custom fields, options and objects.
4. Tick the objects, review the field mapping, and start the sample.

Twenty allows 100 requests a minute and 60 records per request, so tens of thousands of records take minutes. Shuttio pauses on a rate limit and resumes.

Help: help@shuttio.com. Terms: https://www.shuttio.com/terms

Development and publishing: [SETUP.md](https://github.com/gmaramigin/shuttio-twenty-app/blob/main/SETUP.md).
