import { describe, it, expect } from 'vitest';
import { normalizeUrl, hasFileExtension, normalizeMediaPath, processVisualSettings, processMediaItems } from '../urlNormalizer';

describe('URL Normalizer', () => {
  describe('normalizeUrl', () => {
    it('should normalize localhost:8051 to localhost:8090', () => {
      const testCases = [
        {
          input: 'http://localhost:8051/media/videos/video.mp4',
          expected: 'http://localhost:8090/media/videos/video.mp4'
        },
        {
          input: 'http://localhost:8051/media/videos/simplescreenrecorder-2024-10-23_09.25.29.mp4',
          expected: 'http://localhost:8090/media/videos/simplescreenrecorder-2024-10-23_09.25.29.mp4'
        },
        {
          input: 'http://localhost:8051/media/customer/background.png',
          expected: 'http://localhost:8090/media/customer/background.png'
        }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = normalizeUrl(input);
        expect(result).toBe(expected);
      });
    });

    it('should handle relative media paths', () => {
      const testCases = [
        {
          input: '/media/videos/video.mp4',
          expected: 'http://localhost:8090/media/videos/video.mp4'
        },
        {
          input: '/media/customer/background.png',
          expected: 'http://localhost:8090/media/customer/background.png'
        },
        {
          input: 'media/videos/video.mp4',
          expected: 'http://localhost:8090/media/videos/video.mp4'
        }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = normalizeUrl(input);
        expect(result).toBe(expected);
      });
    });

    it('should preserve external URLs', () => {
      const testCases = [
        {
          input: 'https://imach.s3.amazonaws.com/core-web-application/videos/video.mp4',
          expected: 'https://imach.s3.amazonaws.com/core-web-application/videos/video.mp4'
        },
        {
          input: 'https://example.com/image.png',
          expected: 'https://example.com/image.png'
        }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = normalizeUrl(input);
        expect(result).toBe(expected);
      });
    });

    it('should handle edge cases', () => {
      const testCases = [
        {
          input: '',
          expected: ''
        },
        {
          input: null as any,
          expected: ''
        },
        {
          input: undefined as any,
          expected: ''
        }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = normalizeUrl(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('hasFileExtension', () => {
    it('should detect file extensions', () => {
      const testCases = [
        { input: '/media/customer/background.png', expected: true },
        { input: '/media/videos/video.mp4', expected: true },
        { input: '/media/customer/merchant.jpg', expected: true },
        { input: '/media/customer/logo.svg', expected: true }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = hasFileExtension(input);
        expect(result).toBe(expected);
      });
    });

    it('should detect directory paths without extensions', () => {
      const testCases = [
        { input: '/media/customer/', expected: false },
        { input: '/media/videos/', expected: false },
        { input: '/media/', expected: false }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = hasFileExtension(input);
        expect(result).toBe(expected);
      });
    });

    it('should handle edge cases', () => {
      const testCases = [
        { input: '', expected: false },
        { input: null as any, expected: false },
        { input: undefined as any, expected: false }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = hasFileExtension(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('normalizeMediaPath', () => {
    it('should normalize paths with file extensions', () => {
      const testCases = [
        {
          input: '/media/customer/background.png',
          expected: 'http://localhost:8090/media/customer/background.png'
        },
        {
          input: '/media/customer/merchant.jpg',
          expected: 'http://localhost:8090/media/customer/merchant.jpg'
        }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = normalizeMediaPath(input);
        expect(result).toBe(expected);
      });
    });

    it('should return null for directory paths', () => {
      const testCases = [
        '/media/customer/',
        '/media/videos/',
        '/media/'
      ];

      testCases.forEach((input) => {
        const result = normalizeMediaPath(input);
        expect(result).toBe(null);
      });
    });
  });

  describe('processVisualSettings', () => {
    it('should process visual settings with file extensions', () => {
      const input = {
        background_color: '#ffffff',
        background_image: '/media/customer/background.png',
        font_color: '#000000',
        logotype_image: '/media/customer/merchant.jpg',
        logotype_pos_x: 'center',
        logotype_pos_y: 'center'
      };

      const result = processVisualSettings(input);

      expect(result.background_image).toBe('http://localhost:8090/media/customer/background.png');
      expect(result.logotype_image).toBe('http://localhost:8090/media/customer/merchant.jpg');
      expect(result.background_color).toBe('#ffffff');
      expect(result.font_color).toBe('#000000');
    });

    it('should handle directory paths in visual settings', () => {
      const input = {
        background_color: '#ffffff',
        background_image: '/media/customer/',
        font_color: '#000000',
        logotype_image: '/media/customer/',
        logotype_pos_x: 'center',
        logotype_pos_y: 'center'
      };

      const result = processVisualSettings(input);

      expect(result.background_image).toBe(null);
      expect(result.logotype_image).toBe(null);
      expect(result.background_color).toBe('#ffffff');
      expect(result.font_color).toBe('#000000');
    });

    it('should handle mixed paths', () => {
      const input = {
        background_color: '#ffffff',
        background_image: '/media/customer/', // Directory - should be null
        font_color: '#000000',
        logotype_image: '/media/customer/merchant.png', // File - should be normalized
        logotype_pos_x: 'center',
        logotype_pos_y: 'center'
      };

      const result = processVisualSettings(input);

      expect(result.background_image).toBe(null);
      expect(result.logotype_image).toBe('http://localhost:8090/media/customer/merchant.png');
    });
  });

  describe('processMediaItems', () => {
    it('should process media items with normalized URLs', () => {
      const input = [
        {
          source: '/media/videos/video1.mp4',
          url: 'https://imach.s3.amazonaws.com/core-web-application/videos/video1.mp4',
          filename: 'video1.mp4'
        },
        {
          source: '/media/videos/video2.mp4',
          url: 'https://imach.s3.amazonaws.com/core-web-application/videos/video2.mp4',
          filename: 'video2.mp4'
        }
      ];

      const result = processMediaItems(input);

      expect(result).toHaveLength(2);
      expect(result[0].normalizedUrl).toBe('http://localhost:8090/media/videos/video1.mp4');
      expect(result[1].normalizedUrl).toBe('http://localhost:8090/media/videos/video2.mp4');
    });

    it('should handle URLs with localhost:8051', () => {
      const input = [
        {
          source: 'http://localhost:8051/media/videos/video.mp4',
          url: 'https://imach.s3.amazonaws.com/core-web-application/videos/video.mp4',
          filename: 'video.mp4'
        }
      ];

      const result = processMediaItems(input);

      expect(result[0].normalizedUrl).toBe('http://localhost:8090/media/videos/video.mp4');
    });
  });
});
