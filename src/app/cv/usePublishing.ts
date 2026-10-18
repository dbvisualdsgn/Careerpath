// Public / Private for the open CV. Public uploads a copy to the public CV server and keeps it in step
// with every edit; Private deletes that copy, so the link stops working everywhere at once.
import { useCallback, useEffect, useRef, useState } from 'react';
import { isBackendReady, newOwnerToken, newPublicId, publishCV, unpublishCV } from './backend';
import type { PublicMeta } from './library';
import type { CVData } from './types';

export type PublishStatus = 'private' | 'saving' | 'live' | 'error';

interface Options {
  cv: CVData;
  meta: PublicMeta;
  setMeta: (meta: PublicMeta) => void;
  update: (fn: (cv: CVData) => CVData) => void;
}

const REPUBLISH_MS = 2000;

export function usePublishing({ cv, meta, setMeta, update }: Options) {
  const isPublic = Boolean(cv.isPublic && meta.publicId && meta.ownerToken);
  const [status, setStatus] = useState<PublishStatus>(isPublic ? 'live' : 'private');
  const [busy, setBusy] = useState(false);
  // The last version sent, so re-publishing only happens after a real edit.
  const sent = useRef<string | null>(null);

  const send = useCallback(
    async (data: CVData, m: Required<Pick<PublicMeta, 'publicId' | 'ownerToken'>> & { listed: boolean }) => {
      setStatus('saving');
      const body = { ...data, isPublic: true };
      await publishCV({ id: m.publicId, token: m.ownerToken, cv: body, listed: m.listed });
      sent.current = JSON.stringify(body) + m.listed;
      setStatus('live');
    },
    [],
  );

  /** Make the open CV public. Resolves to true when the public copy is live. */
  const makePublic = useCallback(
    async (listed: boolean) => {
      if (!isBackendReady()) return false;
      const publicId = meta.publicId ?? newPublicId();
      const ownerToken = meta.ownerToken ?? newOwnerToken();
      setBusy(true);
      try {
        await send(cv, { publicId, ownerToken, listed });
        setMeta({ publicId, ownerToken, listed });
        update((d) => ({ ...d, isPublic: true }));
        return true;
      } catch {
        setStatus(isPublic ? 'error' : 'private');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [cv, meta, send, setMeta, update, isPublic],
  );

  /** Make the open CV private: delete the public copy first, and only then say it is private. */
  const makePrivate = useCallback(async () => {
    setBusy(true);
    try {
      if (meta.publicId && meta.ownerToken) await unpublishCV({ id: meta.publicId, token: meta.ownerToken });
      sent.current = null;
      setMeta({ ...meta, listed: false });
      update((d) => ({ ...d, isPublic: false }));
      setStatus('private');
      return true;
    } catch {
      setStatus('error');
      return false;
    } finally {
      setBusy(false);
    }
  }, [meta, setMeta, update]);

  /** Show or hide the CV on the Public CVs page. */
  const setListed = useCallback(
    async (listed: boolean) => {
      if (!isPublic) return false;
      setBusy(true);
      try {
        await send(cv, { publicId: meta.publicId!, ownerToken: meta.ownerToken!, listed });
        setMeta({ ...meta, listed });
        return true;
      } catch {
        setStatus('error');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [cv, isPublic, meta, send, setMeta],
  );

  // Keep the public copy in step with edits, a moment after typing stops.
  useEffect(() => {
    if (!isPublic || busy) return;
    const key = JSON.stringify({ ...cv, isPublic: true }) + Boolean(meta.listed);
    if (key === sent.current) return;
    // First look at a public CV in this session: sync right away (it may have been edited offline).
    const t = window.setTimeout(() => {
      send(cv, { publicId: meta.publicId!, ownerToken: meta.ownerToken!, listed: Boolean(meta.listed) }).catch(() => setStatus('error'));
    }, sent.current === null ? 0 : REPUBLISH_MS);
    return () => window.clearTimeout(t);
  }, [cv, isPublic, busy, meta, send]);

  // Switching between CVs in the library (or going public / private): reflect the open one.
  useEffect(() => {
    setStatus(isPublic ? 'live' : 'private');
  }, [meta.publicId, isPublic]);

  return { isPublic, status, busy, makePublic, makePrivate, setListed };
}
