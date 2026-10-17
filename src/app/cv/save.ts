// Saves a generated file with a normal browser download.

export type SaveOutcome = 'saved' | 'failed';

export async function saveFile(filename: string, data: Blob | string, type = 'application/octet-stream'): Promise<SaveOutcome> {
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
