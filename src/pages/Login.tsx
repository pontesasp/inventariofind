
import { FormEvent, useState } from "react";
import { useAuth } from "../lib/auth";
import { useNavigate, useLocation } from "react-router-dom";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"login"|"signup">("login");
  const [msg, setMsg] = useState<string| null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from?.pathname || "/";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null); setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) setMsg(error.message || String(error));
        else navigate(from, { replace: true });
      } else {
        const { error } = await signUp(email, password, name);
        if (error) setMsg(error.message || String(error));
        else setMsg("Cadastro realizado. Verifique seu e-mail ou faça login.");
        setMode("login");
      }
    } catch (e:any) {
      setMsg(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>{mode === "login" ? "Entrar" : "Criar conta"}</h2>
      <form onSubmit={onSubmit} className="grid">
        {mode === "signup" && (
          <div>
            <label>Nome</label>
            <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Seu nome" />
          </div>
        )}
        <div>
          <label>E-mail</label>
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="email@empresa.com" />
        </div>
        <div>
          <label>Senha</label>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div style={{gridColumn:"1 / -1"}} className="flex">
          <button type="submit" disabled={loading}>{mode === "login" ? "Entrar" : "Cadastrar"}</button>
          <a href="#" onClick={(e)=>{e.preventDefault(); setMode(mode==="login"?"signup":"login");}}>
            {mode === "login" ? "Criar conta" : "Já tenho conta"}
          </a>
        </div>
        {msg && <div style={{gridColumn:"1 / -1"}}><div className="card" style={{background:"#0f172a"}}>{msg}</div></div>}
      </form>
      <div className="muted" style={{marginTop:8}}>
        Dicas: habilite o provedor <b>Email/Password</b> no Supabase e, se necessário, desative <b>Confirm email</b> durante os testes.
      </div>
    </div>
  );
}
