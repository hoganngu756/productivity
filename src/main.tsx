import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { applyTheme, loadTheme } from './app/theme';
import { createTimerRepository } from './features/timer';
import { storage } from './lib/storage';
import './styles/tokens.css';
import './styles/global.css';

async function bootstrap() {
  const repository = createTimerRepository(storage);
  const [initialTheme, initial] = await Promise.all([loadTheme(), repository.load()]);
  applyTheme(initialTheme);

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App initialTheme={initialTheme} timer={{ initial, repository }} />
    </StrictMode>,
  );
}

void bootstrap();
