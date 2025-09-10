<script>
  /**
   * @type {boolean}
   */
  export let show = false;

  /**
   * @type {number}
   */
  export let progressWidth = 100;
</script>

{#if show}
  <div class="timeout-progress-bar">
    <div class="progress-fill" style:width="{progressWidth}%"></div>
  </div>
{/if}

<style>
  /* Session Timeout Progress Bar */
  .timeout-progress-bar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: rgba(0, 0, 0, 0.1);
    z-index: 9999;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff6b6b, #ff8e53, #ff6b6b);
    background-size: 200% 100%;
    animation: progressShimmer 1s ease-in-out infinite;
    transition: width 0.1s linear;
  }

  @keyframes progressShimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
</style>