<script lang="ts">
	interface Props {
		variant?: 'primary' | 'secondary' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		loading?: boolean;
		onclick?: () => void | Promise<void>;
		children: import('svelte').Snippet;
	}

	let { 
		variant = 'primary', 
		size = 'md', 
		disabled = false, 
		loading = false,
		onclick,
		children 
	}: Props = $props();

	async function handleClick() {
		if (disabled || loading || !onclick) return;
		await onclick();
	}
</script>

<button 
	class="action-button {variant} {size}"
	{disabled}
	class:loading
	onclick={handleClick}
>
	{#if loading}
		<div class="spinner"></div>
	{/if}
	{@render children()}
</button>

<style>
	.action-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-weight: 500;
		border-radius: 0.5rem;
		border: none;
		cursor: pointer;
		transition: all 0.2s;
		position: relative;
		text-align: center;
	}

	.action-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Variants */
	.primary {
		background-color: #3b82f6;
		color: white;
	}

	.primary:hover:not(:disabled) {
		background-color: #2563eb;
	}

	.secondary {
		background-color: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.secondary:hover:not(:disabled) {
		background-color: #e5e7eb;
	}

	.danger {
		background-color: #ef4444;
		color: white;
	}

	.danger:hover:not(:disabled) {
		background-color: #dc2626;
	}

	/* Sizes */
	.sm {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
	}

	.md {
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
	}

	.lg {
		padding: 1rem 2rem;
		font-size: 1.125rem;
	}

	.loading {
		pointer-events: none;
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
	}

	@keyframes spin {
		to {
			transform: translateX(-50%) rotate(360deg);
		}
	}
</style>