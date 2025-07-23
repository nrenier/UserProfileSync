// Build scripts for production Docker container
import { execSync } from 'child_process';
import fs from 'fs';

console.log('Building client...');
execSync('npx vite build --outDir dist/public', { stdio: 'inherit' });

console.log('Building server...');
execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --external:vite --external:@vitejs/plugin-react --external:@replit/vite-plugin-cartographer --external:@replit/vite-plugin-runtime-error-modal --external:tailwindcss --external:postcss --external:autoprefixer --external:./vite-dev.ts --external:./vite-dev.js --external:./vite-dev', { stdio: 'inherit' });

console.log('Build completed successfully!');