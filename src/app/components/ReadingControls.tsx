import { TypeSwitcher } from './TypeSwitcher';
import { LanguageSwitcher } from './LanguageSwitcher';
import { PaperControls } from './PaperControls';

/** Typefaces, language and light: same-height buttons, evenly spaced and centred on one line.
 *  The CV page adds Skim view after them, since it also changes how the page reads. */
export function ReadingControls({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      <TypeSwitcher />
      <LanguageSwitcher />
      <PaperControls />
      {children}
    </div>
  );
}
