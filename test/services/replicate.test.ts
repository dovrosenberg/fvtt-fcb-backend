import Replicate from 'replicate';


const mockReplicateRun = jest.fn();
const mockSaveFile = jest.fn();

// Mock dependencies
jest.mock('replicate', () => {
  return jest.fn().mockImplementation(() => ({
    run: mockReplicateRun,
  }));
});

jest.mock('@/services/storage', () => ({
  getStorageProvider: () => ({
    saveFile: mockSaveFile,
  }),
}));

// Mock global fetch
global.fetch = jest.fn();

const MODEL_ID = 'minimax/image-01';

describe('Replicate Service', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockReplicateRun.mockReset();
    (Replicate as unknown as jest.Mock).mockClear();
    mockFetch = global.fetch as jest.Mock;

    mockSaveFile.mockReset();
    mockFetch.mockReset();

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
  });

  describe('generateImage', () => {
    let generateImage: typeof import('@/services/replicate').generateImage;

    beforeEach(async () => {
      const replicateModule = await import('@/services/replicate');
      generateImage = replicateModule.generateImage;
      await replicateModule.loadReplicate();
    });

    const mockSuccessfulFetch = (buffer = Buffer.from('image-data')) => {
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(buffer),
      });
    };

    it('should generate an image and save it to storage', async () => {
      const mockImageUrl = 'http://example.com/image.jpg';
      const mockImageBuffer = Buffer.from('image-data');
      const mockPublicUrl = 'http://storage.com/image.jpg';

      mockReplicateRun.mockResolvedValue([mockImageUrl]);
      mockSuccessfulFetch(mockImageBuffer);
      mockSaveFile.mockResolvedValue(mockPublicUrl);

      const result = await generateImage('a test prompt', 'test-prefix', MODEL_ID);

      expect(result).toBe(mockPublicUrl);
      expect(mockReplicateRun).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(mockImageUrl);
      expect(mockSaveFile).toHaveBeenCalledWith(
        expect.stringMatching(/^fcb\/test-prefix-\d+\.jpeg$/),
        mockImageBuffer,
        'image/jpeg'
      );
    });

    it('should add the model prompt trigger and negative prompt', async () => {
      mockReplicateRun.mockResolvedValue(['http://example.com/image.jpg']);
      mockSuccessfulFetch();
      mockSaveFile.mockResolvedValue('url');

      await generateImage('prompt', 'prefix', MODEL_ID);

      expect(mockReplicateRun).toHaveBeenCalledWith(MODEL_ID, {
        input: {
          prompt: 'prompt, 4k, 8k, masterpiece, trending on artstation, detailed, cinematic',
          negative_prompt: 'watermark, logo, signature',
        },
      });
    });

    it('should use overrideOptions when provided and append to the negative prompt', async () => {
      mockReplicateRun.mockResolvedValue(['http://example.com/image.jpg']);
      mockSuccessfulFetch();
      mockSaveFile.mockResolvedValue('url');

      await generateImage('prompt', 'prefix', MODEL_ID, { steps: 50, negative_prompt: 'blurry' });

      expect(mockReplicateRun).toHaveBeenCalledWith(MODEL_ID, {
        input: expect.objectContaining({
          steps: 50,
          negative_prompt: 'watermark, logo, signature, blurry',
        }),
      });
    });

    it('should clear the negative prompt when the override is empty', async () => {
      mockReplicateRun.mockResolvedValue(['http://example.com/image.jpg']);
      mockSuccessfulFetch();
      mockSaveFile.mockResolvedValue('url');

      await generateImage('prompt', 'prefix', MODEL_ID, { negative_prompt: '' });

      expect(mockReplicateRun).toHaveBeenCalledWith(MODEL_ID, {
        input: expect.objectContaining({ negative_prompt: '' }),
      });
    });

    it('should throw an error for an unknown model', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(generateImage('prompt', 'prefix', 'unknown/model')).rejects.toThrow('not found');
      expect(mockReplicateRun).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should throw an error if Replicate fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockReplicateRun.mockRejectedValue(new Error('Replicate error'));

      await expect(generateImage('prompt', 'prefix', MODEL_ID)).rejects.toThrow();
      consoleErrorSpy.mockRestore();
    });

    it('should throw an error if fetching the image fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockReplicateRun.mockResolvedValue(['http://example.com/image.jpg']);
      mockFetch.mockResolvedValue({ ok: false, statusText: 'Not Found' });

      await expect(generateImage('prompt', 'prefix', MODEL_ID)).rejects.toThrow();
      consoleErrorSpy.mockRestore();
    });

    it('should handle non-array output from replicate.run', async () => {
        const mockPublicUrl = 'http://storage.com/image.jpg';

        mockReplicateRun.mockResolvedValue('http://example.com/image.jpg'); // Not an array
        mockSuccessfulFetch();
        mockSaveFile.mockResolvedValue(mockPublicUrl);

        const result = await generateImage('a test prompt', 'test-prefix', MODEL_ID);
        expect(result).toBe(mockPublicUrl);
    });

    it('should handle FileOutput object from replicate.run', async () => {
        const mockImageUrl = 'http://example.com/image.jpg';
        const mockPublicUrl = 'http://storage.com/image.jpg';

        const fileOutput = { url: () => mockImageUrl };
        mockReplicateRun.mockResolvedValue([fileOutput]);
        mockSuccessfulFetch();
        mockSaveFile.mockResolvedValue(mockPublicUrl);

        const result = await generateImage('a test prompt', 'test-prefix', MODEL_ID);
        expect(result).toBe(mockPublicUrl);
        expect(mockFetch).toHaveBeenCalledWith(mockImageUrl);
    });
  });

  describe('when Replicate is not loaded', () => {
    it('should throw an error', async () => {
      const { generateImage } = await import('@/services/replicate');
      await expect(generateImage('prompt', 'prefix', MODEL_ID)).rejects.toThrow();
    });
  });
});
