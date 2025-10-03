import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	server: {
		port: 8090,
		host: true
	},
	define: {
		// Explicitly define environment variables for the build
		'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || 'http://localhost:8090/interface'),
		'import.meta.env.VITE_MEDIA_BASE_URL': JSON.stringify(process.env.VITE_MEDIA_BASE_URL || 'http://localhost:8090'),
		'import.meta.env.VITE_WEBSOCKET_URL': JSON.stringify(process.env.VITE_WEBSOCKET_URL || 'ws://localhost:9010'),
	},
	plugins: [
		sveltekit(),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
			manifest: {
				name: 'InoBag Sales V3',
				short_name: 'InoBag',
				description: 'Point of Sale interface for vending machines',
				theme_color: '#0081a7',
				background_color: '#fdfcdc',
				display: 'standalone',
				orientation: 'portrait',
				scope: '/',
				start_url: '/',
				icons: [
					{
						src: 'pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
				maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
				runtimeCaching: [
					// API Cache - Network First for fresh data
					{
						urlPattern: /^https?:\/\/localhost:8090\/interface\/(products|cart|checkout)/,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'api-data-cache',
							networkTimeoutSeconds: 3,
							cacheableResponse: {
								statuses: [0, 200]
							},
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 5 * 60 // 5 minutes
							}
						}
					},
					// Static API resources - Cache First for performance  
					{
						urlPattern: /^https?:\/\/localhost:8090\/interface\/(settings|media)/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'api-static-cache',
							cacheableResponse: {
								statuses: [0, 200]
							},
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 30 * 60 // 30 minutes
							}
						}
					},
					// Images - Cache First with long expiration
					{
						urlPattern: /\.(?:png|jpg|jpeg|gif|webp|svg)$/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'images-cache',
							cacheableResponse: {
								statuses: [0, 200]
							},
							expiration: {
								maxEntries: 200,
								maxAgeSeconds: 24 * 60 * 60 // 24 hours
							}
						}
					},
					// Fonts - Cache First with very long expiration
					{
						urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'fonts-cache',
							cacheableResponse: {
								statuses: [0, 200]
							},
							expiration: {
								maxEntries: 30,
								maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
							}
						}
					},
					// External CDN resources
					{
						urlPattern: /^https:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|unpkg\.com)/,
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'external-resources-cache',
							cacheableResponse: {
								statuses: [0, 200]
							},
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
							}
						}
					}
				]
			}
		})
	],
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/test/setup.ts']
	}
});
