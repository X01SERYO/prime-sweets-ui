import { NavLink, Navigate, Route, Routes } from 'react-router';
import type { AppContainer } from '@/app/composition';
import { routes } from '@/app/routes';

interface AppProps {
  container: AppContainer;
}

export function App({ container }: AppProps) {
  return (
    <div className="shell">
      <header className="shell-bar">
        <p className="shell-title">Prime Sweets</p>
        <nav aria-label="Secciones">
          <ul className="shell-nav">
            {routes.map(route => (
              <li key={route.path}>
                <NavLink to={route.path}>{route.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/sales-day" replace />} />
          {routes.map(route => (
            <Route key={route.path} path={route.path} element={<Placeholder title={route.label} note={route.note} />} />
          ))}
          <Route path="*" element={<Navigate to="/sales-day" replace />} />
        </Routes>
        <p className="shell-api">
          API configurada en <code>{container.apiBaseUrl}</code>
        </p>
      </main>
    </div>
  );
}

function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <section>
      <h1>{title}</h1>
      <p>{note}</p>
    </section>
  );
}
