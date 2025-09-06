<script lang="ts">
  import { onMount } from 'svelte';
  import { normalizeUrl } from '$lib/utils/urlNormalizer';
  import { digitalSignageService } from '$lib/services/digitalSignage';

  let testResults: any[] = [];
  let apiResults: any = null;

  onMount(async () => {
    // Test URL normalization
    const testUrls = [
      'http://localhost:8051/media/videos/simplescreenrecorder-2024-10-23_09.25.29.mp4',
      '/media/videos/simplescreenrecorder-2024-10-23_09.25.29.mp4',
      'https://imach.s3.amazonaws.com/core-web-application/videos/video.mp4',
      'media/videos/video.mp4'
    ];

    testResults = testUrls.map(url => ({
      input: url,
      output: normalizeUrl(url)
    }));

    // Test API response
    try {
      const digitalSignage = await digitalSignageService.getDigitalSignage();
      apiResults = digitalSignage;
    } catch (error) {
      console.error('API test failed:', error);
      apiResults = { error: error.message };
    }
  });
</script>

<div class="url-test-page">
  <header class="test-header">
    <h1>URL Normalization Test</h1>
  </header>

  <div class="content">
    <!-- URL Normalization Tests -->
    <section class="test-section">
      <h2>URL Normalization Tests</h2>
      <div class="test-results">
        {#each testResults as result}
          <div class="test-item">
            <div class="input">
              <strong>Input:</strong>
              <code>{result.input}</code>
            </div>
            <div class="output">
              <strong>Output:</strong>
              <code>{result.output}</code>
            </div>
            <div class="status">
              <strong>Status:</strong>
              <span class:success={result.output.includes('localhost:8090')}>
                {result.output.includes('localhost:8090') ? '✅ Normalized' : '❌ Not Normalized'}
              </span>
            </div>
          </div>
        {/each}
      </div>
    </section>

    <!-- API Response Test -->
    <section class="test-section">
      <h2>Digital Signage API Test</h2>
      {#if apiResults}
        <div class="api-results">
          {#if apiResults.error}
            <div class="error">
              <strong>Error:</strong> {apiResults.error}
            </div>
          {:else}
            <div class="api-data">
              <h3>Raw API Response:</h3>
              <pre>{JSON.stringify(apiResults, null, 2)}</pre>
              
              {#if apiResults.items?.length > 0}
                <h3>Video URLs:</h3>
                {#each apiResults.items as item}
                  <div class="video-item">
                    <h4>{item.title}</h4>
                    <p><strong>Source:</strong> <code>{item.media.source}</code></p>
                    <p><strong>URL:</strong> <code>{item.media.url}</code></p>
                    <p><strong>Filename:</strong> {item.media.filename}</p>
                  </div>
                {/each}
              {/if}
            </div>
          {/if}
        </div>
      {:else}
        <div class="loading">Loading API data...</div>
      {/if}
    </section>
  </div>
</div>

<style>
  .url-test-page {
    min-height: 100vh;
    background: #f5f5f5;
    font-family: Arial, sans-serif;
  }

  .test-header {
    background: #333;
    color: white;
    padding: 1rem 2rem;
  }

  .test-header h1 {
    margin: 0;
  }

  .content {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .test-section {
    background: white;
    margin-bottom: 2rem;
    padding: 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .test-section h2 {
    margin-top: 0;
    color: #333;
    border-bottom: 2px solid #007bff;
    padding-bottom: 0.5rem;
  }

  .test-results {
    display: grid;
    gap: 1rem;
  }

  .test-item {
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 0.25rem;
    border-left: 4px solid #007bff;
  }

  .test-item .input,
  .test-item .output,
  .test-item .status {
    margin: 0.5rem 0;
  }

  .test-item strong {
    display: block;
    margin-bottom: 0.25rem;
    color: #333;
  }

  .test-item code {
    background: #e9ecef;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-family: monospace;
    word-break: break-all;
    display: block;
    margin-top: 0.25rem;
  }

  .success {
    color: #28a745;
    font-weight: bold;
  }

  .success:not(.success) {
    color: #dc3545;
    font-weight: bold;
  }

  .api-results {
    margin-top: 1rem;
  }

  .error {
    padding: 1rem;
    background: #f8d7da;
    color: #721c24;
    border-radius: 0.25rem;
    border: 1px solid #f5c6cb;
  }

  .api-data {
    margin-top: 1rem;
  }

  .api-data h3 {
    color: #333;
    margin-top: 1rem;
  }

  .api-data pre {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 0.25rem;
    overflow-x: auto;
    font-size: 0.8rem;
    border: 1px solid #dee2e6;
  }

  .video-item {
    margin: 1rem 0;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 0.25rem;
    border-left: 4px solid #28a745;
  }

  .video-item h4 {
    margin-top: 0;
    color: #333;
  }

  .video-item p {
    margin: 0.25rem 0;
    font-size: 0.9rem;
  }

  .video-item code {
    background: #e9ecef;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-family: monospace;
    word-break: break-all;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: #666;
  }
</style>
