
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Lanc = {
  id: number;
  created_at: string;
  inventario: string;
  computador: string;
  operador: string;
  endereco: string;
  material: string;
  quantidade: number;
  observacao: string | null;
};

export default function Painel() {
  const [lancs, setLancs] = useState<Lanc[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroInv, setFiltroInv] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("inventario_lancamentos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (!error && data) setLancs(data as Lanc[]);
      setLoading(false);
    }
    load();

    // Realtime: escuta INSERTs
    const channel = supabase
      .channel("rt-inventario")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "inventario_lancamentos" },
        (payload: any) => {
          setLancs(prev => [payload.new as Lanc, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return lancs.filter(l => {
      if (filtroInv && l.inventario !== filtroInv) return false;
      if (!q) return true;
      return (
        l.operador.toLowerCase().includes(q) ||
        l.computador.toLowerCase().includes(q) ||
        l.endereco.toLowerCase().includes(q) ||
        l.material.toLowerCase().includes(q)
      );
    });
  }, [lancs, busca, filtroInv]);

  const totalQtd = useMemo(() => filtrados.reduce((acc, l) => acc + (l.quantidade || 0), 0), [filtrados]);

  function exportCSV() {
    const lines = [
      ["id","created_at","inventario","computador","operador","endereco","material","quantidade","observacao"].join(";"),
      ...filtrados.map(l => [
        l.id, l.created_at, l.inventario, l.computador, l.operador, l.endereco, l.material, l.quantidade, (l.observacao ?? "")
      ].join(";"))
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventario.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const inventarios = Array.from(new Set(lancs.map(l=>l.inventario)));

  return (
    <div className="card">
      <div className="flex">
        <h2>📊 Painel (tempo real)</h2>
        <span className="right badge">{loading ? "Carregando..." : filtrados.length + " lançamentos"}</span>
      </div>

      <div className="grid">
        <div>
          <label>Busca (operador, computador, endereço, material)</label>
          <input value={busca} onChange={(e)=>setBusca(e.target.value)} placeholder="Digite para filtrar..." />
        </div>
        <div>
          <label>Filtrar por Inventário</label>
          <select value={filtroInv} onChange={(e)=>setFiltroInv(e.target.value)}>
            <option value="">Todos</option>
            {inventarios.map(inv => <option key={inv} value={inv}>{inv}</option>)}
          </select>
        </div>
        <div>
          <label>Total de Quantidades (filtradas)</label>
          <input value={totalQtd} readOnly />
        </div>
        <div className="flex" style={{alignItems:"end"}}>
          <button onClick={exportCSV}>Exportar CSV</button>
        </div>
      </div>

      <div style={{marginTop:16}}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Quando</th>
              <th>Inventário</th>
              <th>Computador</th>
              <th>Operador</th>
              <th>Endereço</th>
              <th>Material</th>
              <th>Qtd</th>
              <th>Obs</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map(l => (
              <tr key={l.id}>
                <td>{l.id}</td>
                <td className="muted">{new Date(l.created_at).toLocaleString()}</td>
                <td>{l.inventario}</td>
                <td>{l.computador}</td>
                <td>{l.operador}</td>
                <td>{l.endereco}</td>
                <td>{l.material}</td>
                <td>{l.quantidade}</td>
                <td className="muted">{l.observacao || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
