import { createContext, useContext, useEffect, useState, useCallback, forwardRef, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

interface UserTrust {
  id: string;
  user_id: string;
  age_verified: boolean;
  phone_verified: boolean;
  selfie_verified: boolean;
  safety_pledge_accepted: boolean;
  onboarding_step: number;
  onboarding_complete: boolean;
  preferences: Record<string, unknown>;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Tables<"profiles"> | null;
  userTrust: UserTrust | null;
  isLoading: boolean;
  isAdmin: boolean;
  onboardingComplete: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  userTrust: null,
  isLoading: true,
  isAdmin: false,
  onboardingComplete: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [userTrust, setUserTrust] = useState<UserTrust | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchUserData = useCallback(async (userId: string) => {
    const [profileRes, trustRes, roleRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
      supabase.from("user_trust").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle(),
    ]);

    setProfile(profileRes.data);
    setUserTrust(trustRes.data as UserTrust | null);
    setIsAdmin(!!roleRes.data);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setProfile(null);
          setUserTrust(null);
          setIsAdmin(false);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  // Realtime subscription for user_trust changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`trust-${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "user_trust",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new) {
          setUserTrust(payload.new as UserTrust);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setUserTrust(null);
    setIsAdmin(false);
  };

  const onboardingComplete = userTrust?.onboarding_complete ?? false;

  return (
    <AuthContext.Provider value={{ session, user, profile, userTrust, isLoading, isAdmin, onboardingComplete, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
