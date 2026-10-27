# Changelog

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
