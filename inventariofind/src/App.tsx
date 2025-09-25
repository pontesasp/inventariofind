
import { Routes, Route, NavLink, Navigate, useLocation } from "react-router-dom";
import Painel from "./pages/PainelAdmin";
import Lancar from "./pages/Lancar";
import Login from "./pages/Login";
import { useAuth } from "./lib/auth";

function ProtectedAdmin({ children }: { children: JSX.Element }) {
  const { loading, profile } = useAuth();
  const location = useLocation();
  if (loading) return <div className="container"><p>Carregando...</p></div>;
  if (!profile) return <Navigate to="/login" state={{ from: location }} replace />;
  if (profile.role !== "admin") return <Navigate to="/lancar" replace />;
  return children;
}

function ProtectedAny({ children }: { children: JSX.Element }) {
  const { loading, profile } = useAuth();
  const location = useLocation();
  if (loading) return <div className="container"><p>Carregando...</p></div>;
  if (!profile) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export default function App() {
  const { profile, signOut } = useAuth();
  return (
    <div className="container">
      <header className="topbar">
        <h1>Inventário em Tempo Real</h1>
        <nav>
          {profile?.role === "admin" && <NavLink to="/" end>📊 Painel</NavLink>}
          {!!profile && <NavLink to="/lancar">➕ Lançar</NavLink>}
          {!profile && <NavLink to="/login">Login</NavLink>}
          {!!profile && <a href="#" onClick={(e)=>{e.preventDefault(); signOut();}}>Sair</a>}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<ProtectedAdmin><Painel /></ProtectedAdmin>} />
          <Route path="/lancar" element={<ProtectedAny><Lancar /></ProtectedAny>} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </div>
  );
}
