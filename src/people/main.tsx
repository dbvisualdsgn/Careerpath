import { createRoot } from 'react-dom/client';
import { I18nProvider } from '../app/i18n';
import { People } from './People';
import '../styles/index.css';

createRoot(document.getElementById('root')!).render(
  <I18nProvider>
      <People />
    </I18nProvider>,
);
