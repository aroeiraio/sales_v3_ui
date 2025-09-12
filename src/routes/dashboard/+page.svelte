<script lang="ts">
  import DispenserMonitor from '../../lib/components/dashboard/DispenserMonitor.svelte';
  import Toast from '../../lib/components/ui/Toast.svelte';
</script>

<svelte:head>
  <title>Dashboard - Monitor de Dispensers</title>
</svelte:head>

<main class="dashboard-page">
  <DispenserMonitor />
  <Toast />
</main>

<style>
  .dashboard-page {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--background, #ffffff);
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
</style>