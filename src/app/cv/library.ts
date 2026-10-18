// Several CVs per browser. The library keeps every CV and which one is open; the old single-CV
// storage is migrated into it on first load, so nobody loses their work.
import { useCallback, useEffect, useState } from 'react';
import { blankCV, sampleCV, newId } from './defaultCV';
import { normalize } from './useCV';
import type { CVData } from './types';

export interface CVEntry {
  id: string;
  updatedAt: number;
  cv: CVData;
  /** A version name only the person sees, e.g. "Product Designer, Doctolib". */
  name?: string;
  /** Set once the CV has been made public: its id on the public CV server and the secret that controls it. */
  publicId?: string;
  ownerToken?: string;
  /** Shown on the Public CVs page (only while public). */
  listed?: boolean;
  /** Fingerprint of the version last published, so an unchanged CV is never sent again. */
  publishedHash?: string;
}

export type PublicMeta = Pick<CVEntry, 'publicId' | 'ownerToken' | 'listed' | 'publishedHash'>;

interface Library {
  activeId: string;
  items: CVEntry[];
}

const KEY = 'curricula.library.v1';
const LEGACY_KEY = 'careerpath.cv.v1';

const entry = (cv: CVData, name?: string): CVEntry => ({ id: newId(), updatedAt: Date.now(), cv, ...(name ? { name } : {}) });

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** True when this browser already holds at least one CV the person wrote. */
export const hasSavedCV = () => read(KEY) !== null || read(LEGACY_KEY) !== null;

function load(): Library {
  try {
    const raw = read(KEY);
    if (raw) {
      const lib = JSON.parse(raw) as Library;
      const items = (Array.isArray(lib.items) ? lib.items : [])
        .filter((it) => it && typeof it.id === 'string')
        .map((it) => ({
          id: it.id,
          updatedAt: Number(it.updatedAt) || Date.now(),
          cv: normalize(it.cv),
          ...(typeof it.name === 'string' && it.name ? { name: it.name } : {}),
          ...(typeof it.publicId === 'string' && /^[a-z0-9]{10}$/.test(it.publicId) ? { publicId: it.publicId } : {}),
          ...(typeof it.ownerToken === 'string' && it.ownerToken.length >= 32 ? { ownerToken: it.ownerToken } : {}),
          ...(it.listed === true ? { listed: true } : {}),
          ...(typeof it.publishedHash === 'string' ? { publishedHash: it.publishedHash.slice(0, 20) } : {}),
        }));
      if (items.length) {
        return { activeId: items.some((i) => i.id === lib.activeId) ? lib.activeId : items[0].id, items };
      }
    }
    const legacy = read(LEGACY_KEY);
    if (legacy) {
      const first = entry(normalize(JSON.parse(legacy)));
      return { activeId: first.id, items: [first] };
    }
  } catch {
    // Corrupted storage: start again from the sample.
  }
  const first = entry(structuredClone(sampleCV));
  return { activeId: first.id, items: [first] };
}

export function useLibrary() {
  const [lib, setLib] = useState<Library>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lib));
    } catch {
      // Quota or privacy mode: the CVs still work for this session.
    }
  }, [lib]);

  const active = lib.items.find((i) => i.id === lib.activeId) ?? lib.items[0];

  /** Edit the open CV. */
  const update = useCallback(
    (fn: (cv: CVData) => CVData) =>
      setLib((l) => ({
        ...l,
        items: l.items.map((i) => (i.id === l.activeId ? { ...i, cv: fn(i.cv), updatedAt: Date.now() } : i)),
      })),
    [],
  );
  /** Replace the open CV (reset to sample, edit a copy of a shared one). */
  const setCV = useCallback((cv: CVData) => update(() => cv), [update]);

  /** Add a CV to the library and open it. */
  const create = useCallback((cv: CVData = structuredClone(blankCV), name?: string) => {
    const e = entry(cv, name);
    setLib((l) => ({ activeId: e.id, items: [e, ...l.items] }));
    return e.id;
  }, []);

  /** Copy the open CV as a new named version and open the copy; the original stays as it was.
   *  The copy starts private: it has its own public life, if any. */
  const duplicate = useCallback(
    (name: string) => create({ ...structuredClone(active.cv), isPublic: false }, name.trim() || undefined),
    [active, create],
  );

  /** Remember (or forget) the open CV's public id, owner secret and listing choice. */
  const setPublicMeta = useCallback(
    (meta: PublicMeta) => setLib((l) => ({ ...l, items: l.items.map((i) => (i.id === l.activeId ? { ...i, ...meta } : i)) })),
    [],
  );

  /** Rename the open version. */
  const rename = useCallback(
    (name: string) => setLib((l) => ({ ...l, items: l.items.map((i) => (i.id === l.activeId ? { ...i, name: name || undefined } : i)) })),
    [],
  );

  const select = useCallback((id: string) => setLib((l) => (l.items.some((i) => i.id === id) ? { ...l, activeId: id } : l)), []);

  /** Delete a CV; the library is never empty (a blank CV takes the last one's place). */
  const remove = useCallback(
    (id: string) =>
      setLib((l) => {
        const items = l.items.filter((i) => i.id !== id);
        if (!items.length) {
          const e = entry(structuredClone(blankCV));
          return { activeId: e.id, items: [e] };
        }
        return { activeId: l.activeId === id ? items[0].id : l.activeId, items };
      }),
    [],
  );

  const publicMeta: PublicMeta = { publicId: active.publicId, ownerToken: active.ownerToken, listed: active.listed, publishedHash: active.publishedHash };
  return {
    cv: active.cv, activeId: active.id, versionName: active.name ?? '', publicMeta, items: lib.items,
    update, setCV, create, duplicate, rename, setPublicMeta, select, remove,
  };
}
