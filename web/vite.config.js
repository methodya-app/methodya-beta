import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' hace que los assets se resuelvan con rutas relativas, para que
// el build funcione en GitHub Pages sin importar el nombre del repositorio
// (project page tipo https://usuario.github.io/nombre-repo/).
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
  },
});
