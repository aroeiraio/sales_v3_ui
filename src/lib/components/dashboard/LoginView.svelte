<script lang="ts">
	import { onMount } from 'svelte';
	import ActionButton from './ActionButton.svelte';
	import NumericKeyboard from '../ui/NumericKeyboard.svelte';
	import { authService } from '$lib/services/authService.js';
	import { sessionManager } from '$lib/services/sessionManager.js';
	import { errorHandler } from '$lib/services/errorHandler.js';

	interface Props {
		onSuccess: () => void;
		onCancel: () => void;
	}

	let { onSuccess, onCancel }: Props = $props();

	const username = 'repositor'; // Preset username
	let password = $state('');
	let isLogging = $state(false);
	let showKeyboard = $state(false);
	let inactivityTimer: number | null = null;

	const INACTIVITY_TIMEOUT = 60 * 1000; // 60 seconds

	function resetInactivityTimer() {
		if (inactivityTimer) {
			clearTimeout(inactivityTimer);
		}
		inactivityTimer = window.setTimeout(() => {
			// Return to start screen
			onCancel();
		}, INACTIVITY_TIMEOUT);
	}

	async function handleLogin() {
		if (!password.trim()) {
			errorHandler.handleError(new Error('Senha é obrigatória'), 'Login');
			return;
		}

		isLogging = true;
		showKeyboard = false;
		try {
			const user = await authService.login({ username, password });
			sessionManager.startSession(user);
			onSuccess();
		} catch (error) {
			// Handle specific login error cases
			let errorMessage = 'Falha no login';
			
			if (error && typeof error === 'object' && 'status' in error) {
				const apiError = error as any;
				if (apiError.status === 406) {
					// HTTP 406 with empty content means incorrect password
					errorMessage = 'Senha incorreta';
				} else if (apiError.status === 401) {
					// HTTP 401 typically means authentication failed
					errorMessage = 'Usuário ou senha incorretos';
				} else if (apiError.status >= 500) {
					// Server errors
					errorMessage = 'Erro do servidor. Tente novamente.';
				}
			}
			
			errorHandler.handleError(
				new Error(errorMessage),
				'Login'
			);
		} finally {
			isLogging = false;
		}
	}

	function handlePasswordInput(newPassword: string) {
		password = newPassword;
		resetInactivityTimer();
	}

	function handlePasswordClick() {
		showKeyboard = true;
		resetInactivityTimer();
	}

	function handleKeyboardClose() {
		showKeyboard = false;
	}

	function handleCancel() {
		onCancel();
	}

	function handleKeydown(event: KeyboardEvent) {
		resetInactivityTimer();
		if (event.key === 'Enter') {
			handleLogin();
		}
	}

	function handleActivity() {
		resetInactivityTimer();
	}

	onMount(() => {
		// Start inactivity timer
		resetInactivityTimer();

		// Add global activity listeners
		const events = ['mousedown', 'keydown', 'touchstart'];
		events.forEach(event => {
			document.addEventListener(event, handleActivity);
		});

		// Auto-focus is handled by password click handler

		// Cleanup
		return () => {
			if (inactivityTimer) {
				clearTimeout(inactivityTimer);
			}
			events.forEach(event => {
				document.removeEventListener(event, handleActivity);
			});
		};
	});
</script>

<div class="login-container" onkeydown={handleKeydown}>
	<div class="login-card">
		<div class="login-header">
			<h1>Login do Painel</h1>
			<p>Digite a senha para acessar o painel de controle</p>
		</div>
		
		<form class="login-form" onsubmit={(e) => { e.preventDefault(); handleLogin(); }}>
			<div class="password-field">
				<label class="password-label">Senha</label>
				<button 
					type="button"
					class="password-input"
					class:has-value={password.length > 0}
					onclick={handlePasswordClick}
				>
					{#if password.length > 0}
						<span class="password-dots">
							{#each Array(password.length) as _}●{/each}
						</span>
					{:else}
						<span class="password-placeholder">Toque para inserir senha</span>
					{/if}
				</button>
			</div>
			
			<div class="form-actions">
				<ActionButton
					variant="secondary"
					onclick={handleCancel}
					disabled={isLogging}
				>
					Cancelar
				</ActionButton>
				
				<ActionButton
					variant="primary"
					onclick={handleLogin}
					loading={isLogging}
				>
					{isLogging ? 'Entrando...' : 'Entrar'}
				</ActionButton>
			</div>
		</form>
		
		<div class="login-footer">
			<p class="timeout-warning">A sessão expirará após 60 segundos de inatividade</p>
		</div>
	</div>
</div>

<NumericKeyboard
	isVisible={showKeyboard}
	value={password}
	oninput={handlePasswordInput}
	onenter={handleLogin}
	onclose={handleKeyboardClose}
/>

<style>
	.login-container {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
		padding: 1rem;
	}

	.login-card {
		background: white;
		border-radius: 1rem;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		width: 100%;
		max-width: 400px;
		overflow: hidden;
	}

	.login-header {
		padding: 2rem 2rem 1rem;
		text-align: center;
		border-bottom: 1px solid #e5e7eb;
	}

	.login-header h1 {
		font-size: 1.875rem;
		font-weight: 700;
		color: #111827;
		margin: 0 0 0.5rem 0;
	}

	.login-header p {
		color: #6b7280;
		margin: 0;
	}

	.login-form {
		padding: 2rem;
	}

	.password-field {
		margin-bottom: 1.5rem;
	}

	.password-label {
		display: block;
		margin-bottom: 0.5rem;
		color: #374151;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.password-input {
		width: 100%;
		padding: 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		background: white;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		font-size: 1rem;
		min-height: 3.5rem;
		display: flex;
		align-items: center;
	}

	.password-input:hover {
		border-color: #d1d5db;
		background: #f9fafb;
	}

	.password-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.password-input.has-value {
		background: #f0f9ff;
		border-color: #3b82f6;
	}

	.password-dots {
		color: #111827;
		font-size: 1.5rem;
		letter-spacing: 0.5rem;
		font-family: monospace;
	}

	.password-placeholder {
		color: #9ca3af;
		font-style: italic;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
	}

	.login-footer {
		padding: 1rem 2rem;
		border-top: 1px solid #e5e7eb;
		background-color: #f9fafb;
	}

	.timeout-warning {
		font-size: 0.875rem;
		color: #6b7280;
		text-align: center;
		margin: 0;
	}

	@media (max-width: 640px) {
		.login-container {
			padding: 0.5rem;
		}

		.login-card {
			border-radius: 0.5rem;
		}

		.login-header,
		.login-form {
			padding: 1.5rem;
		}

		.form-actions {
			flex-direction: column-reverse;
		}
	}
</style>