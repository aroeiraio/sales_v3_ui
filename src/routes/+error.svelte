<script lang="ts">
  import { page } from '$app/stores';
</script>

<div class="error-container">
  <div class="error-card">
    <h1 class="status-code">{$page.status}</h1>
    <p class="message">{$page.error?.message}</p>
    <a href="/" class="home-link">Go to Homepage</a>
  </div>
</div>

<style>
  .error-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f8f9fa;
    font-family: sans-serif;
  }
  .error-card {
    text-align: center;
    padding: 2rem 4rem;
    border-radius: 0.5rem;
    background-color: white;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  .status-code {
    font-size: 6rem;
    font-weight: bold;
    color: #dc3545;
    margin: 0;
  }
  .message {
    font-size: 1.5rem;
    color: #6c757d;
    margin: 1rem 0;
  }
  .home-link {
    display: inline-block;
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    border-radius: 0.25rem;
    background-color: #007bff;
    color: white;
    text-decoration: none;
    transition: background-color 0.2s;
  }
  .home-link:hover {
    background-color: #0056b3;
  }
</style>
