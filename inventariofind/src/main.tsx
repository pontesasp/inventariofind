
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import "./styles.css";
import { AuthProvider, useAuth } from "./lib/auth";
import Login from "./pages/Login";
import Lancar from "./pages/Lancar";
import PainelAdmin from "./pages/PainelAdmin";
function Layout() {
  const { session, profile } = useAuth();
  return (
    <div className="container">
      <div className="title">Inventário em Tempo Real</div>
      <div style={{display:"flex", justifyContent:"flex-end", gap:12}}>
        {profile?.role === "admin" && <Link to="/">📊 Painel</Link>}
        <Link to="/lancar">➕ Lançar</Link>
        {session ? <a onClick={()=>{localStorage.clear(); location.href="/login"}}>Sair</a> : <Link to="/login">Login</Link>}
      </div>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/lancar" element={<RequireAuth><Lancar /></RequireAuth>} />
        <Route path="/" element={<RequireAdmin><PainelAdmin /></RequireAdmin>} />
        <Route path="*" element={<Navigate to={session ? (profile?.role === "admin" ? "/" : "/lancar") : "/login"} replace />} />
      </Routes>
    </div>
  );
}
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="card">Carregando…</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <div className="card">Carregando…</div>;
  if (!session) return <Navigate to="/login" replace />;
  if (profile?.role !== "admin") return <Navigate to="/lancar" replace />;
  return <>{children}</>;
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider><BrowserRouter><Layout /></BrowserRouter></AuthProvider>
  </React.StrictMode>
);
