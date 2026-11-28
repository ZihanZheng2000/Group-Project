import { defineConfig } from 'vite'
import tailwind from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({ plugins: [tailwind(), viteSingleFile()] })
