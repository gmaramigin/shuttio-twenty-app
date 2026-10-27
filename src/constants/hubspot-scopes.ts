// Copied from the Shuttio repo: hubspot-app/src/app/app-hsmeta.json and
// src/lib/connect/hubspot-oauth.ts (HUBSPOT_SCOPES, HUBSPOT_OPTIONAL_SCOPES).
// The required list must equal the HubSpot app's required scopes exactly, or
// HubSpot refuses the install URL. Write scopes are left out: Twenty is the
// destination, HubSpot is only read.
export const HUBSPOT_REQUIRED_SCOPES = [
  'oauth',
  'crm.objects.contacts.read',
  'crm.schemas.contacts.read',
  'crm.objects.companies.read',
  'crm.schemas.companies.read',
  'crm.objects.deals.read',
  'crm.schemas.deals.read',
  'crm.objects.products.read',
  'crm.objects.line_items.read',
  'crm.lists.read',
];

export const HUBSPOT_OPTIONAL_SCOPES = [
  'crm.objects.custom.read',
  'crm.schemas.custom.read',
  'crm.objects.tickets.read',
  'crm.objects.quotes.read',
  'crm.objects.leads.read',
  'crm.objects.owners.read',
  'files.read',
];
