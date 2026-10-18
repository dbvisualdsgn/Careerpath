// Public / Private for the open CV. Public uploads a copy to the public CV server and keeps it in step
// with every edit; Private deletes that copy, so the link stops working everywhere at once.
import { useCallback, useEffect, useRef, useState } from 'react';
import { isBackendReady, newOwnerToken, newPublicId, publishCV, unpublishCV } from './backend';
import type { PublicMeta } from './library';
import { normalize } from './useCV';
import type { CVData } from './types';

export type PublishStatus = 'private' | 'saving' | 'live' | 'error';

interface Options {
  cv: CVData;
  meta: PublicMeta;
  setMeta: (meta: PublicMeta) => void;
  update: (fn: (cv: CVData) => CVData) => void;
}

const REPUBLISH_MS = 2000;

/** FNV-1a: a short, fast fingerprint of the version that was published (not for security). */
export function fingerprint(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** What gets published for a CV: the data marked public, plus whether it is listed. Normalised first, so the
 *  same CV gives the same fingerprint whether it was just edited or read back from storage. */
const versionOf = (cv: CVData, listed: boolean) => fingerprint(JSON.stringify(normalize({ ...cv, isPublic: true })) + listed);

export function usePublishing({ cv, meta, setMeta, update }: Options) {
  const { publicId, ownerToken, publishedHash } = meta;
  const listed = Boolean(meta.listed);
  const isPublic = Boolean(cv.isPublic && publicId && ownerToken);
  const [status, setStatus] = useState<PublishStatus>(isPublic ? 'live' : 'private');
  const [busy, setBusy] = useState(false);
  // The version already sent or on its way: claimed before the request, so a re-render never sends it twice.
  const inFlight = useRef<string | null>(null);

  const send = useCallback(async (data: CVData, id: string, token: string, list: boolean) => {
    const version = versionOf(data, list);
    if (inFlight.current === version) return version;
    inFlight.current = version;
    setStatus('saving');
    try {
      await publishCV({ id, token, cv: { ...data, isPublic: true }, listed: list });
    } catch (err) {
      inFlight.current = null;
      throw err;
    }
    setStatus('live');
    return version;
  }, []);

  /** Make the open CV public. Resolves to true when the public copy is live. */
  const makePublic = useCallback(
    async (list: boolean) => {
      if (!isBackendReady()) return false;
      const id = publicId ?? newPublicId();
      const token = ownerToken ?? newOwnerToken();
      setBusy(true);
      try {
        const version = await send(cv, id, token, list);
        setMeta({ publicId: id, ownerToken: token, listed: list, publishedHash: version });
        update((d) => ({ ...d, isPublic: true }));
        return true;
      } catch {
        setStatus(isPublic ? 'error' : 'private');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [cv, publicId, ownerToken, send, setMeta, update, isPublic],
  );

  /** Make the open CV private: delete the public copy first, and only then say it is private. */
  const makePrivate = useCallback(async () => {
    setBusy(true);
    try {
      if (publicId && ownerToken) await unpublishCV({ id: publicId, token: ownerToken });
      inFlight.current = null;
      setMeta({ publicId, ownerToken, listed: false, publishedHash: undefined });
      update((d) => ({ ...d, isPublic: false }));
      setStatus('private');
      return true;
    } catch {
      setStatus('error');
      return false;
    } finally {
      setBusy(false);
    }
  }, [publicId, ownerToken, setMeta, update]);

  /** Show or hide the CV on the Public CVs page. */
  const setListed = useCallback(
    async (list: boolean) => {
      if (!isPublic) return false;
      setBusy(true);
      try {
        const version = await send(cv, publicId!, ownerToken!, list);
        setMeta({ publicId, ownerToken, listed: list, publishedHash: version });
        return true;
      } catch {
        setStatus('error');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [cv, isPublic, publicId, ownerToken, send, setMeta],
  );

  // Keep the public copy in step with edits, a moment after typing stops. Nothing is sent when the
  // current version is the one already published (so opening the app, or a second tab, sends nothing).
  const version = isPublic ? versionOf(cv, listed) : null;
  useEffect(() => {
    if (!version || busy || version === publishedHash || version === inFlight.current) return;
    const t = window.setTimeout(() => {
      send(cv, publicId!, ownerToken!, listed)
        .then((v) => setMeta({ publicId, ownerToken, listed, publishedHash: v }))
        .catch(() => setStatus('error'));
    }, REPUBLISH_MS);
    return () => window.clearTimeout(t);
    // cv is captured through `version`, which changes whenever the CV does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, busy, publishedHash, publicId, ownerToken, listed, send, setMeta]);

  // Switching between CVs in the library (or going public / private): reflect the open one.
  useEffect(() => {
    setStatus(isPublic ? 'live' : 'private');
  }, [publicId, isPublic]);

  return { isPublic, status, busy, makePublic, makePrivate, setListed };
}
