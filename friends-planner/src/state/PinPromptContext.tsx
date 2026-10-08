import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Person } from '../../shared/types';
import { ApiError } from '../api/client';
import { PinDialog } from '../components/PinDialog/PinDialog';
import { useSession } from './SessionContext';
import { useToast } from './ToastContext';

interface PinPromptValue {
  /** Always asks for the PIN (used by "This is me"). Resolves true once the device acts as `person`. */
  requestPin: (person: Person) => Promise<boolean>;
  /** Resolves true immediately for admins and when already acting as `person`; otherwise asks for the PIN. */
  ensureActing: (person: Person) => Promise<boolean>;
  /** Runs `action`; if the server answers PIN_REQUIRED, asks for `person`'s PIN and retries once. */
  runAs: <T>(person: Person, action: () => Promise<T>) => Promise<T | undefined>;
}

const PinPromptContext = createContext<PinPromptValue | null>(null);

export function PinPromptProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const { toast } = useToast();
  const [pending, setPending] = useState<Person | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const requestPin = useCallback((person: Person) => {
    return new Promise<boolean>((resolve) => {
      resolver.current?.(false);
      resolver.current = resolve;
      setPending(person);
    });
  }, []);

  const finish = useCallback((ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setPending(null);
  }, []);

  const ensureActing = useCallback(
    async (person: Person) => {
      if (session.admin || session.person?.id === person.id) return true;
      return requestPin(person);
    },
    [session.admin, session.person?.id, requestPin],
  );

  const runAs = useCallback(
    async <T,>(person: Person, action: () => Promise<T>): Promise<T | undefined> => {
      try {
        return await action();
      } catch (caught) {
        if (caught instanceof ApiError && caught.code === 'PIN_REQUIRED') {
          const ok = await requestPin(person);
          if (!ok) return undefined;
          return action();
        }
        throw caught;
      }
    },
    [requestPin],
  );

  const value = useMemo(() => ({ requestPin, ensureActing, runAs }), [requestPin, ensureActing, runAs]);

  return (
    <PinPromptContext.Provider value={value}>
      {children}
      {pending ? (
        <PinDialog
          person={pending}
          onCancel={() => finish(false)}
          onVerified={(person) => {
            session.setActingPerson(person);
            toast(`You're now acting as ${person.name}`);
            finish(true);
          }}
        />
      ) : null}
    </PinPromptContext.Provider>
  );
}

export function usePinPrompt(): PinPromptValue {
  const ctx = useContext(PinPromptContext);
  if (!ctx) throw new Error('usePinPrompt must be used inside PinPromptProvider');
  return ctx;
}
