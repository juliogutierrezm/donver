import { useEffect, useState } from "react";
import {
  restoreAuthSession,
  getAuthSession,
  getUserExperienceMode,
  isAuthenticated,
  subscribeAuthSession,
  type UserExperienceMode,
} from "@/services/api";
import type { User } from "@/types";

export function useAuthSessionUser() {
  const [sessionUser, setSessionUser] = useState<User | null>(() => getAuthSession()?.user ?? null);
  const [authenticated, setAuthenticated] = useState(() => isAuthenticated());

  useEffect(() => {
    const syncSession = () => {
      const session = getAuthSession();
      setSessionUser(session?.user ?? null);
      setAuthenticated(isAuthenticated());
    };

    syncSession();
    void restoreAuthSession().catch(() => undefined);
    return subscribeAuthSession(syncSession);
  }, []);

  return {
    authenticated,
    user: sessionUser,
    experienceMode: getUserExperienceMode(sessionUser) as UserExperienceMode,
  };
}
