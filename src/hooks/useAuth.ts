import { useEffect, useState } from "react";
import { checkAuthFn, loginFn, logoutFn, type AppRole } from "@/lib/auth.functions";

export interface AuthState {
  isAuthenticated: boolean;
  loaded: boolean;
  role: AppRole | null;
  timeId: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    loaded: false,
    role: null,
    timeId: null,
  });

  const refresh = async () => {
    try {
      const r = await checkAuthFn();
      setState({
        isAuthenticated: r.authed,
        loaded: true,
        role: r.role,
        timeId: r.timeId,
      });
    } catch {
      setState((s) => ({ ...s, loaded: true }));
    }
  };

  useEffect(() => {
    let cancelled = false;
    checkAuthFn()
      .then((r) => {
        if (cancelled) return;
        setState({
          isAuthenticated: r.authed,
          loaded: true,
          role: r.role,
          timeId: r.timeId,
        });
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, loaded: true }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (code: string) => {
    try {
      const r = await loginFn({ data: { code } });
      if (r.ok) {
        setState({ isAuthenticated: true, loaded: true, role: r.role, timeId: r.timeId });
        return { ok: true as const, role: r.role };
      }
    } catch {
      /* ignore */
    }
    return { ok: false as const };
  };

  const logout = async () => {
    try {
      await logoutFn();
    } catch {
      /* ignore */
    }
    setState({ isAuthenticated: false, loaded: true, role: null, timeId: null });
  };

  return { ...state, login, logout, refresh };
}
