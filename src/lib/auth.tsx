
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

type Profile = { id: string; display_name: string | null; role: "admin" | "operador" };
type Ctx = {
  session: any;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{error: any}>;
  signUp: (email: string, password: string, name?: string) => Promise<{error: any}>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>(null as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const sub = supabase.auth.onAuthStateChange((_evt, sess) => setSession(sess));
    return () => { sub.data.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    async function ensureProfile() {
      if (!session) { setProfile(null); setLoading(false); return; }
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, role")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!data) {
        await supabase.from("profiles").upsert({
          id: session.user.id,
          display_name: session.user.email,
          role: "operador",
        });
      }
      const again = await supabase
        .from("profiles")
        .select("id, display_name, role")
        .eq("id", session.user.id)
        .maybeSingle();
      if (again.data) setProfile(again.data as any);
      setLoading(false);
    }
    setLoading(true);
    ensureProfile();
  }, [session]);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }
  async function signUp(email: string, password: string, name?: string) {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { name }}});
    return { error };
  }
  async function signOut() { await supabase.auth.signOut(); }

  return (
    <AuthCtx.Provider value={{ session, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() { return useContext(AuthCtx); }
