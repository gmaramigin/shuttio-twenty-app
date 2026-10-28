# Changelog

## 2.4.0

- Object ticks on Review fields save one after another from the latest state and stay clickable while an earlier tick saves, so quick clicks are no longer lost.
- The sample result lists records that imported without some links as plain grouped sentences, and its record buttons carry the record names. Lists show their names.

## 2.3.0

- A linked workspace starts a new migration (after a rollback, or another source) without connecting Twenty again: Shuttio makes the migration itself. "Open Shuttio" now shows only when Shuttio has lost access to Twenty, and says so.

## 2.2.0

- The source (HubSpot, Attio, Pipedrive) comes from the newest migration, else the last choice in this browser; a reload no longer resets it to HubSpot.
- After the free sample the page shows its result (counts, what to check, links that open the records inside Twenty) and Pay next, instead of going back to Review fields.
- "I've connected" before the link exists says so: "Twenty is not linked to Shuttio yet."
- Connect step: a "Connect <source>" button opens this app's settings page inside Twenty, where Add connection lives. The app id comes from the app token.
- A link field shows as a link ("Link to People"), without record ids, and offers only the link or Skip. The source's record id says it goes to External ID.
- A GET that never reached Twenty is sent once more before the page shows an error.

## 2.1.0

- Attio and Pipedrive as sources next to HubSpot: the page picks the source; `source-token` and the status route take `provider=hubspot|attio|pipedrive`.
- Attio and Pipedrive connection providers (workspace-shared, scopes fixed on each provider's app). Optional server variables `ATTIO_CLIENT_ID`/`ATTIO_CLIENT_SECRET` and `PIPEDRIVE_CLIENT_ID`/`PIPEDRIVE_CLIENT_SECRET`.
- `attio-identify-account` and `pipedrive-identify-account` pin a connection to one workspace or company.

## 2.0.0

- New page **Import with Shuttio** in the left menu: link Shuttio, connect HubSpot, review fields, free sample, pay, full migration and rollback, built from Twenty UI.
- HubSpot connection provider (workspace-shared). The owner enters `HUBSPOT_CLIENT_ID` and `HUBSPOT_CLIENT_SECRET` once under Settings → Developers → Shuttio → Config.
- Logic functions: `shuttio-proxy-get|post|put` forward the page's calls to the Shuttio API; `source-token` hands Shuttio the HubSpot token; `hubspot-status`; `hubspot-identify-account` pins a connection to one HubSpot portal.
- Application variable `SHUTTIO_BASE_URL` (only `https://*.shuttio.com` is accepted).
- The command **Import data with Shuttio** opens the page instead of an external link.
- `twenty-sdk`, `twenty-client-sdk` and `twenty-ui` 2.51.3; requires Twenty 2.51.0.
- Gallery shows the new page.

## 1.0.0

- Command **Import data with Shuttio** opens Shuttio with Twenty chosen as the destination.
- Marketplace metadata: logo, five gallery images, About text.
