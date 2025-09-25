
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Row = {
  id: number;
  created_at: string;
  inventory_id: number;
  endereco: string;
  material: string;
  quantidade: number;
  user_id: string;
};
type Inventory = { id: number; name: string };

type Profile = { id: string; display_name: string | null };


function statusFrom(rows: Row[]) {
  const uids = new Set(rows.map(r => r.user_id));
  const bySig = new Map<string, number>(); // material|qtd -> count
  for (const r of rows) {
    const key = `${r.material}|${r.quantidade}`;
    bySig.set(key, (bySig.get(key) || 0) + 1);
  }
  const pairs = Array.from(bySig.entries());
  const majority = pairs.find(([k, v]) => v >= 2);
  if (rows.length === 1) return { code: "AGUARDANDO_2", hint: "Precisa 2ª contagem (outro usuário)." };
  if (rows.length === 2) {
    if (uids.size < 2) return { code: "AGUARDANDO_USUARIO_DIF", hint: "Mesmo usuário; precisa outro usuário." };
    if (pairs.length === 1) return { code: "CORRETO", hint: "1ª e 2ª bateram." };
    return { code: "DIVERGENTE", hint: "Solicitar 3ª contagem." };
  }
  // >=3
  if (majority) return { code: "CORRETO_3", hint: "Maioria confirmou." };
  return { code: "DIVERGENTE", hint: "Sem consenso após 3 contagens." };
}

export default function PainelAdmin() {
  const [inv, setInv] = useState<Inventory | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [busca, setBusca] = useState("");

  // cache de perfis para mostrar o nome do operador
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

  function userName(uid?: string) {
    if (!uid) return "";
    return profiles[uid]?.display_name || uid.slice(0, 8);
  }

  useEffect(() => {
    async function loadInv() {
      const name = import.meta.env.VITE_DEFAULT_INVENTORY || "INVENTARIO 01";
      const { data } = await supabase.from("inventories").select("id,name").eq("name", name).maybeSingle();
      if (data) setInv(data as any);
    }
    loadInv();
  }, []);

  useEffect(() => {
    if (!inv) return;
    async function load() {
      const { data, error } = await supabase
        .from("contagens")
        .select("*")
        .eq("inventory_id", inv.id)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (!error && data) {
        setRows(data as any);
        const userIds = Array.from(new Set((data as Row[]).map(r => r.user_id)));
        if (userIds.length) {
          const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", userIds);
          if (profs) {
            const map: Record<string, Profile> = {};
            for (const p of profs as any[]) map[p.id] = p as Profile;
            setProfiles(map);
          }
        }
      }
    }
    load();
    const chan = supabase.channel("rt-contagens")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contagens" }, (payload) => {
        const r = payload.new as Row;
        if (inv && r.inventory_id === inv.id) {
          setRows(prev => [r, ...prev]);
          if (!profiles[r.user_id]) {
            supabase.from("profiles").select("id, display_name").eq("id", r.user_id).maybeSingle().then(({data}) => {
              if (data) setProfiles(prev => ({...prev, [data.id]: data as Profile}));
            });
          }
        }
      })
      .subscribe();
  
function exportCSV(){
  // Cabeçalho
  const headers = ["Endereço","Material","1ª - Operador","1ª - Quantidade","1ª - Hora","2ª - Operador","2ª - Quantidade","2ª - Hora","3ª - Operador","3ª - Quantidade","3ª - Hora","Status"];
  const rowsOut: string[] = [];
  const sep = ";";
  // UTF-8 BOM to help Excel PT-BR
  const bom = "\ufeff";

  function cell(v:any){ 
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return `"${s}"`; 
  }

  const headerLine = headers.map(cell).join(sep);
  rowsOut.push(headerLine);

  for (const g of grupos){
    const items = g.items;
    const c1 = items[0]; const c2 = items[1]; const c3 = items[2];
    const st = g.st.code;
    const line = [
      g.endereco,
      g.material,
      c1 ? userName(c1.user_id) : "",
      c1 ? c1.quantidade : "",
      c1 ? new Date(c1.created_at).toLocaleTimeString() : "",
      c2 ? userName(c2.user_id) : "",
      c2 ? c2.quantidade : "",
      c2 ? new Date(c2.created_a
<div className="grid">
  <div>
    <label>Buscar por endereço/material</label>
    <input value={busca} onChange={(e)=>setBusca(e.target.value)} placeholder="A0101 / 12345-ARI-I" />
  </div>
  <div style={{alignSelf:"end"}}>
    <button className="btn" onClick={exportCSV}>⬇️ Exportar CSV</button>
  </div>
</div>
ew Blob([bom + rowsOut.join("\n")], {type: "text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = (inv?.name || "inventario") + ".csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
  return ()=> { supabase.removeChannel(chan); };
  }, [inv]);

  // group by endereco+material
  const grupos = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const r of rows) {
      const k = `${r.endereco}__${r.material}`;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    for (const arr of map.values()) arr.sort((a,b)=>a.created_at.localeCompare(b.created_at));
    const arr = Array.from(map.entries()).map(([key, items]) => {
      const [endereco, material] = key.split("__");
      return { endereco, material, items, st: statusFrom(items) };
    });
    const q = busca.trim().toLowerCase();
    return arr.filter(g => !q || g.endereco.toLowerCase().includes(q) || g.material.toLowerCase().includes(q));
  }, [rows, busca]);

  return (
    <div className="card">
      <div className="flex">
        <h2>📊 Painel do Admin — {inv?.name || "..."}</h2>
        <span className="right badge">{grupos.length} endereços/material</span>
      </div>

      <div className="grid">
        <div>
          <label>Buscar por endereço/material</label>
          <input value={busca} onChange={(e)=>setBusca(e.target.value)} placeholder="A0101 / 12345-ARI-I" />
        </div>
      </div>

      <div style={{marginTop:16}}>
        <table>
          <thead>
            <tr>
              <th>Endereço</th>
              <th>Material</th>
              <th>1ª</th>
              <th>2ª</th>
              <th>3ª</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {grupos.map(g => {
              const [c1, c2, c3] = g.items;
              const st = g.st.code;
              const cls = st.startsWith("CORRETO") ? "status-ok" : (st.includes("AGUARD") ? "status-warn" : "status-err");
              const fmt = (c?: Row) => c ? `${new Date(c.created_at).toLocaleTimeString()} — ${c.quantidade} (${userName(c.user_id)})` : "-";
              return (
                <tr key={`${g.endereco}-${g.material}`}>
                  <td><strong>{g.endereco}</strong></td>
                  <td>{g.material}</td>
                  <td>{fmt(c1)}</td>
                  <td>{fmt(c2)}</td>
                  <td>{fmt(c3)}</td>
                  <td className={cls}>
                    {st.replace("_"," ").replace("_"," ")} <span className="muted">• {g.st.hint}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
