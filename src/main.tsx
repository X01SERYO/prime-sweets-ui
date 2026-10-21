import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { createAppContainer } from '@/app/composition';
import '@/app/styles.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('No se encontró el elemento #root');
}

createRoot(root).render(
  <StrictMode>
    <App container={createAppContainer()} />
  </StrictMode>
);
