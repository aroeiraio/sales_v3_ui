# Video Player System Guide

## Overview

The Video Player System provides a comprehensive solution for playing multiple videos in a loop with hidden controls, proper error handling, and seamless integration with the InoBag Sales V3 UI.

## Features

- **Multiple Video Support**: Plays videos from digital signage API or fallback videos
- **Auto-loop**: Automatically cycles through all available videos
- **Hidden Controls**: Clean interface with auto-hiding controls
- **Error Handling**: Comprehensive error handling with user-friendly dialogs
- **URL Normalization**: Handles different URL formats and port configurations
- **Responsive Design**: Works on all screen sizes
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Fullscreen Support**: Double-click to enter/exit fullscreen mode

## Architecture

### Core Components

1. **VideoPlayerService** (`src/lib/services/videoPlayer.ts`)
   - Manages video state and playback logic
   - Handles video loading and navigation
   - Integrates with digital signage API

2. **VideoPlayer Component** (`src/lib/components/ui/VideoPlayer.svelte`)
   - Renders the video player interface
   - Handles user interactions
   - Manages control visibility

3. **VideoErrorHandler** (`src/lib/services/videoErrorHandler.ts`)
   - Analyzes and categorizes video errors
   - Shows appropriate error dialogs
   - Manages retry logic

## Usage

### Basic Implementation

```svelte
<script lang="ts">
  import VideoPlayer from '$lib/components/ui/VideoPlayer.svelte';
</script>

<div class="video-container">
  <VideoPlayer />
</div>

<style>
  .video-container {
    width: 100%;
    height: 100vh;
  }
</style>
```

### With Visual Settings Integration

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import VideoPlayer from '$lib/components/ui/VideoPlayer.svelte';
  import { visualSettingsService } from '$lib/services/visualSettings';

  let settings: any = null;

  onMount(async () => {
    settings = await visualSettingsService.loadSettings();
  });
</script>

<div 
  class="video-screen" 
  style:background-color={settings?.background_color || 'var(--fallback-bg)'}
>
  <VideoPlayer />
</div>
```

## API Configuration

### Endpoints

The video player system uses the following endpoints:

- **Digital Signage**: `GET /interface/digital_signage`
- **Media Files**: `GET /media/{filename}`

### URL Normalization

The system automatically normalizes different URL formats:

```typescript
// These URLs will be normalized to the correct format:
'http://localhost:8051/media/videos/video.mp4' → 'http://localhost:8090/media/videos/video.mp4'
'/media/videos/video.mp4' → 'http://localhost:8090/media/videos/video.mp4'
'media/videos/video.mp4' → 'http://localhost:8090/media/videos/video.mp4'
'https://imach.s3.amazonaws.com/...' → Used as-is (S3 URL)
```

### Media File Structure

Videos are served from the local build directory:
- **Local Path**: `/data/Projects/Inobag/sales_v3/build/media/videos/`
- **HTTP URL**: `http://localhost:8090/media/videos/`
- **S3 Fallback**: `https://imach.s3.amazonaws.com/core-web-application/videos/`

### Configuration

Update `src/lib/utils/constants.ts`:

```typescript
export const API_BASE_URL = 'http://localhost:8090/interface';
export const MEDIA_BASE_URL = 'http://localhost:8090';

export const VIDEO_CONFIG = {
  autoplay: true,
  muted: true,
  loop: false,
  preload: 'metadata',
  controls: false,
  playsinline: true,
  autoPlayInterval: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000
} as const;
```

## Error Handling

### Error Types

The system handles different types of video errors:

1. **Network Errors**: Connection issues, timeouts
2. **Format Errors**: Unsupported video formats
3. **Permission Errors**: 403 Forbidden responses
4. **Not Found Errors**: 404 responses
5. **Unknown Errors**: Other unexpected errors

### Error Dialog Examples

```typescript
// Network error with retry option
errorDialogService.showError({
  title: 'Erro de Conexão',
  message: 'Erro de conexão. Verifique sua internet.',
  actions: [
    {
      label: 'Tentar Novamente',
      action: () => retryVideo(),
      variant: 'primary'
    },
    {
      label: 'Pular Vídeo',
      action: () => skipVideo(),
      variant: 'secondary'
    }
  ]
});

// Format error (no retry)
errorDialogService.showError({
  title: 'Formato Não Suportado',
  message: 'Formato de vídeo não suportado.',
  actions: [
    {
      label: 'OK',
      action: () => skipVideo(),
      variant: 'primary'
    }
  ]
});
```

## Digital Signage Integration

### API Response Format

The digital signage API should return:

```json
[
  {
    "id": 11,
    "interval": {
      "beginning": "2025-09-01",
      "ending": "2025-09-30"
    },
    "media": {
      "filename": "simplescreenrecorder-2024-10-23_09.25.29.mp4",
      "pending": 0,
      "source": "/media/videos/simplescreenrecorder-2024-10-23_09.25.29.mp4",
      "url": "https://imach.s3.amazonaws.com/core-web-application/videos/simplescreenrecorder-2024-10-23_09.25.29.mp4"
    },
    "title": "Propaganda teste"
  },
  {
    "timestamp": "2025-09-06T10:16:59.769"
  }
]
```

### URL Handling

The system prioritizes local `source` URLs over S3 `url` URLs for better performance:

- **Source**: `/media/videos/video.mp4` → `http://localhost:8090/media/videos/video.mp4`
- **URL**: `https://imach.s3.amazonaws.com/...` → Used as fallback if source fails

### Fallback Videos

If the digital signage API fails or returns no videos, the system falls back to default videos:

```typescript
const defaultVideos: VideoItem[] = [
  {
    id: 'default-1',
    url: '/videos/default-1.mp4',
    title: 'Default Video 1',
    type: 'video'
  },
  {
    id: 'default-2',
    url: '/videos/default-2.mp4',
    title: 'Default Video 2',
    type: 'video'
  }
];
```

## User Interactions

### Controls

- **Click Video**: Toggle play/pause
- **Double-click Video**: Toggle fullscreen
- **Mouse Move**: Show controls temporarily
- **Mouse Leave**: Hide controls after timeout

### Touch Gestures

- **Tap**: Toggle play/pause
- **Double-tap**: Toggle fullscreen
- **Swipe**: Navigate between videos (if implemented)

## Styling

### CSS Custom Properties

```css
:root {
  --primary: #0081a7;
  --bittersweet: #e63946;
  --border: #e0e0e0;
  --text: #2C3E50;
  --fallback-bg: #fdfcdc;
}
```

### Responsive Design

The video player is fully responsive:

```css
/* Mobile optimizations */
@media (max-width: 768px) {
  .control-button {
    width: 56px;
    height: 56px;
    min-height: 44px;
    min-width: 44px;
  }
}

/* Small screens */
@media (max-width: 480px) {
  .video-title {
    font-size: 1rem;
  }
}
```

## Testing

### Unit Tests

Run the video player tests:

```bash
npm run test src/lib/services/__tests__/videoPlayer.test.ts
npm run test src/lib/services/__tests__/videoErrorHandler.test.ts
npm run test src/lib/components/ui/__tests__/VideoPlayer.test.ts
```

### Test Coverage

The test suite covers:

- Video loading and navigation
- Error handling scenarios
- User interactions
- URL normalization
- Auto-play functionality
- Accessibility features

## Troubleshooting

### Common Issues

1. **Videos Not Loading**
   - Check API endpoint configuration
   - Verify media file URLs
   - Check network connectivity

2. **404 Errors**
   - Ensure media files exist on server
   - Check URL normalization logic
   - Verify media base URL configuration

3. **Controls Not Showing**
   - Check CSS z-index values
   - Verify mouse event handlers
   - Test touch interactions on mobile

4. **Auto-play Not Working**
   - Check browser autoplay policies
   - Ensure videos are muted
   - Verify playsinline attribute

### Debug Mode

Enable debug logging:

```typescript
// In videoPlayer.ts
console.log('Video player state:', currentState);
console.log('Video URL:', videoUrl);
console.log('Error details:', error);
```

## Performance Optimization

### Best Practices

1. **Preload Strategy**: Use `preload="metadata"` for faster loading
2. **Video Formats**: Use MP4 with H.264 codec for best compatibility
3. **File Sizes**: Optimize video files for web delivery
4. **Caching**: Implement proper cache headers for media files

### Memory Management

```typescript
// Clean up on component destroy
onDestroy(() => {
  videoPlayerService.destroy();
});
```

## Browser Compatibility

### Supported Browsers

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

### Required Features

- HTML5 Video API
- ES6 Modules
- CSS Grid/Flexbox
- Fetch API

## Security Considerations

1. **Content Security Policy**: Ensure media URLs are allowed
2. **CORS**: Configure proper CORS headers for media files
3. **Authentication**: Implement proper authentication for media access
4. **File Validation**: Validate video file types and sizes

## Future Enhancements

1. **Playlist Management**: Allow custom video playlists
2. **Analytics**: Track video engagement metrics
3. **Adaptive Streaming**: Support for HLS/DASH
4. **Offline Support**: Cache videos for offline playback
5. **Gesture Controls**: Swipe gestures for navigation
6. **Picture-in-Picture**: Support for PiP mode
7. **Subtitles**: Support for video captions
8. **Quality Selection**: Allow users to choose video quality

## Conclusion

The Video Player System provides a robust, user-friendly solution for playing multiple videos in a loop with comprehensive error handling and seamless integration with the InoBag Sales V3 UI. The system is designed to be maintainable, testable, and extensible for future enhancements.
