import { defineConfig } from 'vite';
import react from '@tailwindcss/vite';
import reactPlugin from '@vitejs/plugin-react';

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
	plugins: [react(), reactPlugin()],

	// Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
	clearScreen: false,
	server: {
		port: 8668,
		strictPort: true,
		host: host || "localhost",
		hmr: host
			? {
					protocol: 'ws',
					host,
					port: 8669,
			  }
			: undefined,
		watch: {
			ignored: ['**/src-tauri/**'],
		},
	},
	build: {
		chunkSizeWarningLimit: 1500,
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ['react', 'react-dom', 'react-router-dom'],
					ui: ['lucide-react', 'katex', 'marked'],
				},
			},
		},
	},
}));
