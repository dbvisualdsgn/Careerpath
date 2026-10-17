import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import { I18nProvider } from '../app/i18n';
import { People } from './People';
import '../styles/index.css';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <I18nProvider>
      <People />
    </I18nProvider>
  </ThemeProvider>,
);
