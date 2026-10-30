import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { App } from '@/app/App';
import { createAppContainer } from '@/app/composition';
import { LocaleProvider } from '@/shared/i18n/locale';
import '@/app/styles.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('No se encontró el elemento #root');
}

const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <LocaleProvider>
        <App container={createAppContainer()} />
      </LocaleProvider>
    )
  }
]);

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
