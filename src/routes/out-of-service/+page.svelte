<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import OutOfServiceScreen from '$lib/components/screens/OutOfServiceScreen.svelte';

	let reasons: string[] = [];

	onMount(() => {
		// Get reasons from URL search params
		const urlParams = new URLSearchParams($page.url.search);
		const reasonsParam = urlParams.get('reasons');
		
		if (reasonsParam) {
			try {
				reasons = JSON.parse(decodeURIComponent(reasonsParam));
			} catch (error) {
				console.error('Error parsing reasons from URL:', error);
				reasons = ['Serviço temporariamente indisponível'];
			}
		} else {
			reasons = ['Serviço temporariamente indisponível'];
		}
	});
</script>

<OutOfServiceScreen {reasons} />