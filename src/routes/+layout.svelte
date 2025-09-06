<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import ErrorDialog from '$lib/components/ui/ErrorDialog.svelte';
	import { visualSettingsService } from '$lib/services/visualSettings';
	import { sessionService } from '$lib/services/session';
	import { errorDialogService } from '$lib/services/errorDialog';

	let { children } = $props();
	let settings: any = $state(null);

	onMount(async () => {
		try {
			settings = await visualSettingsService.loadSettings();
		} catch (error) {
			errorDialogService.showError({
				title: 'Erro de Configuração',
				message: 'Não foi possível carregar as configurações visuais. Usando configurações padrão.',
				icon: 'settings'
			});
		}
	});

	// Global error handler
	function handleGlobalError(event: ErrorEvent) {
		console.error('Global error:', event.error);
		errorDialogService.showError({
			title: 'Erro do Sistema',
			message: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
			actions: [
				{
					label: 'Recarregar Página',
					action: () => window.location.reload(),
					variant: 'primary'
				},
				{
					label: 'Continuar',
					action: () => {},
					variant: 'secondary'
				}
			]
		});
	}

	onMount(() => {
		window.addEventListener('error', handleGlobalError);
		return () => window.removeEventListener('error', handleGlobalError);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<main class="app" style:background-color={settings?.background_color || 'var(--fallback-bg)'}>
	{@render children?.()}
	<ErrorDialog />
</main>

<style>
	:root {
		/* Brand colors */
		--cerulean: #0081a7ff;
		--verdigris: #00afb9ff;
		--light-yellow: #fdfcdcff;
		--light-orange: #fed9b7ff;
		--bittersweet: #f07167ff;
		
		/* Base colors */
		--background: var(--light-yellow);
		--foreground: #2C3E50;
		
		/* Semantic mappings */
		--primary: var(--cerulean);
		--primary-foreground: #FFFFFF;
		--secondary: var(--verdigris);
		--secondary-foreground: #FFFFFF;
		--muted: #E5E5E5;
		--muted-foreground: #64748B;
		--accent: var(--light-orange);
		--accent-foreground: #1E293B;
		
		/* UI Elements */
		--card: #FFFFFF;
		--card-foreground: #1E293B;
		--popover: #FFFFFF;
		--popover-foreground: #1E293B;
		--destructive: var(--bittersweet);
		--destructive-foreground: #FFFFFF;
		--border: #E2E8F0;
		--input: #F1F5F9;
		--ring: var(--cerulean);
		
		/* Status Colors */
		--success: #10B981;
		--warning: #F59E0B;
		--error: var(--bittersweet);
		
		/* Typography */
		--font-sans: 'Plus Jakarta Sans', sans-serif;
		--font-serif: 'Playfair Display', serif;
		--font-mono: 'JetBrains Mono', monospace;
		
		/* Spacing & Layout */
		--radius: 1rem;
		--radius-sm: 0.75rem;
		--radius-md: 1rem;
		--radius-lg: 1.25rem;
		--radius-xl: 1.5rem;
		
		/* Shadows */
		--shadow-xs: 0px 1px 2px rgba(16, 24, 40, 0.05);
		--shadow-sm: 0px 2px 4px rgba(16, 24, 40, 0.05);
		--shadow: 0px 4px 6px -1px rgba(16, 24, 40, 0.05);
		--shadow-md: 0px 6px 8px rgba(16, 24, 40, 0.05);
		--shadow-lg: 0px 8px 16px rgba(16, 24, 40, 0.05);
		--shadow-xl: 0px 12px 24px rgba(16, 24, 40, 0.05);
		
		/* Touch Targets */
		--touch-target: 2.75rem;  /* 44px */
		--spacing: 1rem;

		/* Fallback for dynamic variables */
		--fallback-bg: var(--light-yellow);
	}

	:global(html) {
		height: 100%;
		width: 100%;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		height: 100vh;
		width: 100vw;
		font-family: var(--font-sans);
		line-height: 1.6;
		overflow: hidden;
	}

	:global(*) {
		box-sizing: border-box;
	}

	.app {
		height: 100vh;
		width: 100vw;
		font-family: var(--font-sans);
		background-color: var(--dynamic-bg-color, var(--fallback-bg));
		background-image: var(--dynamic-bg-image);
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		color: var(--dynamic-font-color, var(--foreground));
		display: flex;
		flex-direction: column;
	}

	/* Touch-friendly button sizing */
	:global(button, .button) {
		min-height: 44px;
		min-width: 44px;
		touch-action: manipulation;
	}
</style>
