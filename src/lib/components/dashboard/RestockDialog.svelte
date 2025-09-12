<script lang="ts">
	import type { StockItem } from '../../types/dashboard.js';
	import FormInput from './FormInput.svelte';
	import ActionButton from './ActionButton.svelte';

	interface Props {
		item: StockItem | null;
		open: boolean;
		onClose: () => void;
		onRestock: (itemId: string, amount: number, expirationDate: string) => Promise<void>;
	}

	let { item, open, onClose, onRestock }: Props = $props();

	let amount = $state('');
	let expirationDate = $state('');
	let submitting = $state(false);
	let errors = $state<Record<string, string>>({});

	// Reset form when dialog opens
	$effect(() => {
		if (open && item) {
			amount = item.amount;
			// Handle empty expiration dates
			expirationDate = item.expiration || '';
			errors = {};
		}
	});

	function validateForm(): boolean {
		const newErrors: Record<string, string> = {};
		
		const numAmount = parseInt(amount);
		const numCapacity = parseInt(item?.capacity || '0');
		
		if (!amount || numAmount < 0) {
			newErrors.amount = 'Quantidade deve ser um número positivo';
		} else if (numAmount > numCapacity) {
			newErrors.amount = `Quantidade não pode exceder a capacidade (${numCapacity})`;
		}
		
		if (!expirationDate) {
			newErrors.expirationDate = 'Data de validade é obrigatória';
		} else {
			const selectedDate = new Date(expirationDate);
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			
			if (selectedDate < today) {
				newErrors.expirationDate = 'Data de validade deve ser hoje ou posterior';
			}
		}
		
		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	async function handleSubmit() {
		if (!item || !validateForm()) return;
		
		submitting = true;
		try {
			await onRestock(item.id, parseInt(amount), expirationDate);
			onClose();
		} finally {
			submitting = false;
		}
	}

	function handleCancel() {
		onClose();
	}

	function changeQuantity(delta: number) {
		const currentAmount = parseInt(amount) || 0;
		const newAmount = Math.max(0, Math.min(currentAmount + delta, parseInt(item?.capacity || '0')));
		amount = newAmount.toString();
		
		// Clear any existing amount errors when user interacts
		if (errors.amount) {
			errors = { ...errors, amount: '' };
		}
	}

	// Close on Escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}
</script>

{#if open && item}
	<div class="dialog-overlay" onclick={handleCancel} onkeydown={handleKeydown} tabindex="-1">
		<div class="dialog" onclick={(e) => e.stopPropagation()}>
			<div class="dialog-header">
				<h2>Reabastecer Item</h2>
				<button class="close-button" onclick={handleCancel} aria-label="Close dialog">×</button>
			</div>
			
			<div class="dialog-content">
				<div class="item-info">
					<p><strong>Item:</strong> {item.item_name}{item.item_variant_name ? ` (${item.item_variant_name})` : ''}</p>
					<p><strong>Posição:</strong> {item.shelf}{item.coil}</p>
					<p><strong>Quantidade Atual:</strong> {item.amount}</p>
					<p><strong>Capacidade:</strong> {item.capacity}</p>
					<p><strong>Validade Atual:</strong> 
						{#if item.expiration}
							{new Date(item.expiration).toLocaleDateString('pt-BR')}
						{:else}
							<span class="no-expiration">Não informada</span>
						{/if}
					</p>
				</div>
				
				<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
					<div class="quantity-field">
						<label class="quantity-label">Nova Quantidade</label>
						<div class="quantity-control">
							<button 
								type="button"
								class="quantity-btn decrease"
								onclick={() => changeQuantity(-1)}
								disabled={parseInt(amount) <= 0}
								aria-label="Diminuir quantidade"
							>
								<span class="quantity-btn-icon">−</span>
							</button>
							
							<div class="quantity-display">
								<input
									type="number"
									class="quantity-input"
									bind:value={amount}
									min="0"
									max={item?.capacity || 999}
									step="1"
									readonly
								/>
								<span class="quantity-unit">unidades</span>
							</div>
							
							<button 
								type="button"
								class="quantity-btn increase"
								onclick={() => changeQuantity(1)}
								disabled={parseInt(amount) >= parseInt(item?.capacity || '0')}
								aria-label="Aumentar quantidade"
							>
								<span class="quantity-btn-icon">+</span>
							</button>
						</div>
						<div class="quantity-info">
							<span class="capacity-info">Capacidade máxima: {item?.capacity || 0} unidades</span>
						</div>
					</div>
					{#if errors.amount}
						<div class="error-message">{errors.amount}</div>
					{/if}
					
					<FormInput
						label="Data de Validade"
						type="date"
						bind:value={expirationDate}
						required
					/>
					{#if errors.expirationDate}
						<div class="error-message">{errors.expirationDate}</div>
					{/if}
				</form>
			</div>
			
			<div class="dialog-actions">
				<ActionButton 
					variant="secondary" 
					onclick={handleCancel}
					disabled={submitting}
				>
					Cancelar
				</ActionButton>
				<ActionButton 
					variant="primary" 
					onclick={handleSubmit}
					loading={submitting}
				>
					{submitting ? 'Reabastecendo...' : 'Reabastecer'}
				</ActionButton>
			</div>
		</div>
	</div>
{/if}

<style>
	.dialog-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.dialog {
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.dialog-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.dialog-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #6b7280;
		padding: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.25rem;
	}

	.close-button:hover {
		background-color: #f3f4f6;
		color: #374151;
	}

	.dialog-content {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
	}

	.item-info {
		background-color: #f9fafb;
		padding: 1rem;
		border-radius: 0.375rem;
		margin-bottom: 1.5rem;
	}

	.item-info p {
		margin: 0.25rem 0;
		color: #374151;
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1.5rem;
		border-top: 1px solid #e5e7eb;
		background-color: #f9fafb;
	}

	.error-message {
		color: #ef4444;
		font-size: 0.875rem;
		margin-top: -0.5rem;
		margin-bottom: 1rem;
	}

	.no-expiration {
		color: #6b7280;
		font-style: italic;
	}

	/* Touch-friendly quantity controls */
	.quantity-field {
		margin-bottom: 1.5rem;
	}

	.quantity-label {
		display: block;
		margin-bottom: 0.75rem;
		color: #374151;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.quantity-control {
		display: flex;
		align-items: center;
		border: 2px solid #e5e7eb;
		border-radius: 0.75rem;
		background: white;
		overflow: hidden;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}

	.quantity-btn {
		background: #3b82f6;
		border: none;
		color: white;
		width: 3.5rem;
		height: 3.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 1.25rem;
		font-weight: 700;
		user-select: none;
		touch-action: manipulation;
	}

	.quantity-btn:hover:not(:disabled) {
		background: #2563eb;
		transform: scale(1.05);
	}

	.quantity-btn:active:not(:disabled) {
		transform: scale(0.95);
		background: #1d4ed8;
	}

	.quantity-btn:disabled {
		background: #d1d5db;
		cursor: not-allowed;
		transform: none;
		opacity: 0.5;
	}

	.quantity-btn.decrease {
		border-radius: 0;
	}

	.quantity-btn.increase {
		border-radius: 0;
	}

	.quantity-btn-icon {
		font-size: 1.75rem;
		line-height: 1;
	}

	.quantity-display {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.75rem 1rem;
		background: #f9fafb;
	}

	.quantity-input {
		border: none;
		background: transparent;
		text-align: center;
		font-size: 2rem;
		font-weight: 700;
		color: #111827;
		width: 100%;
		outline: none;
		font-family: monospace;
		cursor: default;
	}

	.quantity-input::-webkit-outer-spin-button,
	.quantity-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.quantity-input[type=number] {
		-moz-appearance: textfield;
	}

	.quantity-unit {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: 500;
		margin-top: -0.25rem;
	}

	.quantity-info {
		margin-top: 0.5rem;
		text-align: center;
	}

	.capacity-info {
		font-size: 0.75rem;
		color: #6b7280;
		background: #f3f4f6;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		display: inline-block;
	}

	@media (max-width: 480px) {
		.quantity-btn {
			width: 3rem;
			height: 3rem;
		}

		.quantity-btn-icon {
			font-size: 1.5rem;
		}

		.quantity-input {
			font-size: 1.75rem;
		}
	}
</style>