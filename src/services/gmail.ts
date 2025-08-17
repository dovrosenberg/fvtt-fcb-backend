import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { TodoItemsOutput } from '@/schemas/gmail';

let gmail: any;
let oauth2Client: OAuth2Client;

type TodoItem = TodoItemsOutput['items'][0];
let whitelistedEmails: Set<string> = new Set();

const loadGmail = async function(): Promise<void> {
  // make sure we're using gmail
  if (process.env.INCLUDE_EMAIL_SETUP !== 'true') {
    console.log('Email functionality is disabled');
    return;
  }    

  if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN) {
    throw new Error('Missing Gmail credentials in environment variables');
  }

  oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN
  });

  gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  if (!gmail) {
    throw new Error('Failed to initialize Gmail client');
  }

  // Proactively validate that our refresh token is usable so we fail fast with a clear message
  try {
    // This triggers a token refresh if needed
    await oauth2Client.getAccessToken();
  } catch (err: any) {
    const code = err?.code || err?.response?.status;
    const data = err?.response?.data;
    const googleError = data?.error || err?.errors?.[0]?.reason;
    const googleDescription = data?.error_description || err?.message;

    // Surface common case explicitly
    if (googleError === 'invalid_grant') {
      throw new Error(
        'Gmail OAuth refresh token is invalid or revoked.  Remove the refresh token from the .env file and rerun the install script.'
      );
    }

    // Generic auth failure
    throw new Error(`Failed to obtain Gmail access token${code ? ` (HTTP ${code})` : ''}: ${googleDescription || 'unknown error'}`);
  }

  // Initialize whitelist
  if (process.env.INBOUND_WHITELIST) {
    whitelistedEmails = new Set(
      process.env.INBOUND_WHITELIST.split(',').map(email => email.trim().toLowerCase())
    );
    console.log(`Loaded ${whitelistedEmails.size} whitelisted email addresses`);
  } else {
    console.warn('No INBOUND_WHITELIST provided - no emails will be processed');
  }
};

const getTodoItems = async (): Promise<TodoItem[]> => {
  if (!gmail) {
    throw new Error('Gmail client not initialized');
  }

  const inboxLabel = 'INBOX';

  // Return error if email functionality is disabled
  if (process.env.INCLUDE_EMAIL_SETUP !== 'true') {
    throw new Error('Email functionality is disabled');
  }

  try {
    // Get messages from the specified inbox
    const response = await gmail.users.messages.list({
      userId: 'me',
      labelIds: [inboxLabel],
      maxResults: 100
    });

    const messages = response.data.messages || [];
    const todoItems: TodoItem[] = [];

    console.log(`Found ${messages.length} messages in inbox`);
    
    // Process each message
    for (const message of messages) {
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full'
      });

      const sender = email.data.payload.headers.find((h: any) => h.name === 'From')?.value;
      if (sender) {
        // check to see if any of the whitelisted emails are contained in it (since it might have name and other things, too)
        // note - this means that we aren't deleting them and they will ultimately build up; but I think this is better
        //    than risking some important email being missed (like an account notification from Google)... will just
        //    need to document to check the mailbox periodically.
        // I guess as an alternative, we could provide a secondary email to forward to and then delete
        let fromEmail = '';
        for (const email of whitelistedEmails) {
          if (sender.includes(email)) {
            fromEmail = email;
            break;
          }
        }

        if (!fromEmail) {
          console.log(`Skipping message from unknown sender: ${sender}`);
          continue;
        }

        if (fromEmail) {
          const headers = email.data.payload.headers;
          // const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
          const date = headers.find((h: any) => h.name === 'Date')?.value || '';
          
          const timestamp = date ? new Date(date) : new Date();
    
          // Get email body
          let body = '';
          if (email.data.payload.parts) {
            const part = email.data.payload.parts.find((p: any) => p.mimeType === 'text/plain');
            if (part?.body?.data) {
              body = Buffer.from(part.body.data, 'base64').toString();
            }
          } else if (email.data.payload.body?.data) {
            body = Buffer.from(email.data.payload.body.data, 'base64').toString();
          }
    
          // we ignore the subject for now - we might use in the future to distinguish different 
          //    types of messages or different campaigns or something
          todoItems.push({
            timestamp: timestamp.toISOString(),
            text: body.trim()
          });
    
          // Delete the message after processing
          await gmail.users.messages.trash({
            userId: 'me',
            id: message.id
          });
        }
      }
    }

    return todoItems;
  } catch (error) {
    console.error('Error fetching todo items from Gmail:', error);
    throw new Error(`Failed to fetch todo items: ${(error as Error)?.message}`);
  }
};

export {
  loadGmail,
  getTodoItems
}; 