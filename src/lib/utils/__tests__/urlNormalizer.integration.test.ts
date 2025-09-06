import { describe, it, expect } from 'vitest';
import { normalizeUrl } from '../urlNormalizer';

describe('URL Normalizer Integration Tests', () => {
  describe('Real-world URL normalization', () => {
    it('should normalize the specific video URL from the error', () => {
      const problematicUrl = 'http://localhost:8051/media/videos/simplescreenrecorder-2024-10-23_09.25.29.mp4';
      const expectedUrl = 'http://localhost:8090/media/videos/simplescreenrecorder-2024-10-23_09.25.29.mp4';
      
      const result = normalizeUrl(problematicUrl);
      
      expect(result).toBe(expectedUrl);
      expect(result).not.toContain('localhost:8051');
      expect(result).toContain('localhost:8090');
    });

    it('should handle various localhost:8051 patterns', () => {
      const testCases = [
        {
          input: 'http://localhost:8051/media/videos/video.mp4',
          expected: 'http://localhost:8090/media/videos/video.mp4'
        },
        {
          input: 'http://localhost:8051/media/customer/image.png',
          expected: 'http://localhost:8090/media/customer/image.png'
        },
        {
          input: 'http://localhost:8051/media/videos/simplescreenrecorder-2024-10-23_09.25.29.mp4',
          expected: 'http://localhost:8090/media/videos/simplescreenrecorder-2024-10-23_09.25.29.mp4'
        }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = normalizeUrl(input);
        expect(result).toBe(expected);
        expect(result).not.toContain('localhost:8051');
        expect(result).toContain('localhost:8090');
      });
    });

    it('should preserve other URL formats', () => {
      const testCases = [
        {
          input: 'https://imach.s3.amazonaws.com/core-web-application/videos/video.mp4',
          expected: 'https://imach.s3.amazonaws.com/core-web-application/videos/video.mp4'
        },
        {
          input: '/media/videos/video.mp4',
          expected: 'http://localhost:8090/media/videos/video.mp4'
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
  });

  describe('Edge cases', () => {
    it('should handle empty and null inputs', () => {
      expect(normalizeUrl('')).toBe('');
      expect(normalizeUrl(null as any)).toBe('');
      expect(normalizeUrl(undefined as any)).toBe('');
    });

    it('should handle URLs with query parameters', () => {
      const input = 'http://localhost:8051/media/videos/video.mp4?param=value';
      const expected = 'http://localhost:8090/media/videos/video.mp4?param=value';
      
      const result = normalizeUrl(input);
      expect(result).toBe(expected);
    });

    it('should handle URLs with fragments', () => {
      const input = 'http://localhost:8051/media/videos/video.mp4#fragment';
      const expected = 'http://localhost:8090/media/videos/video.mp4#fragment';
      
      const result = normalizeUrl(input);
      expect(result).toBe(expected);
    });
  });
});
