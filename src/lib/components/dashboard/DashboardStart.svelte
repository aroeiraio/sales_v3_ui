<script lang="ts">
	import { onMount } from 'svelte';
	import { currentUser, sessionManager } from '$lib/services/sessionManager.js';
	import LoginView from './LoginView.svelte';
	import DashboardView from './DashboardView.svelte';

	// Dashboard screen imports
	let showDashboard = $state(false);
	let showLogin = $state(false);

	// Start Screen State  
	let pressTimer: number | null = null;
	let pressProgress = $state(0);
	let isPressing = $state(false);

	const LONG_PRESS_DURATION = 10000; // 10 seconds as specified

	function startLongPress(event: MouseEvent | TouchEvent) {
		event.preventDefault();
		console.log('Long press started');
		isPressing = true;
		pressProgress = 0;
		
		const startTime = Date.now();
		pressTimer = window.setInterval(() => {
			const elapsed = Date.now() - startTime;
			const progress = (elapsed / LONG_PRESS_DURATION) * 100;
			
			if (progress >= 100) {
				console.log('Long press completed');
				completeLongPress();
			} else {
				pressProgress = progress;
			}
		}, 16); // ~60fps
	}

	function stopLongPress(event?: MouseEvent | TouchEvent) {
		if (event) {
			event.preventDefault();
		}
		console.log('Long press stopped');
		if (pressTimer) {
			clearInterval(pressTimer);
			pressTimer = null;
		}
		isPressing = false;
		pressProgress = 0;
	}

	function completeLongPress() {
		stopLongPress();
		if ($currentUser) {
			showDashboard = true;
		} else {
			showLogin = true;
		}
	}

	// Double click handler as fallback
	let clickCount = 0;
	let clickTimer: number | null = null;
	
	function handleClick() {
		clickCount++;
		
		if (clickCount === 1) {
			clickTimer = window.setTimeout(() => {
				clickCount = 0;
			}, 400);
		} else if (clickCount === 2) {
			if (clickTimer) {
				clearTimeout(clickTimer);
				clickTimer = null;
			}
			clickCount = 0;
			console.log('Double click detected - bypassing long press');
			if ($currentUser) {
				showDashboard = true;
			} else {
				showLogin = true;
			}
		}
	}

	// Check if user is already logged in
	onMount(() => {
		// Add global event listeners for better touch handling
		const handleGlobalTouchEnd = () => {
			if (isPressing) {
				stopLongPress();
			}
		};

		const handleGlobalTouchCancel = () => {
			if (isPressing) {
				stopLongPress();
			}
		};

		document.addEventListener('touchend', handleGlobalTouchEnd);
		document.addEventListener('touchcancel', handleGlobalTouchCancel);
		document.addEventListener('visibilitychange', handleGlobalTouchEnd);

		return () => {
			document.removeEventListener('touchend', handleGlobalTouchEnd);
			document.removeEventListener('touchcancel', handleGlobalTouchCancel);
			document.removeEventListener('visibilitychange', handleGlobalTouchEnd);
			
			// Cleanup timers
			if (pressTimer) {
				clearInterval(pressTimer);
			}
			if (clickTimer) {
				clearTimeout(clickTimer);
			}
		};
	});
</script>


{#if showDashboard}
	<DashboardView 
		onClose={() => { 
			showDashboard = false; 
			showLogin = false; 
		}} 
	/>
{:else if showLogin}
	<LoginView 
		onSuccess={() => { 
			showLogin = false; 
			showDashboard = true; 
		}}
		onCancel={() => { 
			showLogin = false; 
		}} 
	/>
{:else}
	<!-- Dashboard Access Button (Hidden) -->
	<div class="dashboard-access">
		<button 
			class="dashboard-trigger"
			class:pressing={isPressing}
			onmousedown={startLongPress}
			onmouseup={stopLongPress}
			onmouseleave={stopLongPress}
			ontouchstart={startLongPress}
			ontouchend={stopLongPress}
			ontouchcancel={stopLongPress}
			oncontextmenu={(e) => e.preventDefault()}
			onclick={handleClick}
			aria-label="Access dashboard (hold for 3 seconds)"
		>
			{#if isPressing}
				<div class="progress-ring">
					<svg class="progress-svg" viewBox="0 0 60 60">
						<circle 
							cx="30" 
							cy="30" 
							r="25"
							fill="transparent"
							stroke="rgba(255,255,255,0.3)"
							stroke-width="4"
						/>
						<circle 
							cx="30" 
							cy="30" 
							r="25"
							fill="transparent"
							stroke="white"
							stroke-width="4"
							stroke-linecap="round"
							stroke-dasharray="157.08"
							stroke-dashoffset={157.08 * (1 - pressProgress / 100)}
							class="progress-circle"
						/>
					</svg>
					<span class="progress-text">
						{Math.round(pressProgress)}%
					</span>
				</div>
			{:else}
				⚙️
			{/if}
		</button>
	</div>
{/if}

<style>
	.dashboard-access {
		position: fixed;
		bottom: 20px;
		right: 20px;
		z-index: 999;
	}

	.dashboard-trigger {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.1);
		border: none;
		color: rgba(0, 0, 0, 0.3);
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
		backdrop-filter: blur(10px);
	}

	.dashboard-trigger:hover {
		background: rgba(0, 0, 0, 0.2);
		color: rgba(0, 0, 0, 0.6);
		transform: scale(1.1);
	}

	.dashboard-trigger.pressing {
		background: rgba(59, 130, 246, 0.8);
		color: white;
		transform: scale(0.95);
	}

	.progress-ring {
		position: relative;
		width: 50px;
		height: 50px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.progress-svg {
		position: absolute;
		top: 0;
		left: 0;
		transform: rotate(-90deg);
		width: 100%;
		height: 100%;
	}

	.progress-circle {
		transition: stroke-dashoffset 0.1s ease;
	}

	.progress-text {
		font-size: 0.75rem;
		font-weight: 600;
		color: white;
	}

</style>