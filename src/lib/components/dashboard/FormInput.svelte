<script lang="ts">
	interface Props {
		label: string;
		type: string;
		value: string;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
	}

	let { label, type, value = $bindable(), placeholder = '', required = false, disabled = false }: Props = $props();
</script>

<div class="form-input-group">
	<label for={label.toLowerCase()} class="form-label">
		{label}
		{#if required}
			<span class="required">*</span>
		{/if}
	</label>
	<input
		id={label.toLowerCase()}
		{type}
		bind:value
		{placeholder}
		{required}
		{disabled}
		class="form-input"
		class:error={required && !value}
	/>
</div>

<style>
	.form-input-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.form-label {
		font-size: 1rem;
		font-weight: 500;
		color: #374151;
	}

	.required {
		color: #ef4444;
	}

	.form-input {
		padding: 0.75rem;
		border: 2px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	.form-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-input.error {
		border-color: #ef4444;
	}

	.form-input:disabled {
		background-color: #f3f4f6;
		color: #6b7280;
		cursor: not-allowed;
	}
</style>