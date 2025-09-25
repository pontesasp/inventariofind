
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/auth";
export default function Lancar() {
  const { session } = useAuth();
  const [invId, setInvId] = useState<number | null>(null);
  const [endereco, setEndereco] = useState(""); const [material, setMaterial] = useState("");
  const [quantidade, setQuantidade] = useState<number | "">(""); const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { (async()=>{
    const name = import.meta.env.VITE_DEFAULT_INVENTORY || "INVENTARIO 01";
    const { data } = await supabase.from("inventories").select("id").eq("name", name).maybeSingle();
    if (data) setInvId(data.id);
  })(); }, []);
  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setMsg(null); setErr(null);
    if (!invId || !session?.user?.id) { setErr("Sem inventário/usuário."); return; }
    if (!endereco || !material || quantidade === "" || isNaN(Number(quantidade))) {
      setErr("Preencha Endereço, Material e Quantidade válida."); return;
    }
    const { error } = await supabase.from("contagens").insert({
      inventory_id: invId, endereco: endereco.trim().toUpperCase(),
      material: material.trim().toUpperCase(), quantidade: Number(quantidade),
      user_id: session.user.id
    });
    if (error) setErr(error.message); else { setMsg("Lançamento salvo!"); setQuantidade(""); }
  }
  return (
    <div className="card" style={{maxWidth:800, margin:"0 auto"}}>
      <h3>➕ Lançar Itens</h3>
      <form onSubmit={salvar} className="grid">
        <div><label>Endereço*</label><input value={endereco} onChange={e=>setEndereco(e.target.value)} required /></div>
        <div><label>Material*</label><input value={material} onChange={e=>setMaterial(e.target.value)} required /></div>
        <div><label>Quantidade*</label><input type="number" value={quantidade} onChange={e=>setQuantidade(e.target.value===""?"":Number(e.target.value))} required /></div>
        <div style={{gridColumn:"1 / -1"}}><button className="btn" type="submit">Salvar lançamento</button></div>
      </form>
      {msg && <div className="status-ok" style={{marginTop:10}}>{msg}</div>}
      {err && <div className="status-err" style={{marginTop:10}}>{err}</div>}
    </div>
  );
}
