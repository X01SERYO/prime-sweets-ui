import type { AppContainer } from '@/app/composition';

interface AppProps {
  container: AppContainer;
}

export function App({ container }: AppProps) {
  return (
    <main>
      <h1>Prime Sweets</h1>
      <p>
        Base de interfaz lista. Los módulos de negocio viven en <code>src/modules</code>.
      </p>
      <p>
        API configurada en <code>{container.apiBaseUrl}</code>
      </p>
    </main>
  );
}
