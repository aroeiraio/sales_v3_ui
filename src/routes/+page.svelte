<script lang="ts">
	import { onMount } from 'svelte';
	import { ShoppingCart } from 'lucide-svelte';
	import { 
		visualSettings, 
		visualSettingsActions, 
		visualSettingsLoading,
		hasLogotype,
		effectiveBackgroundColor,
		effectiveFontColor,
		visualSettingsRefreshTimer
	} from '$lib/stores/visualSettings';
	import { 
		digitalSignageActions,
		hasValidVideos,
		currentVideoUrl,
		isPlaying,
		isFullscreen,
		playlistProgress,
		digitalSignageRefreshTimer
	} from '$lib/stores/digitalSignage';
	import { sessionService } from '$lib/services/session';
	import { appState } from '$lib/stores/app';

	let videoElement = $state<HTMLVideoElement>();
	let isMuted = $state(true);

	onMount(async () => {
		// Destroy any existing session when first screen loads
		try {
			console.log('Ending any existing session on first screen load');
			await sessionService.endSession();
		} catch (error) {
			console.log('No session to end or error ending session:', error);
		}

		// Load visual settings and digital signage data
		await Promise.all([
			visualSettingsActions.loadSettings(),
			digitalSignageActions.loadSignageData()
		]);

		// Start video playback if valid videos are available
		const hasVideos = $hasValidVideos;
		if (hasVideos) {
			digitalSignageActions.startPlayback();
		}

		// Handle fullscreen changes
		const handleFullscreenChange = () => {
			if (!document.fullscreenElement) {
				digitalSignageActions.stopPlayback();
			}
		};
		
		document.addEventListener('fullscreenchange', handleFullscreenChange);

		// Start the 15-minute refresh timers
		// These are automatically managed by the stores
		visualSettingsRefreshTimer;
		digitalSignageRefreshTimer;

		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			digitalSignageActions.stopPlayback();
		};
	});

	async function startShopping() {
		try {
			console.log('Starting shopping - calling sessionService.startSession()');
			// Stop any video playback
			digitalSignageActions.stopPlayback();
			
			// Start session and navigate
			await sessionService.startSession();
			console.log('Session started successfully, navigating to products');
			window.location.href = '/products';
		} catch (error) {
			console.error('Error in startShopping:', error);
			// Error is handled by sessionService
		}
	}

	async function handleVideoClick() {
		await digitalSignageActions.onVideoClick();
	}

	function handleVideoEnded() {
		digitalSignageActions.onVideoEnded();
	}


	function handleVideoLoad() {
		if (videoElement) {
			videoElement.muted = isMuted;
			videoElement.play().catch(console.error);
		}
	}

	// Reactive updates for dynamic styling
	$effect(() => {
		if ($visualSettings && typeof document !== 'undefined') {
			const root = document.documentElement;
			
			// Apply background
			if ($visualSettings.background_image) {
				root.style.setProperty('--dynamic-bg-image', `url(${$visualSettings.background_image})`);
				root.style.removeProperty('--dynamic-bg-color');
			} else if ($visualSettings.background_color) {
				root.style.setProperty('--dynamic-bg-color', $visualSettings.background_color);
				root.style.removeProperty('--dynamic-bg-image');
			}
			
			// Apply font color
			if ($visualSettings.font_color) {
				root.style.setProperty('--dynamic-font-color', $visualSettings.font_color);
			}
		}
	});
</script>

<div class="full-screen-container">
	<!-- Video Player (Full Screen) -->
	{#if $hasValidVideos && $isPlaying && $currentVideoUrl}
		<div class="video-player" class:fullscreen={$isFullscreen}>
			<video
				bind:this={videoElement}
				src={$currentVideoUrl}
				autoplay
				muted={isMuted}
				onclick={handleVideoClick}
				onended={handleVideoEnded}
				onloadeddata={handleVideoLoad}
				class="video-element"
			>
				<track kind="captions" />
			</video>
			
		</div>
	{:else}
		<!-- Regular Start Screen -->
		<div class="status-bar">
			<div></div>
			<div class="time">{$appState.currentTime.toLocaleTimeString('pt-BR')}</div>
		</div>

		<main class="main-content">
			<div class="pattern-overlay"></div>
			<div class="floating-element element-1"></div>
			<div class="floating-element element-2"></div>
			<div class="floating-element element-3"></div>
			<div class="floating-element element-4"></div>
			
			<div class="welcome-container">
				<div class="logo-container">
					{#if $hasLogotype && $visualSettings?.logotype_image}
						<img src={$visualSettings.logotype_image} alt="Logo" class="logo-image" />
					{:else}
						<div class="logo">LOGO</div>
					{/if}
				</div>
				
				<h1 class="welcome-text">Bem-vindo à Máquina de Vendas</h1>
				<p class="welcome-subtext">Escolha seus produtos favoritos com facilidade</p>
				
				<div class="button-container">
					<button class="start-button" onclick={startShopping}>
						<ShoppingCart size={24} />
						Começar Compra
					</button>
				</div>
			</div>

			{#if $visualSettingsLoading}
				<div class="loading-indicator">
					<div class="spinner"></div>
					<p>Carregando configurações...</p>
				</div>
			{/if}
		</main>
	{/if}
</div>

<style>
	:global(html) {
		height: 100%;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		height: 100vh;
		width: 100vw;
		font-family: 'Plus Jakarta Sans', sans-serif;
		-webkit-tap-highlight-color: transparent;
		background: var(--dynamic-bg-color, var(--light-yellow));
		background-image: var(--dynamic-bg-image, none);
		background-size: cover;
		background-position: center;
		color: var(--dynamic-font-color, var(--foreground));
		overflow: hidden;
	}

	.full-screen-container {
		height: 100vh;
		width: 100vw;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/* Video Player Styles */
	.video-player {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: black;
		z-index: 1000;
	}

	.video-element {
		width: 100%;
		height: 100%;
		object-fit: cover;
		cursor: pointer;
	}


	.loading-indicator {
		position: absolute;
		bottom: 20px;
		right: 20px;
		display: flex;
		align-items: center;
		gap: 10px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 15px 20px;
		border-radius: 10px;
		backdrop-filter: blur(10px);
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.status-bar {
		background: var(--cerulean);
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


	.main-content {
		flex: 1;
		height: calc(100vh - 60px); /* Subtract status bar height */
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		position: relative;
		overflow: hidden;
		background: linear-gradient(135deg, var(--cerulean) 0%, var(--verdigris) 100%);
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

	.welcome-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		max-width: 600px;
		width: 100%;
		position: relative;
		z-index: 1;
	}

	.logo-container {
		margin-bottom: 2.5rem;
		position: relative;
	}

	.logo {
		width: 180px;
		height: 180px;
		background: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		font-weight: 700;
		color: var(--cerulean);
		box-shadow: 0px 8px 16px rgba(16, 24, 40, 0.05);
		position: relative;
		overflow: hidden;
		animation: fadeIn 1s ease-out;
	}

	.logo-image {
		width: 180px;
		height: 180px;
		border-radius: 50%;
		object-fit: cover;
		box-shadow: 0px 8px 16px rgba(16, 24, 40, 0.05);
		animation: fadeIn 1s ease-out;
	}

	.logo::after {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.2) 100%);
	}

	.welcome-text {
		color: white;
		font-size: 2.25rem;
		font-weight: 700;
		margin-bottom: 1rem;
		text-align: center;
		animation: fadeIn 1s ease-out 0.2s both;
	}

	.welcome-subtext {
		color: rgba(255, 255, 255, 0.8);
		font-size: 1.25rem;
		margin-bottom: 3rem;
		text-align: center;
		animation: fadeIn 1s ease-out 0.4s both;
	}

	.button-container {
		position: relative;
	}

	.start-button {
		background: var(--bittersweet);
		color: white;
		border: none;
		padding: 1.5rem 4rem;
		border-radius: 1.25rem;
		font-size: 1.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 10px 30px rgba(240, 113, 103, 0.3);
		min-height: 2.75rem;
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		animation: fadeIn 1s ease-out 0.6s both, pulse 2s infinite 2s;
	}

	.start-button::before {
		content: "";
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(255, 255, 255, 0.2),
			transparent
		);
		animation: shimmer 2s infinite;
	}

	.start-button:hover {
		transform: translateY(-3px) scale(1.05);
		box-shadow: 0 15px 40px rgba(240, 113, 103, 0.4);
		animation: none;
	}

	.start-button:active {
		transform: translateY(1px);
		box-shadow: 0 5px 15px rgba(240, 113, 103, 0.3);
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
		width: 300px;
		height: 300px;
		bottom: -150px;
		right: -100px;
		animation-delay: 0s;
	}

	.element-2 {
		width: 200px;
		height: 200px;
		top: -100px;
		left: -50px;
		animation-delay: 1s;
	}

	.element-3 {
		width: 150px;
		height: 150px;
		bottom: 20%;
		left: 10%;
		animation-delay: 2s;
	}

	.element-4 {
		width: 100px;
		height: 100px;
		top: 20%;
		right: 10%;
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

	@keyframes shimmer {
		100% {
			left: 100%;
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

	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
			box-shadow: 0 10px 30px rgba(240, 113, 103, 0.3);
		}
		50% {
			transform: scale(1.03);
			box-shadow: 0 15px 40px rgba(240, 113, 103, 0.4);
		}
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}


	/* HD Portrait Display optimizations */
	@media (min-width: 768px) and (min-height: 1024px) {
		.welcome-text {
			font-size: 2.5rem;
		}
		
		.logo, .logo-image {
			width: 200px;
			height: 200px;
		}

		.logo {
			font-size: 2.2rem;
		}

		.welcome-subtext {
			font-size: 1.4rem;
		}

		.start-button {
			padding: 2rem 5rem;
			font-size: 1.75rem;
		}

		.main-content {
			padding: 3rem;
		}
	}

	/* Full HD Portrait (1080x1920) optimizations */
	@media (min-width: 1080px) and (min-height: 1920px) {
		.welcome-text {
			font-size: 3rem;
		}
		
		.logo, .logo-image {
			width: 250px;
			height: 250px;
		}

		.logo {
			font-size: 2.5rem;
		}

		.welcome-subtext {
			font-size: 1.6rem;
			margin-bottom: 4rem;
		}

		.start-button {
			padding: 2.5rem 6rem;
			font-size: 2rem;
		}

		.status-bar {
			padding: 1rem 3rem;
			font-size: 1rem;
		}

		.main-content {
			padding: 4rem;
		}

		.logo-container {
			margin-bottom: 3rem;
		}
	}

	/* Tablet and smaller displays */
	@media (max-width: 768px) {
		.welcome-text {
			font-size: 1.75rem;
		}
		
		.logo, .logo-image {
			width: 150px;
			height: 150px;
		}

		.logo {
			font-size: 1.5rem;
		}

		.welcome-subtext {
			font-size: 1.125rem;
			margin-bottom: 2.5rem;
		}

		.start-button {
			padding: 1.25rem 3rem;
			font-size: 1.25rem;
		}
	}

	@media (max-width: 480px) {
		.status-bar {
			padding: 0.75rem 1rem;
		}
		
		.welcome-text {
			font-size: 1.5rem;
		}
		
		.logo, .logo-image {
			width: 120px;
			height: 120px;
		}

		.logo {
			font-size: 1.25rem;
		}

		.welcome-subtext {
			font-size: 1rem;
			margin-bottom: 2rem;
		}

		.start-button {
			padding: 1.25rem 2rem;
			font-size: 1.125rem;
		}
	}
</style>
