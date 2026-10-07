"use client";
import { useSyncExternalStore } from "react";
type Snapshot<T> = { value: T; warning: string | null } | null;
/** One store per key; no writes before hydration. Storage errors remain visible. */
export function createStore<T>(
  key: string,
  initial: () => T,
  validate: (v: unknown) => v is T,
  normalize: (v: unknown) => unknown = (v) => v,
) {
  let snapshot: Snapshot<T> = null;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  const read = () => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const value: unknown = normalize(JSON.parse(raw));
        if (validate(value)) return { value, warning: null };
        return {
          value: initial(),
          warning:
            "Os dados locais estavam inválidos. Iniciamos um novo estado.",
        };
      }
      return { value: initial(), warning: null };
    } catch {
      return {
        value: snapshot?.value ?? initial(),
        warning:
          "Armazenamento indisponível. As alterações podem se perder ao sair.",
      };
    }
  };
  const persist = () => {
    if (!snapshot) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(snapshot.value));
    } catch {
      snapshot = {
        ...snapshot,
        warning:
          "Não foi possível salvar. Libere espaço ou permita o armazenamento do navegador.",
      };
    }
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) {
      snapshot = read();
      emit();
    }
  };
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    if (listeners.size === 1) {
      window.addEventListener("storage", onStorage);
      snapshot = read();
      persist();
      emit();
    }
    return () => {
      listeners.delete(listener);
      if (!listeners.size) window.removeEventListener("storage", onStorage);
    };
  };
  const getSnapshot = () => snapshot;
  const getServerSnapshot = () => null;
  return {
    useValue: () =>
      useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot),
    update: (updater: (value: T) => T) => {
      if (!snapshot) return;
      const value = updater(snapshot.value);
      if (!validate(value)) throw new Error("Estado inválido não foi salvo.");
      snapshot = { value, warning: snapshot.warning };
      persist();
      emit();
    },
  };
}
