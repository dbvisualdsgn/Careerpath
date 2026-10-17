// Saves a generated file. Inside claude.ai the page is sandboxed, so files go through the platform's
// `downloads` capability (the viewer confirms the save); everywhere else a normal browser download runs.

interface DownloadsCapability {
  save(request: { filename: string; data: string | Blob }): Promise<{ status: 'saved' | 'delivered' }>;
}
interface ClaudeRuntime {
  use(name: 'downloads'): Promise<DownloadsCapability | null>;
}

const runtime = () => (window as unknown as { claude?: ClaudeRuntime }).claude;

/** True when the page runs inside the claude.ai artifact viewer. */
export const isClaudeEmbedded = () => Boolean(runtime()?.use) && window.top !== window;

export type SaveOutcome = 'saved' | 'declined' | 'failed';

export async function saveFile(filename: string, data: Blob | string, type = 'application/octet-stream'): Promise<SaveOutcome> {
  const claude = runtime();
  if (claude?.use) {
    const downloads = await claude.use('downloads').catch(() => null);
    if (downloads) {
      try {
        await downloads.save({ filename, data });
        return 'saved';
      } catch (err) {
        return (err as { code?: string })?.code === 'declined' ? 'declined' : 'failed';
      }
    }
  }
  try {
    const blob = typeof data === 'string' ? new Blob([data], { type }) : data;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return 'saved';
  } catch {
    return 'failed';
  }
}
