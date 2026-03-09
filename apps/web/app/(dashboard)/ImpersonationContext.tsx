"use client";

import { createContext, useContext } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

type ImpersonationSession = {
  _id: string;
  targetUserId: string;
  startedAt: number;
};

type ImpersonationContextValue = {
  asUserId?: string;
  canImpersonate: boolean;
  activeSession: ImpersonationSession | null;
  startImpersonation: (targetUserId: string, reason?: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
};

const ImpersonationContext = createContext<ImpersonationContextValue>({
  asUserId: undefined,
  canImpersonate: false,
  activeSession: null,
  startImpersonation: async () => {},
  stopImpersonation: async () => {},
});

export function ImpersonationProvider({ children }: { children: React.ReactNode }) {
  const state = useQuery(api.crystal.impersonation.getImpersonationState, {});
  const start = useMutation(api.crystal.impersonation.startImpersonation);
  const stop = useMutation(api.crystal.impersonation.stopImpersonation);

  const value: ImpersonationContextValue = {
    asUserId: state?.activeSession?.targetUserId,
    canImpersonate: state?.canImpersonate ?? false,
    activeSession: (state?.activeSession as ImpersonationSession | null | undefined) ?? null,
    startImpersonation: async (targetUserId: string, reason?: string) => {
      await start({ targetUserId, reason });
    },
    stopImpersonation: async () => {
      await stop({});
    },
  };

  return <ImpersonationContext.Provider value={value}>{children}</ImpersonationContext.Provider>;
}

export function useImpersonation() {
  return useContext(ImpersonationContext);
}
