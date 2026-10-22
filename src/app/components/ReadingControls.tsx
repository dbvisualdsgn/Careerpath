import { TypeSwitcher } from './TypeSwitcher';
import { LanguageSwitcher } from './LanguageSwitcher';
import { PaperControls } from './PaperControls';

/** Typefaces, language and light: same-height buttons, evenly spaced and centred on one line. */
export function ReadingControls() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      <TypeSwitcher />
      <LanguageSwitcher />
      <PaperControls />
    </div>
  );
}
