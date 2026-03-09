"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useConvex, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

type ImpersonationSession = {
  _id: string;
  targetUserId: string;
  startedAt: number;
};

type ImpersonationState = {
  canImpersonate: boolean;
  activeSession: ImpersonationSession | null;
};

type ImpersonationContextValue = {
  asUserId?: string;
  canImpersonate: boolean;
  activeSession: ImpersonationSession | null;
  startImpersonation: (targetUserId: string, reason?: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
};

const DEFAULT_STATE: ImpersonationState = {
  canImpersonate: false,
  activeSession: null,
};

const ImpersonationContext = createContext<ImpersonationContextValue>({
  asUserId: undefined,
  canImpersonate: false,
  activeSession: null,
  startImpersonation: async () => {},
  stopImpersonation: async () => {},
});

export function ImpersonationProvider({ children }: { children: React.ReactNode }) {
  const convex = useConvex();
  const start = useMutation(api.crystal.impersonation.startImpersonation);
  const stop = useMutation(api.crystal.impersonation.stopImpersonation);
  const [state, setState] = useState<ImpersonationState>(DEFAULT_STATE);

  const refresh = useCallback(async () => {
    try {
      const next = await convex.query(api.crystal.impersonation.getImpersonationState, {});
      setState({
        canImpersonate: next?.canImpersonate ?? false,
        activeSession: (next?.activeSession as ImpersonationSession | null | undefined) ?? null,
      });
    } catch {
      // Impersonation is optional; never let this break dashboard rendering.
      setState(DEFAULT_STATE);
    }
  }, [convex]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value: ImpersonationContextValue = useMemo(
    () => ({
      asUserId: state.activeSession?.targetUserId,
      canImpersonate: state.canImpersonate,
      activeSession: state.activeSession,
      startImpersonation: async (targetUserId: string, reason?: string) => {
        await start({ targetUserId, reason });
        await refresh();
      },
      stopImpersonation: async () => {
        await stop({});
        await refresh();
      },
    }),
    [refresh, start, state.activeSession, state.canImpersonate, stop],
  );

  return <ImpersonationContext.Provider value={value}>{children}</ImpersonationContext.Provider>;
}

export function useImpersonation() {
  return useContext(ImpersonationContext);
}
