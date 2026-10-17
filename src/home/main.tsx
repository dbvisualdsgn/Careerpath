import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import { I18nProvider } from '../app/i18n';
import { Home } from './Home';
import '../styles/index.css';

// Share links used to point at the site root; send them on to the CV tool.
if (window.location.hash.startsWith('#cv=')) {
  window.location.replace(`app/${window.location.hash}`);
} else {
  createRoot(document.getElementById('root')!).render(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <I18nProvider>
        <Home />
      </I18nProvider>
    </ThemeProvider>,
  );
}
