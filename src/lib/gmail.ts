import firebaseConfig from '../../firebase-applet-config.json';

const OAUTH_CLIENT_ID = firebaseConfig.oAuthClientId;
const GMAIL_READONLY_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
  merchant?: string;
  amount?: number;
  detectedType?: string;
}

export interface GmailConnectionState {
  isConnected: boolean;
  userEmail?: string;
  lastSyncedAt?: string;
  messageCount?: number;
  activeBackground: boolean;
}

const STORAGE_KEY_TOKEN = 'secure_money_gmail_token';
const STORAGE_KEY_EXPIRES = 'secure_money_gmail_token_expires';
const STORAGE_KEY_BG = 'secure_money_gmail_bg_active';

/**
 * Checks if a valid cached OAuth access token exists
 */
export function getCachedGmailToken(): string | null {
  try {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const expiresAt = localStorage.getItem(STORAGE_KEY_EXPIRES);
    if (!token || !expiresAt) return null;
    if (Date.now() > parseInt(expiresAt, 10)) {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_EXPIRES);
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export function isBackgroundSyncEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_BG) !== 'false';
  } catch {
    return true;
  }
}

export function setBackgroundSyncEnabled(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY_BG, enabled ? 'true' : 'false');
  } catch (e) {
    console.error('Error writing to storage:', e);
  }
}

/**
 * Initiates the Google Identity Services OAuth popup to request user permission
 * to read transaction/receipt emails from their Gmail inbox.
 */
export function requestGmailPermission(): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if google accounts script is loaded
    if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services SDK is not loaded. Please ensure you have internet access and refresh.'));
      return;
    }

    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: OAUTH_CLIENT_ID,
        scope: GMAIL_READONLY_SCOPE,
        callback: (response: any) => {
          if (response.error) {
            console.error('Gmail OAuth error:', response);
            reject(new Error(response.error_description || response.error));
            return;
          }

          if (response.access_token) {
            const expiresInMs = (response.expires_in || 3600) * 1000;
            const expiresAt = Date.now() + expiresInMs;
            localStorage.setItem(STORAGE_KEY_TOKEN, response.access_token);
            localStorage.setItem(STORAGE_KEY_EXPIRES, expiresAt.toString());
            resolve(response.access_token);
          } else {
            reject(new Error('Failed to obtain Google access token.'));
          }
        },
      });

      // Request token with prompt
      client.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      reject(err);
    }
  });
}

/**
 * Disconnects stored Gmail token
 */
export function disconnectGmail() {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_EXPIRES);
}

/**
 * Fetches relevant subscription receipt, renewal, and price-increase emails
 * from the user's Gmail using the Gmail REST API
 */
export async function fetchReceiptEmails(accessToken: string): Promise<GmailMessageSummary[]> {
  const query = 'subject:(receipt OR invoice OR subscription OR renew OR billed OR payment OR charge OR membership OR Netflix OR Spotify OR "Creative Cloud")';
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15&q=${encodeURIComponent(query)}`;

  const listRes = await fetch(listUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!listRes.ok) {
    if (listRes.status === 401) {
      disconnectGmail();
      throw new Error('Gmail authorization expired. Please re-authorize inbox access.');
    }
    const errJson = await listRes.json().catch(() => ({}));
    throw new Error(errJson.error?.message || `Gmail API error: ${listRes.status}`);
  }

  const listData = await listRes.json();
  const messages: any[] = listData.messages || [];

  if (messages.length === 0) {
    return [];
  }

  // Fetch individual message details
  const messageDetails: GmailMessageSummary[] = [];

  for (const msg of messages.slice(0, 10)) {
    try {
      const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`;
      const msgRes = await fetch(msgUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (msgRes.ok) {
        const data = await msgRes.json();
        const headers = data.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
        const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || new Date().toISOString();

        messageDetails.push({
          id: data.id,
          threadId: data.threadId,
          snippet: data.snippet || '',
          subject,
          from,
          date,
        });
      }
    } catch (e) {
      console.warn('Error fetching individual message:', e);
    }
  }

  return messageDetails;
}
