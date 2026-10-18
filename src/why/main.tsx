import { createRoot } from 'react-dom/client';
import { I18nProvider } from '../app/i18n';
import { Why } from './Why';
import '../styles/index.css';

createRoot(document.getElementById('root')!).render(
  <I18nProvider>
      <Why />
    </I18nProvider>,
);
