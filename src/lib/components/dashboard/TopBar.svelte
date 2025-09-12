<script lang="ts">
	import { currentUser } from '../../services/sessionManager.js';
	import ActionButton from './ActionButton.svelte';

	interface Props {
		onLogout: () => Promise<void>;
	}

	let { onLogout }: Props = $props();

	let loggingOut = $state(false);

	async function handleLogout() {
		loggingOut = true;
		try {
			await onLogout();
		} finally {
			loggingOut = false;
		}
	}
</script>

<div class="top-bar">
	<div class="user-info">
		{#if $currentUser}
			<span class="welcome">Bem-vindo, {$currentUser.username}</span>
		{/if}
	</div>
	
	<div class="actions">
		<ActionButton 
			variant="secondary" 
			size="sm" 
			loading={loggingOut}
			onclick={handleLogout}
		>
			{loggingOut ? 'Saindo...' : 'Sair'}
		</ActionButton>
	</div>
</div>

<style>
	.top-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		background-color: #f9fafb;
		border-bottom: 1px solid #e5e7eb;
		min-height: 4rem;
	}

	.user-info {
		display: flex;
		align-items: center;
	}

	.welcome {
		font-size: 1.125rem;
		font-weight: 500;
		color: #374151;
	}

	.actions {
		display: flex;
		gap: 1rem;
	}
</style>