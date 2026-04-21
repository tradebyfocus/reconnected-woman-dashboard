import { google, type searchconsole_v1 } from 'googleapis';

let client: searchconsole_v1.Searchconsole | null = null;

export function getGscClient(): searchconsole_v1.Searchconsole {
  if (client) return client;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!email || !key) {
    throw new Error('GSC service account credentials missing');
  }
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  client = google.searchconsole({ version: 'v1', auth });
  return client;
}

export function getGscSiteUrl(): string {
  const url = process.env.GSC_SITE_URL;
  if (!url) throw new Error('GSC_SITE_URL missing');
  return url;
}
