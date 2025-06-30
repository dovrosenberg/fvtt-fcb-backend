import Replicate from 'replicate';


const mockReplicateRun = jest.fn();

// Mock dependencies
jest.mock('replicate', () => {
  return jest.fn().mockImplementation(() => ({
    run: mockReplicateRun,
  }));
});

jest.mock('@/services/storage', () => ({
  storageProvider: {
    saveFile: jest.fn(),
  },
}));

// Mock global fetch
global.fetch = jest.fn();

describe('Replicate Service', () => {
  let mockSaveFile: jest.Mock;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockReplicateRun.mockClear();
    (Replicate as unknown as jest.Mock).mockClear();
    mockSaveFile = require('@/services/storage').storageProvider.saveFile;
    mockFetch = global.fetch as jest.Mock;

    mockSaveFile.mockClear();
    mockFetch.mockClear();

    process.env.REPLICATE_API_KEY = 'test-replicate-key';
  });

  afterEach(() => {
    delete process.env.REPLICATE_API_KEY;
    jest.resetModules();
  });

  describe('loadReplicate', () => {
    it('should initialize the Replicate client', async () => {
      const { loadReplicate } = await import('@/services/replicate');
      await loadReplicate();
      expect(Replicate).toHaveBeenCalledWith({ auth: 'test-replicate-key' });
    });

    it('should throw an error if REPLICATE_API_KEY is missing', async () => {
      delete process.env.REPLICATE_API_KEY;
      const { loadReplicate } = await import('@/services/replicate');
      await expect(loadReplicate()).rejects.toThrow();
    });

    it('should throw an error if Replicate client fails to initialize', async () => {
      (Replicate as unknown as jest.Mock).mockImplementation(() => undefined);
      const { loadReplicate } = await import('@/services/replicate');
      await expect(loadReplicate()).rejects.toThrow();
    });
  });

  describe('generateImage', () => {
    let generateImage: typeof import('@/services/replicate').generateImage;
    let models: typeof import('@/services/replicate').models;
    let DEFAULT_MODEL: typeof import('@/services/replicate').DEFAULT_MODEL;

    beforeEach(async () => {
      const replicateModule = await import('@/services/replicate');
      generateImage = replicateModule.generateImage;
      models = replicateModule.models;
      DEFAULT_MODEL = replicateModule.DEFAULT_MODEL;
      await replicateModule.loadReplicate();
    });

    it('should generate an image and save it to storage', async () => {
      const mockImageUrl = 'http://example.com/image.jpg';
      const mockImageBuffer = Buffer.from('image-data');
      const mockPublicUrl = 'http://storage.com/image.jpg';

      mockReplicateRun.mockResolvedValue([mockImageUrl]);
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockImageBuffer),
      });
      mockSaveFile.mockResolvedValue(mockPublicUrl);

      const result = await generateImage('a test prompt', 'test-prefix');

      expect(result).toBe(mockPublicUrl);
      expect(mockReplicateRun).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(mockImageUrl);
      expect(mockSaveFile).toHaveBeenCalledWith(
        expect.stringContaining('test-prefix'),
        mockImageBuffer,
        expect.any(String)
      );
    });

    it('should use overrideOptions when provided', async () => {
        const mockImageUrl = 'http://example.com/image.jpg';
        mockReplicateRun.mockResolvedValue([mockImageUrl]);
        mockFetch.mockResolvedValue({ ok: true, arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('')) });
        mockSaveFile.mockResolvedValue('url');

        await generateImage('prompt', 'prefix', { steps: 50 });

        const expectedOptions = {
            ...models[DEFAULT_MODEL].getOptions('prompt'),
            steps: 50,
        };

        expect(mockReplicateRun).toHaveBeenCalledWith(
            models[DEFAULT_MODEL].modelId,
            { input: expectedOptions }
        );
    });

    it('should handle different models by modelID', async () => {
        const mockImageUrl = 'http://example.com/image.jpg';
        mockReplicateRun.mockResolvedValue([mockImageUrl]);
        mockFetch.mockResolvedValue({ ok: true, arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('')) });
        mockSaveFile.mockResolvedValue('url');

        await generateImage('prompt', 'prefix', {}, 1);

        const expectedOptions = models[1].getOptions('prompt');

        expect(mockReplicateRun).toHaveBeenCalledWith(
            models[1].modelId,
            { input: expectedOptions }
        );
    });

    it('should throw an error if Replicate fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockReplicateRun.mockRejectedValue(new Error('Replicate error'));

      await expect(generateImage('prompt', 'prefix')).rejects.toThrow();
      consoleErrorSpy.mockRestore();
    });

    it('should throw an error if fetching the image fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockReplicateRun.mockResolvedValue(['http://example.com/image.jpg']);
      mockFetch.mockResolvedValue({ ok: false, statusText: 'Not Found' });

      await expect(generateImage('prompt', 'prefix')).rejects.toThrow();
      consoleErrorSpy.mockRestore();
    });

    it('should handle non-array output from replicate.run', async () => {
        const mockImageUrl = 'http://example.com/image.jpg';
        const mockImageBuffer = Buffer.from('image-data');
        const mockPublicUrl = 'http://storage.com/image.jpg';

        mockReplicateRun.mockResolvedValue(mockImageUrl); // Not an array
        mockFetch.mockResolvedValue({
          ok: true,
          arrayBuffer: jest.fn().mockResolvedValue(mockImageBuffer),
        });
        mockSaveFile.mockResolvedValue(mockPublicUrl);

        const result = await generateImage('a test prompt', 'test-prefix');
        expect(result).toBe(mockPublicUrl);
    });

    it('should handle FileOutput object from replicate.run', async () => {
        const mockImageUrl = 'http://example.com/image.jpg';
        const mockImageBuffer = Buffer.from('image-data');
        const mockPublicUrl = 'http://storage.com/image.jpg';

        const fileOutput = { url: () => mockImageUrl };
        mockReplicateRun.mockResolvedValue([fileOutput]);
        mockFetch.mockResolvedValue({
          ok: true,
          arrayBuffer: jest.fn().mockResolvedValue(mockImageBuffer),
        });
        mockSaveFile.mockResolvedValue(mockPublicUrl);

        const result = await generateImage('a test prompt', 'test-prefix');
        expect(result).toBe(mockPublicUrl);
    });

  });

  describe('when Replicate is not loaded', () => {
    it('should throw an error', async () => {
      const { generateImage } = await import('@/services/replicate');
      await expect(generateImage('prompt', 'prefix')).rejects.toThrow();
    });
  });

  describe('models', () => {
    it('should have getOptions functions that return valid options', async () => {
        const { models } = await import('@/services/replicate');
        const prompt = 'test prompt';
        models.forEach(model => {
            const options = model.getOptions(prompt);
            expect(options).toBeInstanceOf(Object);
            expect(options.prompt).toBe(prompt);
        });
    });
  });
});
