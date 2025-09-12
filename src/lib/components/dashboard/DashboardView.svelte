<script lang="ts">
	import { onMount } from 'svelte';
	import TopBar from './TopBar.svelte';
	import ActionButton from './ActionButton.svelte';
	import StockTable from './StockTable.svelte';
	import RestockDialog from './RestockDialog.svelte';
	import DispenserMonitor from './DispenserMonitor.svelte';
	import Toast from '../ui/Toast.svelte';
	import { authService } from '$lib/services/authService.js';
	import { dispenserService } from '$lib/services/dispenserService.js';
	import { stockService } from '$lib/services/stockService.js';
	import { sessionManager } from '$lib/services/sessionManager.js';
	import { errorHandler } from '$lib/services/errorHandler.js';
	import type { StockItem } from '$lib/types/dashboard.js';

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	let currentView = $state<'main' | 'stock' | 'test-motor' | 'monitor'>('main');
	let hatchLocked = $state(true); // Track hatch state
	let stockItems = $state<StockItem[]>([]);
	let selectedStockItem = $state<StockItem | null>(null);
	let showRestockDialog = $state(false);
	let loadingStock = $state(false);
	let actionLoading = $state<Record<string, boolean>>({});
	let motorTestMessages = $state<string[]>([]);

	async function handleLogout() {
		try {
			// Always perform logout API call first
			await authService.logout();
		} catch (error) {
			// Log the error but don't prevent logout flow
			errorHandler.handleError(
				error instanceof Error ? error : new Error('Falha no logout - você será desconectado localmente'),
				'Logout'
			);
		} finally {
			// Always clear session and return to start screen, regardless of API success
			sessionManager.endSession();
			onClose();
		}
	}

	async function handleAction(action: string, handler: () => Promise<void>) {
		actionLoading[action] = true;
		try {
			await handler();
		} catch (error) {
			const apiError = error as any;
			
			// Handle specific dispenser unavailable error
			if (apiError?.code === 'DISPENSER_UNAVAILABLE') {
				errorHandler.handleError(
					new Error('Controlador de hardware não disponível ou ocupado'),
					action
				);
			} else {
				errorHandler.handleError(
					error instanceof Error ? error : new Error(`${action} falhou`),
					action
				);
			}
		} finally {
			actionLoading[action] = false;
		}
	}

	async function handleOpenDoor() {
		await handleAction('Abrir Porta', () => 
			dispenserService.openDoor({ action: 'lock' })
		);
	}

	async function handleToggleHatch() {
		const newAction = hatchLocked ? 'unlock' : 'lock';
		const actionName = hatchLocked ? 'Destravar Portinhola' : 'Travar Portinhola';
		
		actionLoading[actionName] = true;
		try {
			await dispenserService.handleHatch({ action: newAction });
			// Only change state on successful operation
			hatchLocked = !hatchLocked;
		} catch (error) {
			const apiError = error as any;
			
			// Handle specific dispenser unavailable error
			if (apiError?.code === 'DISPENSER_UNAVAILABLE') {
				errorHandler.handleError(
					new Error('Controlador de hardware não disponível ou ocupado'),
					'Controle da Portinhola'
				);
			} else {
				errorHandler.handleError(
					error instanceof Error ? error : new Error('Falha ao controlar portinhola'),
					'Controle da Portinhola'
				);
			}
			// Don't change hatchLocked state on error
		} finally {
			actionLoading[actionName] = false;
		}
	}

	function handleShowTestMotor() {
		currentView = 'test-motor';
	}

	async function handleTestPosition(position: string) {
		// Clear previous messages when a new position is clicked
		motorTestMessages = [];
		
		// Convert position (e.g., "A1") to numeric ID (e.g., 1)
		const positionNumber = convertPositionToNumber(position);
		
		// Add initial message
		addMotorTestMessage(`🔧 Testando posição ${position} (ID: ${positionNumber})...`);
		
		try {
			actionLoading['Testar Motor'] = true;
			
			await dispenserService.testSlot({
				lift: false,
				order: 'asc',
				coils: [{ id: positionNumber, quantity: 1 }]
			});
			
			addMotorTestMessage(`✅ Teste da posição ${position} executado com sucesso`);
			addMotorTestMessage(`📡 Comando enviado para coil ID ${positionNumber}`);
			
		} catch (error) {
			const apiError = error as any;
			
			if (apiError?.code === 'DISPENSER_UNAVAILABLE') {
				addMotorTestMessage(`❌ Controlador de hardware não disponível ou ocupado`);
				errorHandler.handleError(
					new Error('Controlador de hardware não disponível ou ocupado'),
					'Testar Motor'
				);
			} else {
				addMotorTestMessage(`❌ Erro ao testar posição ${position}: ${apiError?.message || 'Erro desconhecido'}`);
				errorHandler.handleError(
					error instanceof Error ? error : new Error(`Teste da posição ${position} falhou`),
					'Testar Motor'
				);
			}
		} finally {
			actionLoading['Testar Motor'] = false;
		}
	}

	function addMotorTestMessage(message: string) {
		const timestamp = new Date().toLocaleTimeString('pt-BR');
		const timestampedMessage = `[${timestamp}] ${message}`;
		motorTestMessages = [...motorTestMessages, timestampedMessage];
	}

	function getMessageClass(message: string): string {
		if (message.includes('✅')) return 'message-success';
		if (message.includes('❌')) return 'message-error';
		if (message.includes('📡')) return 'message-info';
		return 'message-default';
	}

	// Convert position string (A1-F10) to numeric ID (1-60)
	function convertPositionToNumber(position: string): number {
		const letter = position[0]; // A, B, C, D, E, F
		const number = parseInt(position.slice(1)); // 1-10
		
		// A=0, B=1, C=2, D=3, E=4, F=5 (rows)
		const rowOffset = letter.charCodeAt(0) - 'A'.charCodeAt(0);
		
		// Calculate position: row * 10 + column
		// A1=1, A2=2, ..., A10=10, B1=11, B2=12, ..., F10=60
		return rowOffset * 10 + number;
	}

	async function handleStockManagement() {
		currentView = 'stock';
		await loadStock();
	}

	function handleDispenserMonitoring() {
		currentView = 'monitor';
	}

	// Generate position grid (A1-F10)
	function generatePositions(): string[] {
		const positions: string[] = [];
		const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
		for (const row of rows) {
			for (let col = 1; col <= 10; col++) {
				positions.push(`${row}${col}`);
			}
		}
		return positions;
	}

	async function loadStock() {
		console.log('📊 loadStock() called, current loadingStock state:', loadingStock);
		
		if (loadingStock) {
			console.log('⏸️ loadStock() already in progress, skipping...');
			return;
		}
		
		console.log('🔄 Starting stock load...');
		loadingStock = true;
		
		try {
			console.log('📡 Fetching stock data from stockService...');
			const allItems = await stockService.getStock();
			
			// Ensure reactivity by creating new array and clearing first
			stockItems = [];
			stockItems = allItems;
			
			// Log data validation info for debugging
			console.log(`✅ Stock loaded: ${stockItems.length} valid items`);
			const invalidExpiration = stockItems.filter(item => !item.expiration).length;
			if (invalidExpiration > 0) {
				console.log(`⚠️ ${invalidExpiration} items without expiration date`);
			}
		} catch (error) {
			console.error('❌ Error loading stock:', error);
			errorHandler.handleError(
				error instanceof Error ? error : new Error('Falha ao carregar estoque'),
				'Gestão de Estoque'
			);
		} finally {
			console.log('🏁 Stock loading finished, setting loadingStock = false');
			loadingStock = false;
		}
	}

	function handleRestockItem(item: StockItem) {
		selectedStockItem = item;
		showRestockDialog = true;
	}

	async function handleRestockSubmit(itemId: string, amount: number, expirationDate: string) {
		console.log('🔧 Starting restock submit...', { itemId, amount, expirationDate });
		
		try {
			console.log('📡 Calling stockService.updateStock...');
			await stockService.updateStock({
				id: parseInt(itemId),
				amount,
				expiration_date: expirationDate
			});
			
			console.log('✅ Stock update successful! Setting up auto-refresh...');
			
			// Refresh stock data after 2 seconds by calling loadStock (same as Atualizar button)
			console.log('⏰ Scheduling auto-refresh in 2 seconds...');
			const timeoutId = setTimeout(async () => {
				console.log('🔄 Auto-refreshing stock data (same as Atualizar button)...');
				await loadStock(); // Call the same function as button onclick
				console.log('✅ Auto-refresh completed');
			}, 2000);
			
			console.log('✅ Auto-refresh scheduled with timeout ID:', timeoutId);
			
		} catch (error) {
			console.error('❌ Restock failed with error:', error);
			errorHandler.handleError(
				error instanceof Error ? error : new Error('Failed to update stock'),
				'Restock'
			);
			throw error; // Re-throw to keep dialog open on error
		}
	}

	function closeRestockDialog() {
		showRestockDialog = false;
		selectedStockItem = null;
	}

	function backToMain() {
		currentView = 'main';
		stockItems = [];
	}

	onMount(() => {
		// Component is ready
	});
</script>

<div class="dashboard-container" data-dashboard-active>
	<TopBar onLogout={handleLogout} />
	
	<main class="dashboard-content">
		{#if currentView === 'main'}
			<div class="main-dashboard">
				<div class="dashboard-header">
					<h1>Painel de Controle</h1>
					<p>Selecione uma ação para controlar a máquina de vendas</p>
				</div>
				
				<div class="action-grid">
					<div class="action-card">
						<div class="action-icon">🚪</div>
						<h3>Controle da Porta</h3>
						<p>Abrir a porta principal</p>
						<ActionButton 
							variant="primary"
							loading={actionLoading['Abrir Porta']}
							onclick={handleOpenDoor}
						>
							{actionLoading['Abrir Porta'] ? 'Abrindo...' : 'Abrir Porta'}
						</ActionButton>
					</div>
					
					<div class="action-card">
						<div class="action-icon">{hatchLocked ? '🔒' : '🔓'}</div>
						<h3>Controle da Portinhola</h3>
						<p>{hatchLocked ? 'Destravar a portinhola de serviço' : 'Travar a portinhola de serviço'}</p>
						<ActionButton 
							variant="secondary"
							loading={actionLoading['Destravar Portinhola'] || actionLoading['Travar Portinhola']}
							onclick={handleToggleHatch}
						>
							{actionLoading['Destravar Portinhola'] || actionLoading['Travar Portinhola'] 
								? (hatchLocked ? 'Destravando...' : 'Travando...') 
								: (hatchLocked ? 'Destravar' : 'Travar')}
						</ActionButton>
					</div>
					
					<div class="action-card">
						<div class="action-icon">⚙️</div>
						<h3>Testar Motor</h3>
						<p>Testar funcionamento do motor por posição</p>
						<ActionButton 
							variant="secondary"
							onclick={handleShowTestMotor}
						>
							Selecionar Posição
						</ActionButton>
					</div>
					
					<div class="action-card">
						<div class="action-icon">📦</div>
						<h3>Gestão de Estoque</h3>
						<p>Visualizar e gerenciar inventário</p>
						<ActionButton 
							variant="primary"
							onclick={handleStockManagement}
						>
							Gerenciar Estoque
						</ActionButton>
					</div>

					<div class="action-card">
						<div class="action-icon">📡</div>
						<h3>Monitor de Dispensers</h3>
						<p>Monitoramento em tempo real dos dispositivos</p>
						<ActionButton 
							variant="secondary"
							onclick={handleDispenserMonitoring}
						>
							Visualizar Monitor
						</ActionButton>
					</div>
				</div>
			</div>
		{:else if currentView === 'stock'}
			<div class="stock-dashboard">
				<div class="dashboard-header">
					<div class="header-actions">
						<ActionButton variant="secondary" onclick={backToMain}>
							← Voltar ao Painel
						</ActionButton>
						<ActionButton 
							variant="secondary" 
							loading={loadingStock}
							onclick={loadStock}
						>
							{loadingStock ? 'Atualizando...' : 'Atualizar'}
						</ActionButton>
					</div>
					<h1>Gestão de Estoque</h1>
					<p>Inventário atual e operações de reabastecimento</p>
				</div>
				
				{#if loadingStock}
					<div class="loading-state">
						<div class="spinner"></div>
						<p>Carregando dados do estoque...</p>
					</div>
				{:else}
					<StockTable 
						items={stockItems} 
						onRestock={handleRestockItem} 
					/>
				{/if}
			</div>
		{:else if currentView === 'test-motor'}
			<div class="test-motor-dashboard">
				<div class="dashboard-header">
					<div class="header-actions">
						<ActionButton variant="secondary" onclick={backToMain}>
							← Voltar ao Painel
						</ActionButton>
					</div>
					<h1>Testar Motor</h1>
					<p>Selecione a posição para testar o funcionamento do motor</p>
				</div>
				
				<div class="test-motor-content">
					<div class="position-section">
						<div class="position-grid">
							{#each generatePositions() as position}
								<button 
									class="position-button"
									onclick={() => handleTestPosition(position)}
									disabled={actionLoading['Testar Motor']}
								>
									{position}
								</button>
							{/each}
						</div>
						
						{#if actionLoading['Testar Motor']}
							<div class="loading-state">
								<div class="spinner"></div>
								<p>Testando motor...</p>
							</div>
						{/if}
					</div>

					<div class="messages-section">
						<div class="messages-header">
							<h3>📄 Log de Mensagens</h3>
							{#if motorTestMessages.length > 0}
								<button 
									class="clear-messages-btn"
									onclick={() => motorTestMessages = []}
								>
									Limpar
								</button>
							{/if}
						</div>
						
						<div class="messages-container">
							{#if motorTestMessages.length === 0}
								<div class="no-messages">
									<p>Nenhuma mensagem ainda. Clique em uma posição para testar o motor.</p>
								</div>
							{:else}
								{#each motorTestMessages as message, index (index)}
									<div class="message-item {getMessageClass(message)}">
										{message}
									</div>
								{/each}
							{/if}
						</div>
					</div>
				</div>
			</div>
		{:else if currentView === 'monitor'}
			<div class="monitor-dashboard">
				<div class="dashboard-header">
					<div class="header-actions">
						<ActionButton variant="secondary" onclick={backToMain}>
							← Voltar ao Painel
						</ActionButton>
					</div>
					<h1>Monitor de Dispensers</h1>
					<p>Monitoramento em tempo real dos eventos dos dispositivos</p>
				</div>
				
				<div class="monitor-content">
					<DispenserMonitor />
				</div>
			</div>
		{/if}
	</main>
</div>

<RestockDialog
	item={selectedStockItem}
	open={showRestockDialog}
	onClose={closeRestockDialog}
	onRestock={handleRestockSubmit}
/>

<Toast />

<style>
	.dashboard-container {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1000;
		background-color: #f9fafb;
		display: flex;
		flex-direction: column;
		overflow: auto;
	}

	.dashboard-content {
		flex: 1;
		padding: 2rem;
	}

	.main-dashboard,
	.stock-dashboard,
	.test-motor-dashboard,
	.monitor-dashboard {
		max-width: 1200px;
		margin: 0 auto;
	}

	.dashboard-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.dashboard-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		color: #111827;
		margin: 0 0 0.5rem 0;
	}

	.dashboard-header p {
		font-size: 1.125rem;
		color: #6b7280;
		margin: 0;
	}

	.header-actions {
		display: flex;
		justify-content: space-between;
		margin-bottom: 2rem;
	}

	.action-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 2rem;
		margin-top: 2rem;
	}

	.action-card {
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		text-align: center;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.action-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
	}

	.action-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.action-card h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.5rem 0;
	}

	.action-card p {
		color: #6b7280;
		margin: 0 0 1.5rem 0;
		line-height: 1.5;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		color: #6b7280;
	}

	.spinner {
		width: 2rem;
		height: 2rem;
		border: 3px solid #e5e7eb;
		border-top: 3px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.position-grid {
		display: grid;
		grid-template-columns: repeat(10, 1fr);
		gap: 1rem;
		max-width: 800px;
		margin: 2rem auto;
	}

	.position-button {
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: #374151;
		cursor: pointer;
		transition: all 0.2s;
		min-height: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.position-button:hover:not(:disabled) {
		background-color: #3b82f6;
		color: white;
		border-color: #3b82f6;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	}

	.position-button:active {
		transform: translateY(0);
	}

	.position-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	@media (max-width: 768px) {
		.dashboard-content {
			padding: 1rem;
		}

		.dashboard-header h1 {
			font-size: 2rem;
		}

		.action-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.action-card {
			padding: 1.5rem;
		}

		.header-actions {
			flex-direction: column;
			gap: 1rem;
		}

		.position-grid {
			grid-template-columns: repeat(5, 1fr);
			gap: 0.5rem;
			margin: 1rem;
		}

		.position-button {
			padding: 0.75rem;
			font-size: 0.875rem;
			min-height: 50px;
		}

		.test-motor-content {
			gap: 1rem;
		}

		.messages-section {
			max-height: 300px;
		}

		.messages-container {
			max-height: 200px;
		}
	}

	/* Optimizations for 800x1280 resolution (portrait tablet) */
	@media (max-width: 900px) and (min-width: 700px) and (min-height: 1200px) {
		.dashboard-content {
			padding: 1.5rem;
		}

		.position-grid {
			grid-template-columns: repeat(10, 1fr);
			gap: 0.75rem;
			max-width: 750px;
		}

		.position-button {
			padding: 0.875rem;
			font-size: 0.9rem;
			min-height: 55px;
		}

		.messages-section {
			max-height: 350px;
		}

		.messages-container {
			max-height: 250px;
		}

		.action-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 1.5rem;
		}

		.action-card {
			padding: 1.75rem;
		}
	}

	.monitor-content {
		background: white;
		border-radius: 1rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		min-height: 500px;
	}

	.test-motor-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		margin-top: 2rem;
	}

	.position-section {
		display: flex;
		flex-direction: column;
	}

	.messages-section {
		background: white;
		border-radius: 1rem;
		border: 1px solid #e5e7eb;
		overflow: hidden;
		height: fit-content;
		max-height: 400px;
		width: 100%;
	}

	.messages-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		background-color: #f9fafb;
		border-bottom: 1px solid #e5e7eb;
	}

	.messages-header h3 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #374151;
	}

	.clear-messages-btn {
		background-color: #ef4444;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.clear-messages-btn:hover {
		background-color: #dc2626;
	}

	.messages-container {
		max-height: 300px;
		overflow-y: auto;
		padding: 1rem;
	}

	.no-messages {
		text-align: center;
		padding: 2rem;
		color: #6b7280;
	}

	.no-messages p {
		margin: 0;
		font-style: italic;
	}

	.message-item {
		padding: 0.75rem 1rem;
		margin-bottom: 0.5rem;
		border-radius: 0.5rem;
		font-family: 'Courier New', monospace;
		font-size: 0.875rem;
		line-height: 1.4;
		white-space: pre-wrap;
		word-break: break-all;
	}

	.message-item:last-child {
		margin-bottom: 0;
	}

	.message-default {
		background-color: #f3f4f6;
		border-left: 4px solid #3b82f6;
	}

	.message-success {
		border-left: 4px solid #10b981;
		background-color: #ecfdf5;
	}

	.message-error {
		border-left: 4px solid #ef4444;
		background-color: #fef2f2;
	}

	.message-info {
		border-left: 4px solid #8b5cf6;
		background-color: #f5f3ff;
	}

</style>