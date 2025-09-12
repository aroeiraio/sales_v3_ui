<script lang="ts">
	import type { StockItem } from '../../types/dashboard.js';
	import ActionButton from './ActionButton.svelte';

	interface Props {
		items: StockItem[];
		onRestock: (item: StockItem) => void;
	}

	let { items, onRestock }: Props = $props();

	function formatPosition(shelf: string, coil: string): string {
		return `${shelf}${coil}`;
	}

	function formatDate(dateStr: string): string {
		if (!dateStr || dateStr === '') {
			return 'Não informado';
		}
		try {
			const date = new Date(dateStr);
			return date.toLocaleDateString('pt-BR');
		} catch {
			return 'Data inválida';
		}
	}

	function isExpired(dateStr: string): boolean {
		if (!dateStr || dateStr === '') return false;
		try {
			const expDate = new Date(dateStr);
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			return expDate < today;
		} catch {
			return false;
		}
	}

	function isExpiringSoon(dateStr: string): boolean {
		if (!dateStr || dateStr === '') return false;
		try {
			const expDate = new Date(dateStr);
			const today = new Date();
			const warningDate = new Date();
			warningDate.setDate(today.getDate() + 7); // 7 days warning
			return expDate <= warningDate && expDate >= today;
		} catch {
			return false;
		}
	}
</script>

<div class="stock-table-container">
	<table class="stock-table">
		<thead>
			<tr>
				<th>Posição</th>
				<th>Nome do Item</th>
				<th>Quantidade Atual</th>
				<th>Capacidade</th>
				<th>Data de Validade</th>
				<th>Ações</th>
			</tr>
		</thead>
		<tbody>
			{#each items as item (item.id)}
				<tr class:expired={isExpired(item.expiration)} class:expiring-soon={isExpiringSoon(item.expiration)}>
					<td class="position">{formatPosition(item.shelf, item.coil)}</td>
					<td class="item-name">
						{item.item_name}{item.item_variant_name ? ` (${item.item_variant_name})` : ''}
						{#if !item.expiration}
							<span class="warning-badge" title="Data de validade não informada">⚠️</span>
						{/if}
					</td>
					<td class="amount">{item.amount}</td>
					<td class="capacity">{item.capacity}</td>
					<td class="expiration" class:missing={!item.expiration} class:expired={isExpired(item.expiration)} class:expiring-soon={isExpiringSoon(item.expiration)}>
						{formatDate(item.expiration)}
						{#if isExpired(item.expiration)}
							<span class="status-badge expired">Vencido</span>
						{:else if isExpiringSoon(item.expiration)}
							<span class="status-badge expiring">Vence em breve</span>
						{/if}
					</td>
					<td class="actions">
						<ActionButton 
							variant="primary" 
							size="sm" 
							onclick={() => onRestock(item)}
						>
							Reabastecer
						</ActionButton>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
	
	{#if items.length === 0}
		<div class="empty-state">
			<p>Nenhum item de estoque encontrado</p>
		</div>
	{/if}
</div>

<style>
	.stock-table-container {
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.stock-table {
		width: 100%;
		border-collapse: collapse;
	}

	.stock-table th,
	.stock-table td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #e5e7eb;
	}

	.stock-table th {
		background-color: #f9fafb;
		font-weight: 600;
		color: #374151;
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stock-table td {
		color: #6b7280;
	}

	.position {
		font-family: monospace;
		font-weight: 600;
		color: #374151;
	}

	.item-name {
		font-weight: 500;
		color: #111827;
	}

	.amount,
	.capacity {
		font-family: monospace;
		text-align: center;
	}

	.expiration {
		font-family: monospace;
	}

	.actions {
		text-align: right;
	}

	.stock-table tbody tr:hover {
		background-color: #f9fafb;
	}

	.empty-state {
		padding: 2rem;
		text-align: center;
		color: #6b7280;
	}

	.empty-state p {
		margin: 0;
		font-size: 1.125rem;
	}

	/* Warning styles */
	.warning-badge {
		margin-left: 0.5rem;
		font-size: 1rem;
	}

	.status-badge {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-weight: 600;
		margin-left: 0.5rem;
		display: inline-block;
	}

	.status-badge.expired {
		background-color: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}

	.status-badge.expiring {
		background-color: #fffbeb;
		color: #d97706;
		border: 1px solid #fed7aa;
	}

	/* Row highlighting */
	.stock-table tbody tr.expired {
		background-color: #fef2f2;
	}

	.stock-table tbody tr.expiring-soon {
		background-color: #fffbeb;
	}

	.stock-table tbody tr.expired:hover {
		background-color: #fee2e2;
	}

	.stock-table tbody tr.expiring-soon:hover {
		background-color: #fef3c7;
	}

	/* Expiration date styling */
	.expiration.missing {
		color: #6b7280;
		font-style: italic;
	}

	.expiration.expired {
		color: #dc2626;
		font-weight: 600;
	}

	.expiration.expiring-soon {
		color: #d97706;
		font-weight: 600;
	}
</style>