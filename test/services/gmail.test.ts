import { google } from 'googleapis';
import { loadGmail, getTodoItems } from '@/services/gmail';

// Mock the googleapis library
jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: jest.fn(),
      })),
    },
    gmail: jest.fn(),
  },
}));

describe('Gmail Service', () => {
  let gmailMock: any;

  beforeEach(() => {
    // Reset the mock before each test
    gmailMock = {
      users: {
        messages: {
          list: jest.fn(),
          get: jest.fn(),
          trash: jest.fn(),
        },
      },
    };
    (google.gmail as jest.Mock).mockReturnValue(gmailMock);

    // Set up environment variables
    process.env.INCLUDE_EMAIL_SETUP = 'true';
    process.env.GMAIL_CLIENT_ID = 'test-client-id';
    process.env.GMAIL_CLIENT_SECRET = 'test-client-secret';
    process.env.GMAIL_REFRESH_TOKEN = 'test-refresh-token';
    process.env.INBOUND_WHITELIST = 'test@example.com';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.INCLUDE_EMAIL_SETUP;
    delete process.env.GMAIL_CLIENT_ID;
    delete process.env.GMAIL_CLIENT_SECRET;
    delete process.env.GMAIL_REFRESH_TOKEN;
    delete process.env.INBOUND_WHITELIST;
  });

  describe('loadGmail', () => {
    it('should initialize the Gmail client', async () => {
      await loadGmail();
      expect(google.auth.OAuth2).toHaveBeenCalledWith('test-client-id', 'test-client-secret');
      expect(google.gmail).toHaveBeenCalledWith({ version: 'v1', auth: expect.any(Object) });
    });

    it('should throw an error if Gmail credentials are missing', async () => {
      delete process.env.GMAIL_CLIENT_ID;
      await expect(loadGmail()).rejects.toThrow();
    });

    it('should not throw an error if INBOUND_WHITELIST is missing', async () => {
      delete process.env.INBOUND_WHITELIST;
      await expect(loadGmail()).resolves.not.toThrow();
    });

    it('should throw an error if the gmail client fails to initialize', async () => {
      (google.gmail as jest.Mock).mockReturnValue(null);
      await expect(loadGmail()).rejects.toThrow();
    });

    it('should not initialize if INCLUDE_EMAIL_SETUP is not true', async () => {
      process.env.INCLUDE_EMAIL_SETUP = 'false';

      await loadGmail();

      expect(google.auth.OAuth2).not.toHaveBeenCalled();
    });
  });

  describe('getTodoItems', () => {
    beforeEach(async () => {
      // Ensure gmail is loaded before each test in this block
      await loadGmail();
    });

    it('should fetch and process emails from whitelisted senders', async () => {
      const mockMessages = [
        { id: '1', threadId: '1' },
      ];
      const mockEmail = {
        data: {
          payload: {
            headers: [
              { name: 'From', value: 'Test User <test@example.com>' },
              { name: 'Subject', value: 'Test Subject' },
              { name: 'Date', value: new Date().toUTCString() },
            ],
            body: { data: Buffer.from('Test Body').toString('base64') },
          },
        },
      };

      gmailMock.users.messages.list.mockResolvedValue({ data: { messages: mockMessages } });
      gmailMock.users.messages.get.mockResolvedValue(mockEmail);

      const todoItems = await getTodoItems();

      expect(todoItems).toHaveLength(1);
      expect(todoItems[0].text).toBe('Test Body');
      expect(gmailMock.users.messages.trash).toHaveBeenCalledWith({ userId: 'me', id: '1' });
    });

    it('should return an empty array if no messages are found', async () => {
      gmailMock.users.messages.list.mockResolvedValue({ data: { messages: [] } });

      const todoItems = await getTodoItems();

      expect(todoItems).toHaveLength(0);
    });

    it('should not process emails from non-whitelisted senders', async () => {
        const mockMessages = [
            { id: '1', threadId: '1' },
          ];
          const mockEmail = {
            data: {
              payload: {
                headers: [
                  { name: 'From', value: 'other@example.com' },
                  { name: 'Subject', value: 'Test Subject' },
                  { name: 'Date', value: new Date().toUTCString() },
                ],
                body: { data: Buffer.from('Test Body').toString('base64') },
              },
            },
          };
    
          gmailMock.users.messages.list.mockResolvedValue({ data: { messages: mockMessages } });
          gmailMock.users.messages.get.mockResolvedValue(mockEmail);
    
          const todoItems = await getTodoItems();
    
          expect(todoItems).toHaveLength(0);
          expect(gmailMock.users.messages.trash).not.toHaveBeenCalled();
    });

    it('should handle emails with no body', async () => {
        const mockMessages = [
            { id: '1', threadId: '1' },
          ];
          const mockEmail = {
            data: {
              payload: {
                headers: [
                  { name: 'From', value: 'test@example.com' },
                  { name: 'Subject', value: 'Test Subject' },
                  { name: 'Date', value: new Date().toUTCString() },
                ],
                body: {},
              },
            },
          };
    
          gmailMock.users.messages.list.mockResolvedValue({ data: { messages: mockMessages } });
          gmailMock.users.messages.get.mockResolvedValue(mockEmail);
    
          const todoItems = await getTodoItems();
    
          expect(todoItems).toHaveLength(1);
          expect(todoItems[0].text).toBe('');
    });

    it('should skip emails with no From header', async () => {
      const mockMessages = [
        { id: '1', threadId: '1' },
      ];
      const mockEmail = {
        data: {
          payload: {
            headers: [
              { name: 'Subject', value: 'Test Subject' },
            ],
            body: { data: Buffer.from('Test Body').toString('base64') },
          },
        },
      };

      gmailMock.users.messages.list.mockResolvedValue({ data: { messages: mockMessages } });
      gmailMock.users.messages.get.mockResolvedValue(mockEmail);

      const todoItems = await getTodoItems();

      expect(todoItems).toHaveLength(0);
    });
  });
});
