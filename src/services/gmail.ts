import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

let gmail: any;
let oauth2Client: OAuth2Client;

interface TodoItem {
  timestamp: string;
  text: string;
}

const loadGmail = async function(): Promise<void> {
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
};

const getTodoItems = async (inboxLabel: string): Promise<TodoItem[]> => {
  if (!gmail) {
    throw new Error('Gmail client not initialized');
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

    // Process each message
    for (const message of messages) {
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full'
      });

      const headers = email.data.payload.headers;
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
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
        text: `${body}`.trim()
      });

      // Delete the message after processing
      await gmail.users.messages.trash({
        userId: 'me',
        id: message.id
      });
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