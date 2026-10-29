import OpenAI from 'openai';



const mockCreate = jest.fn();

// Mock the OpenAI library
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

describe('OpenAI Service', () => {
  beforeEach(() => {
    // Reset the mock before each test
    mockCreate.mockReset();
    (OpenAI as unknown as jest.Mock).mockClear();
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    jest.resetModules();
  });

  describe('loadOpenAI', () => {
    it('should initialize the OpenAI client with the API key', async () => {
      const { loadOpenAI } = await import('@/services/openai');
      await loadOpenAI();
      expect(OpenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    });

    it('should not initialize OpenAI if the API key is missing', async () => {
      delete process.env.OPENAI_API_KEY;
      const { loadOpenAI } = await import('@/services/openai');
      await loadOpenAI();
      expect(OpenAI).not.toHaveBeenCalled();
    });
  });

  describe('getCompletion', () => {
    let getCompletion: typeof import('@/services/openai').getCompletion;

    beforeEach(async () => {
      const openaiModule = await import('@/services/openai');
      getCompletion = openaiModule.getCompletion;
      await openaiModule.loadOpenAI();
    });

    it('should return the trimmed message content', async () => {
      mockCreate.mockResolvedValue({ choices: [{ message: { content: '  {"key":"value"}\n' } }] });

      const result = await getCompletion('system-prompt', 'user-prompt', 1.0, 'gpt-6-luna');

      expect(result).toBe('{"key":"value"}');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should send the model and prompts with reasoning turned off', async () => {
      mockCreate.mockResolvedValue({ choices: [{ message: { content: 'ok' } }] });

      await getCompletion('system-prompt', 'user-prompt', 0.5, 'gpt-5.6-terra');

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gpt-5.6-terra',
        messages: [{ role: 'system', content: 'system-prompt' }, { role: 'user', content: 'user-prompt' }],
        reasoning_effort: 'none',
      }));
    });

    it('should return null if the response has no content', async () => {
      mockCreate.mockResolvedValue({ choices: [{ message: { content: '' } }] });

      const result = await getCompletion('system-prompt', 'user-prompt', 1.0, 'gpt-6-luna');

      expect(result).toBeNull();
    });

    it('should throw an error if the API call fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockCreate.mockRejectedValue(new Error('API error'));

      await expect(getCompletion('system-prompt', 'user-prompt', 1.0, 'gpt-6-luna')).rejects.toThrow('API error');
      consoleErrorSpy.mockRestore();
    });
  });

  describe('when OpenAI is not loaded', () => {
    it('getCompletion should throw an error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { getCompletion } = await import('@/services/openai');
      await expect(getCompletion('system-prompt', 'user-prompt', 1.0, 'gpt-6-luna')).rejects.toThrow();
      consoleErrorSpy.mockRestore();
    });
  });
});
