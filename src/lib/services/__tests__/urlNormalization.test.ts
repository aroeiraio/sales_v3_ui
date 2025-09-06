import { describe, it, expect } from 'vitest';
import { videoPlayerService } from '../videoPlayer';

describe('URL Normalization', () => {
  it('should normalize localhost:8051 to localhost:8090', () => {
    // Access the private method for testing
    const normalizeUrl = (videoPlayerService as any).normalizeVideoUrl.bind(videoPlayerService);
    
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
        input: '/media/videos/video.mp4',
        expected: 'http://localhost:8090/media/videos/video.mp4'
      },
      {
        input: 'https://imach.s3.amazonaws.com/core-web-application/videos/video.mp4',
        expected: 'https://imach.s3.amazonaws.com/core-web-application/videos/video.mp4'
      }
    ];

    testCases.forEach(({ input, expected }) => {
      const result = normalizeUrl(input);
      expect(result).toBe(expected);
    });
  });

  it('should handle edge cases in URL normalization', () => {
    const normalizeUrl = (videoPlayerService as any).normalizeVideoUrl.bind(videoPlayerService);
    
    const edgeCases = [
      {
        input: 'http://localhost:8051/media/videos/video.mp4?param=value',
        expected: 'http://localhost:8090/media/videos/video.mp4?param=value'
      },
      {
        input: 'http://localhost:8051/media/videos/video.mp4#fragment',
        expected: 'http://localhost:8090/media/videos/video.mp4#fragment'
      },
      {
        input: 'media/videos/video.mp4',
        expected: 'http://localhost:8090/media/videos/video.mp4'
      }
    ];

    edgeCases.forEach(({ input, expected }) => {
      const result = normalizeUrl(input);
      expect(result).toBe(expected);
    });
  });
});
