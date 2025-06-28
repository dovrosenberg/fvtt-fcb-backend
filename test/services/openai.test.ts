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
    mockCreate.mockClear();
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

    it('should return a parsed JSON response on the first try', async () => {
      const mockResponse = { choices: [{ message: { content: '{"key":"value"}' } }] };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await getCompletion('system-prompt', 'user-prompt', 1.0);

      expect(result).toEqual({ key: 'value' });
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should step down temperature if the first response is invalid JSON', async () => {
      const invalidResponse = { choices: [{ message: { content: 'invalid-json' } }] };
      const validResponse = { choices: [{ message: { content: '{"key":"value"}' } }] };
      mockCreate.mockResolvedValueOnce(invalidResponse).mockResolvedValueOnce(validResponse);

      const result = await getCompletion('system-prompt', 'user-prompt', 1.0);

      expect(result).toEqual({ key: 'value' });
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should throw an error if all temperature step-downs fail', async () => {
      const invalidResponse = { choices: [{ message: { content: 'invalid-json' } }] };
      mockCreate.mockResolvedValue(invalidResponse);

      await expect(getCompletion('system-prompt', 'user-prompt', 0.5)).rejects.toThrow();
    });
  });

  describe('getPreviewCompletion', () => {
    let getPreviewCompletion: typeof import('@/services/openai').getPreviewCompletion;

    beforeEach(async () => {
      const openaiModule = await import('@/services/openai');
      getPreviewCompletion = openaiModule.getPreviewCompletion;
      await openaiModule.loadOpenAI();
    });

    it('should return a parsed JSON response for a preview', async () => {
      const mockResponse = { choices: [{ message: { content: '[{"people":[],"locations":[]}]' } }] };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await getPreviewCompletion(['style1'], 'prompt', 1.0);

      expect(result).toEqual([{ people: [], locations: [] }]);
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe('when OpenAI is not loaded', () => {
    it('getCompletion should throw an error', async () => {
      const { getCompletion } = await import('@/services/openai');
      await expect(getCompletion('system-prompt', 'user-prompt', 1.0)).rejects.toThrow();
    });

    it('getPreviewCompletion should throw an error', async () => {
      const { getPreviewCompletion } = await import('@/services/openai');
      await expect(getPreviewCompletion(['style'], 'prompt', 1.0)).rejects.toThrow();
    });
  });
});
