<script lang="ts">
	import { onMount } from 'svelte';
	import { AlertTriangle, Wifi, WifiOff, Settings, DoorOpen, Lock, Package } from 'lucide-svelte';
	import { appState } from '$lib/stores/app';

	export let reasons: string[] = [];

	// Icon mapping for different error types
	const iconMap: Record<string, any> = {
		'Falha de comunicação com controlador': Settings,
		'Falha de acesso à Internet': WifiOff,
		'Equipamento em manutenção': Settings,
		'Porta aberta': DoorOpen,
		'Gavetas destravadas': Lock,
		'Portinhola aberta': Package
	};

	// Get appropriate icon for the first reason, or default to AlertTriangle
	$: mainIcon = reasons.length > 0 ? (iconMap[reasons[0]] || AlertTriangle) : AlertTriangle;

	let currentTime = '';
	
	onMount(() => {
		// Update time every second
		const updateTime = () => {
			currentTime = new Date().toLocaleTimeString('pt-BR');
		};
		
		updateTime();
		const timeInterval = setInterval(updateTime, 1000);
		
		return () => {
			clearInterval(timeInterval);
		};
	});

	function goHome() {
		window.location.href = '/';
	}
</script>

<div class="out-of-service-container">
	<!-- Status Bar -->
	<div class="status-bar">
		<div></div>
		<div class="time">{currentTime}</div>
	</div>

	<!-- Main Content -->
	<main class="main-content">
		<div class="pattern-overlay"></div>
		<div class="floating-element element-1"></div>
		<div class="floating-element element-2"></div>
		<div class="floating-element element-3"></div>
		<div class="floating-element element-4"></div>
		
		<div class="error-container">
			<div class="icon-container">
				<svelte:component this={mainIcon} size={80} class="main-icon" />
			</div>
			
			<h1 class="main-title">Fora de serviço</h1>
			
			<div class="reasons-container">
				{#if reasons.length > 0}
					{#each reasons as reason}
						<div class="reason-item">
							<svelte:component this={iconMap[reason] || AlertTriangle} size={24} class="reason-icon" />
							<span class="reason-text">{reason}</span>
						</div>
					{/each}
				{:else}
					<div class="reason-item">
						<AlertTriangle size={24} class="reason-icon" />
						<span class="reason-text">Serviço temporariamente indisponível</span>
					</div>
				{/if}
			</div>

			<div class="action-container">
				<button class="home-button" onclick={goHome}>
					Voltar ao Início
				</button>
			</div>
		</div>
	</main>
</div>

<style>
	.out-of-service-container {
		height: 100vh;
		width: 100vw;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: linear-gradient(135deg, #e63946 0%, #f77f00 100%);
	}

	.status-bar {
		background: var(--cerulean, #0081a7);
		color: white;
		padding: 0.75rem 2rem;
		font-size: 0.875rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0px 2px 4px rgba(16, 24, 40, 0.05);
		position: relative;
		z-index: 10;
		flex-shrink: 0;
	}

	.time {
		font-weight: 600;
	}

	.main-content {
		flex: 1;
		height: calc(100vh - 60px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		position: relative;
		overflow: hidden;
	}

	/* Background pattern */
	.pattern-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: 
			radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 10%),
			radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 10%);
		opacity: 0.6;
	}

	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		max-width: 800px;
		width: 100%;
		position: relative;
		z-index: 1;
		background: rgba(255, 255, 255, 0.95);
		border-radius: 1.5rem;
		padding: 3rem 2rem;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
		backdrop-filter: blur(10px);
		animation: fadeIn 1s ease-out;
	}

	.icon-container {
		margin-bottom: 2rem;
		position: relative;
	}

	:global(.main-icon) {
		color: #e63946;
		animation: pulse 2s infinite;
	}

	.main-title {
		color: #2C3E50;
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 2rem;
		text-align: center;
		animation: fadeIn 1s ease-out 0.2s both;
	}

	.reasons-container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 3rem;
		width: 100%;
		max-width: 600px;
	}

	.reason-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem 1.5rem;
		background: rgba(230, 57, 70, 0.1);
		border: 2px solid rgba(230, 57, 70, 0.2);
		border-radius: 1rem;
		animation: slideIn 0.6s ease-out;
	}

	:global(.reason-icon) {
		color: #e63946;
		flex-shrink: 0;
	}

	.reason-text {
		color: #2C3E50;
		font-size: 1.125rem;
		font-weight: 500;
		flex: 1;
	}

	.action-container {
		position: relative;
	}

	.home-button {
		background: var(--cerulean, #0081a7);
		color: white;
		border: none;
		padding: 1.25rem 3rem;
		border-radius: 1rem;
		font-size: 1.25rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 8px 20px rgba(0, 129, 167, 0.3);
		position: relative;
		overflow: hidden;
		animation: fadeIn 1s ease-out 0.6s both;
	}

	.home-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 12px 30px rgba(0, 129, 167, 0.4);
	}

	.home-button:active {
		transform: translateY(0);
		box-shadow: 0 4px 15px rgba(0, 129, 167, 0.3);
	}

	/* Floating elements */
	.floating-element {
		position: absolute;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		z-index: 0;
		animation: float 8s infinite ease-in-out;
	}

	.element-1 {
		width: 200px;
		height: 200px;
		bottom: -100px;
		right: -50px;
		animation-delay: 0s;
	}

	.element-2 {
		width: 150px;
		height: 150px;
		top: -75px;
		left: -25px;
		animation-delay: 1s;
	}

	.element-3 {
		width: 100px;
		height: 100px;
		bottom: 20%;
		left: 5%;
		animation-delay: 2s;
	}

	.element-4 {
		width: 80px;
		height: 80px;
		top: 15%;
		right: 8%;
		animation-delay: 3s;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(-20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.1);
		}
	}

	@keyframes float {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-20px);
		}
	}

	/* Responsive design */
	@media (min-width: 768px) and (min-height: 1024px) {
		.main-title {
			font-size: 3rem;
		}
		
		.reason-text {
			font-size: 1.25rem;
		}

		.home-button {
			padding: 1.5rem 4rem;
			font-size: 1.5rem;
		}

		.error-container {
			padding: 4rem 3rem;
		}
	}

	@media (min-width: 1080px) and (min-height: 1920px) {
		.main-title {
			font-size: 3.5rem;
		}
		
		.reason-text {
			font-size: 1.5rem;
		}

		.home-button {
			padding: 2rem 5rem;
			font-size: 1.75rem;
		}

		.error-container {
			padding: 5rem 4rem;
		}

		.status-bar {
			padding: 1rem 3rem;
			font-size: 1rem;
		}
	}

	@media (max-width: 768px) {
		.main-title {
			font-size: 2rem;
		}
		
		.reason-text {
			font-size: 1rem;
		}

		.home-button {
			padding: 1rem 2rem;
			font-size: 1.125rem;
		}

		.error-container {
			padding: 2rem 1.5rem;
		}

		.reasons-container {
			gap: 1rem;
		}

		.reason-item {
			padding: 1rem 1.25rem;
		}
	}

	@media (max-width: 480px) {
		.status-bar {
			padding: 0.75rem 1rem;
		}
		
		.main-title {
			font-size: 1.75rem;
		}
		
		.error-container {
			padding: 1.5rem 1rem;
		}

		.home-button {
			padding: 1rem 1.5rem;
			font-size: 1rem;
		}
	}
</style>