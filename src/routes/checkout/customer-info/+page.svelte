<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { ArrowLeft, User, Mail, FileText, CheckCircle, AlertCircle, ArrowRight, HelpCircle } from 'lucide-svelte';
	import { isValidCPF, isValidEmail } from '$lib/utils/validation';
	import { apiClient } from '$lib/services/api';
	import { cartService } from '$lib/services/cart';
	import { sessionService } from '$lib/services/session';
	import VirtualKeyboard from '$lib/components/ui/VirtualKeyboard.svelte';

	let cpf = $state('');
	let email = $state('');
	let cpfError = $state('');
	let emailError = $state('');
	let isSubmitting = $state(false);
	let isVirtualKeyboardOpen = $state(false);
	let activeField = $state<'cpf' | 'email' | null>(null);
	let keyboardValue = $state('');
	let isNumericMode = $state(false);
	let currentTime = $state('');
	let cart = { items: [], total: 0, subtotal: 0, serviceFee: 0, discount: 0 };
	
	// Session timeout handling
	let sessionTimeoutId: NodeJS.Timeout | null = null;
	let progressIntervalId: NodeJS.Timeout | null = null;
	let sessionStartTime = 0;
	let showTimeoutDialog = $state(false);
	let showProgressBar = $state(false);
	let progressWidth = $state(100);
	const SESSION_TIMEOUT = 60000; // 60 seconds
	const PROGRESS_THRESHOLD = 11000; // Show dialog when less than 11 seconds remain

	onMount(async () => {
		try {
			// Load cart data
			const cartData = await cartService.getCart();
			cart = {
				items: cartData.items || [],
				total: cartData.total || 0,
				subtotal: cartData.subtotal || cartData.total || 0,
				serviceFee: cartData.serviceFee || 0,
				discount: cartData.discount || 0
			};

			// Check if cart is empty
			if (!cart.items || cart.items.length === 0) {
				window.location.href = '/';
				return;
			}
		} catch (error) {
			console.error('Error loading cart:', error);
			window.location.href = '/';
		}

		// Update time every second
		function updateTime() {
			const now = new Date();
			currentTime = now.toLocaleTimeString('pt-BR');
		}
		updateTime();
		const timeInterval = setInterval(updateTime, 1000);

		// Start session timeout
		startSessionTimeout();

		return () => {
			clearInterval(timeInterval);
			if (sessionTimeoutId) {
				clearTimeout(sessionTimeoutId);
			}
			if (progressIntervalId) {
				clearInterval(progressIntervalId);
			}
		};
	});

	onDestroy(() => {
		if (sessionTimeoutId) {
			clearTimeout(sessionTimeoutId);
		}
		if (progressIntervalId) {
			clearInterval(progressIntervalId);
		}
	});

	function goBack() {
		window.location.href = '/cart';
	}

	// Reset timeout on any user interaction
	function handleUserInteraction() {
		sessionService.resetTimeout();
		resetSessionTimeout();
	}

	function startSessionTimeout() {
		if (sessionTimeoutId) {
			clearTimeout(sessionTimeoutId);
		}
		if (progressIntervalId) {
			clearInterval(progressIntervalId);
		}
		
		sessionStartTime = Date.now();
		showTimeoutDialog = false;
		showProgressBar = false;
		progressWidth = 100;
		
		sessionTimeoutId = setTimeout(() => {
			console.log('Session timeout reached, ending session');
			sessionService.endSession();
			window.location.href = '/';
		}, SESSION_TIMEOUT);
		
		// Start progress monitoring
		startProgressMonitoring();
	}

	function startProgressMonitoring() {
		progressIntervalId = setInterval(() => {
			const elapsed = Date.now() - sessionStartTime;
			const remaining = SESSION_TIMEOUT - elapsed;
			
			if (remaining <= PROGRESS_THRESHOLD) {
				if (!showProgressBar) {
					showProgressBar = true;
				}
				if (!showTimeoutDialog) {
					showTimeoutDialog = true;
				}
				// Calculate progress width (100% to 0% over the last 11 seconds)
				progressWidth = Math.max(0, (remaining / PROGRESS_THRESHOLD) * 100);
			} else {
				showProgressBar = false;
				showTimeoutDialog = false;
				progressWidth = 100;
			}
		}, 100); // Update every 100ms for smooth animation
	}

	function resetSessionTimeout() {
		startSessionTimeout();
	}

	function continueSession() {
		showTimeoutDialog = false;
		resetSessionTimeout();
	}

	function validateCPF() {
		cpfError = '';
		if (cpf && !isValidCPF(cpf)) {
			cpfError = 'CPF inválido';
		}
	}

	function validateEmail() {
		emailError = '';
		if (email && !isValidEmail(email)) {
			emailError = 'E-mail inválido';
		}
	}

	function formatCPFInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = target.value.replace(/\D/g, '');
		if (value.length <= 11) {
			cpf = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
		}
		validateCPF();
	}

	async function submitWithInvoice() {
		if (isSubmitting) return;

		// Validate inputs
		validateCPF();
		validateEmail();

		if (cpfError || emailError) {
			return;
		}

		if (!cpf || !email) {
			if (!cpf) cpfError = 'CPF é obrigatório';
			if (!email) emailError = 'E-mail é obrigatório';
			return;
		}

		isSubmitting = true;

		try {
			// Send data to API
			await apiClient.post('/extradata', {
				cpf: cpf.replace(/\D/g, ''), // Send only numbers
				email: email
			});

			// Navigate to payment method selection
			window.location.href = '/payment/method-selection';
		} catch (error) {
			console.error('Error submitting customer data:', error);
			// Still proceed to payment even if API fails
			window.location.href = '/payment/method-selection';
		} finally {
			isSubmitting = false;
		}
	}

	async function continueWithoutInvoice() {
		if (isSubmitting) return;

		isSubmitting = true;

		try {
			// Navigate to payment method selection
			window.location.href = '/payment/method-selection';
		} catch (error) {
			console.error('Error continuing without invoice:', error);
			window.location.href = '/payment/method-selection';
		} finally {
			isSubmitting = false;
		}
	}

	function showToast(message: string, duration: number = 3000): void {
		// Create toast element
		const toast = document.createElement('div');
		toast.className = 'toast-notification';
		toast.textContent = message;
		toast.style.cssText = `
			position: fixed;
			top: 80px;
			right: 20px;
			background: #10B981;
			color: white;
			padding: 1rem 1.5rem;
			border-radius: 8px;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
			z-index: 10001;
			font-weight: 600;
			font-size: 16px;
			max-width: 320px;
			word-wrap: break-word;
			opacity: 0;
			transform: translateX(100%);
			transition: all 0.3s ease-out;
			font-family: system-ui, -apple-system, sans-serif;
			border: 2px solid rgba(255, 255, 255, 0.2);
		`;

		document.body.appendChild(toast);

		// Trigger animation
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				toast.style.opacity = '1';
				toast.style.transform = 'translateX(0)';
			});
		});

		// Remove toast after specified duration
		setTimeout(() => {
			if (toast.parentNode) {
				toast.style.opacity = '0';
				toast.style.transform = 'translateX(100%)';
				setTimeout(() => {
					if (toast.parentNode) {
						toast.parentNode.removeChild(toast);
					}
				}, 300);
			}
		}, duration);
	}

	// Virtual Keyboard Functions
	function openVirtualKeyboard(field: 'cpf' | 'email') {
		activeField = field;
		if (field === 'cpf') {
			keyboardValue = cpf;
			isNumericMode = true;
		} else if (field === 'email') {
			keyboardValue = email;
			isNumericMode = false;
		}
		isVirtualKeyboardOpen = true;
	}

	function closeVirtualKeyboard() {
		isVirtualKeyboardOpen = false;
		activeField = null;
		keyboardValue = '';
	}

	function handleVirtualKeyboardInput(event: CustomEvent<string>) {
		keyboardValue = event.detail;
		if (activeField === 'cpf') {
			cpf = keyboardValue;
			validateCPF();
		} else if (activeField === 'email') {
			email = keyboardValue;
			validateEmail();
		}
	}

	function handleVirtualKeyboardEnter() {
		closeVirtualKeyboard();
	}
</script>

<svelte:head>
	<title>Dados para Nota Fiscal - InoBag</title>
</svelte:head>

<svelte:window onclick={handleUserInteraction} onkeydown={handleUserInteraction} />

<div class="full-screen-container">
	<header class="header">
		<div class="header-main">
			<button class="back-button" onclick={goBack} disabled={isSubmitting}>
				<ArrowLeft size={24} />
			</button>
			<h1 class="page-title">Dados para Nota Fiscal</h1>
			<div class="time">{currentTime}</div>
		</div>
	</header>

	<main class="main-content">
		<div class="form-container">
			<div class="form-header">
				<div class="form-icon">
					<FileText size={48} />
				</div>
				<h2 class="form-title">Para emissão de nota fiscal, por gentileza, insira um CPF e seu e-mail.</h2>
				<p class="form-description">Estes dados serão utilizados para gerar a nota fiscal da sua compra.</p>
			</div>

			<div class="form-fields">
				<div class="field-group">
					<label for="cpf" class="field-label">
						<User size={20} />
						CPF
					</label>
					<input
						id="cpf"
						type="text"
						bind:value={cpf}
						oninput={formatCPFInput}
						onblur={validateCPF}
						onfocus={() => openVirtualKeyboard('cpf')}
						placeholder="000.000.000-00"
						class="field-input"
						class:error={cpfError}
						disabled={isSubmitting}
						maxlength="14"
					/>
					{#if cpfError}
						<div class="field-error">
							<AlertCircle size={16} />
							{cpfError}
						</div>
					{/if}
				</div>

				<div class="field-group">
					<label for="email" class="field-label">
						<Mail size={20} />
						E-mail
					</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						onblur={validateEmail}
						onfocus={() => openVirtualKeyboard('email')}
						placeholder="seu@email.com"
						class="field-input"
						class:error={emailError}
						disabled={isSubmitting}
					/>
					{#if emailError}
						<div class="field-error">
							<AlertCircle size={16} />
							{emailError}
						</div>
					{/if}
				</div>
			</div>

			<div class="form-actions">
				<button 
					class="action-button secondary" 
					onclick={continueWithoutInvoice}
					disabled={isSubmitting}
				>
					Continuar sem nota fiscal
				</button>
				
				<button 
					class="action-button primary" 
					onclick={submitWithInvoice}
					disabled={isSubmitting || !cpf || !email || cpfError || emailError}
				>
					{#if isSubmitting}
						<div class="loading-spinner"></div>
						Enviando...
					{:else}
						<CheckCircle size={20} />
						Prosseguir
					{/if}
				</button>
			</div>
		</div>
	</main>
</div>

<!-- Session Timeout Progress Bar -->
{#if showProgressBar}
	<div class="timeout-progress-bar">
		<div class="progress-fill" style:width="{progressWidth}%"></div>
	</div>
{/if}

<!-- Timeout Dialog -->
{#if showTimeoutDialog}
	<div class="timeout-dialog-backdrop">
		<div class="timeout-dialog">
			<div class="dialog-icon">
				<HelpCircle size={48} />
			</div>
			<h3 class="dialog-title">Ei! Tem alguém aí?</h3>
			<p class="dialog-message">Clique para continuar</p>
			<button class="continue-button" onclick={continueSession}>
				OK
			</button>
		</div>
	</div>
{/if}

<style>
	.full-screen-container {
		height: 100vh;
		width: 100vw;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: var(--background);
	}

	.header {
		background: var(--primary);
		color: var(--primary-foreground);
		position: sticky;
		top: 0;
		z-index: 10;
		flex-shrink: 0;
	}

	.header-main {
		padding: 1.5rem 2rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.back-button {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: var(--primary-foreground);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		width: 44px;
		height: 44px;
		border-radius: 0.5rem;
		backdrop-filter: blur(8px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.back-button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.3);
		transform: translateX(-3px) translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.back-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
		color: var(--primary-foreground);
		text-align: center;
		flex: 1;
	}

	.time {
		font-size: 0.875rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.9);
		width: 44px;
		text-align: center;
	}

	.main-content {
		flex: 1;
		display: flex;
		justify-content: center;
		padding: 2rem;
		overflow-y: auto;
		background: var(--background);
		gap: 2rem;
	}

	.form-container {
		background: var(--card);
		border-radius: var(--radius);
		padding: 1.5rem;
		border: 1px solid var(--border);
		width: 100%;
		max-width: 500px;
		box-shadow: var(--shadow-sm);
		height: fit-content;
	}

	.form-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.form-icon {
		color: var(--primary);
		margin-bottom: 1rem;
	}

	.form-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--foreground);
		margin: 0 0 0.5rem 0;
		line-height: 1.4;
	}

	.form-description {
		color: var(--muted-foreground);
		margin: 0;
		font-size: 0.9rem;
	}

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.field-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		color: var(--foreground);
		font-size: 0.9rem;
	}

	.field-input {
		width: 100%;
		padding: 1rem;
		border: 2px solid var(--border);
		border-radius: var(--radius);
		font-size: 1rem;
		background: var(--background);
		color: var(--foreground);
		transition: all 0.2s ease;
		min-height: var(--touch-target);
	}

	.field-input:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
	}

	.field-input.error {
		border-color: var(--destructive);
	}

	.field-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}


	.field-error {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--destructive);
		font-size: 0.85rem;
		font-weight: 500;
	}

	.form-actions {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.action-button {
		width: 100%;
		padding: 1rem;
		border-radius: var(--radius);
		font-weight: 600;
		font-size: 1.125rem;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: var(--touch-target);
		border: 2px solid transparent;
	}

	.action-button.primary {
		background: var(--bittersweet);
		color: white;
		border-color: var(--bittersweet);
	}

	.action-button.primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.action-button.secondary {
		background: transparent;
		color: var(--muted-foreground);
		border-color: var(--border);
	}

	.action-button.secondary:hover:not(:disabled) {
		background: var(--muted);
		border-color: var(--muted-foreground);
		color: var(--foreground);
		transform: translateY(-2px);
		box-shadow: var(--shadow-sm);
	}

	.action-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.loading-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}


	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

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

	/* Timeout Dialog Styles */
	.timeout-dialog-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.3s ease-out;
	}

	.timeout-dialog {
		background: white;
		border-radius: var(--radius-lg);
		padding: 2rem;
		max-width: 400px;
		width: 90%;
		text-align: center;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
		animation: slideUp 0.3s ease-out;
	}

	.dialog-icon {
		color: #f59e0b;
		margin-bottom: 1rem;
	}

	.dialog-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--foreground);
		margin: 0 0 1rem 0;
	}

	.dialog-message {
		font-size: 1rem;
		color: var(--muted-foreground);
		margin: 0 0 2rem 0;
	}

	.continue-button {
		background: var(--primary);
		color: white;
		border: none;
		padding: 1rem 2rem;
		border-radius: var(--radius);
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 120px;
	}

	.continue-button:hover {
		background: var(--primary-hover, #006b8a);
		transform: translateY(-1px);
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slideUp {
		from { 
			opacity: 0;
			transform: translateY(20px) scale(0.95);
		}
		to { 
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.main-content {
			flex-direction: column;
			padding: 1rem;
		}

		.form-container {
			max-width: 100%;
		}

		.header-main {
			padding: 1rem;
		}

		.back-button {
			width: 40px;
			height: 40px;
		}

		.page-title {
			font-size: 1.25rem;
		}

		.time {
			font-size: 0.75rem;
			width: 40px;
		}
	}

	@media (max-width: 480px) {
		.form-container {
			padding: 1rem;
		}

		.form-title {
			font-size: 1.1rem;
		}

		.action-button {
			font-size: 1rem;
			padding: 0.875rem;
		}
	}
</style>

<!-- Virtual Keyboard -->
<VirtualKeyboard 
	bind:isVisible={isVirtualKeyboardOpen}
	bind:value={keyboardValue}
	numericMode={isNumericMode}
	on:input={handleVirtualKeyboardInput}
	on:enter={handleVirtualKeyboardEnter}
	on:close={closeVirtualKeyboard}
/>
