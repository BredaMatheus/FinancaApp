import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

function App() {
  const [transacoes, setTransacoes] = useState([]);

  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    tipo: "entrada",
    categoria: "",
    data: ""
  });

  // carregar transações
  const carregarTransacoes = () => {
    fetch("http://127.0.0.1:8000/transacoes")
      .then(res => res.json())
      .then(data => setTransacoes(data));
  };

  useEffect(() => {
    carregarTransacoes();
    carregarSaldo();
  }, []);

  // atualizar form
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // enviar para API
  const handleSubmit = (e) => {
    e.preventDefault();

    const metodo = editandoId ? "PUT" : "POST";
    const url = editandoId
      ? `http://127.0.0.1:8000/transacoes/${editandoId}`
      : "http://127.0.0.1:8000/transacoes";

    fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...form,
        valor: parseFloat(form.valor)
      })
    })
      .then(() => {
        carregarTransacoes();
        carregarSaldo();
        setForm({
          descricao: "",
          valor: "",
          tipo: "entrada",
          categoria: "",
          data: ""
        });
        setEditandoId(null);
      });
  };

  // carregar saldo
  const [saldo, setSaldo] = useState({
    total_entradas: 0,
    total_saidas: 0,
    saldo: 0
  });
  const carregarSaldo = () => {
    fetch("http://127.0.0.1:8000/saldo")
      .then(res => res.json())
      .then(data => setSaldo(data));
  };

  // deletar transação
  const deletarTransacao = (id) => {
    fetch(`http://127.0.0.1:8000/transacoes/${id}`, {
      method: "DELETE"
    })
      .then(() => {
        carregarTransacoes();
        carregarSaldo();
      });
  };

  // editar transação
  const [editandoId, setEditandoId] = useState(null);
  const editarTransacao = (transacao) => {
    setForm({
      descricao: transacao.descricao,
      valor: transacao.valor,
      tipo: transacao.tipo,
      categoria: transacao.categoria,
      data: transacao.data
    });

    setEditandoId(transacao.id);
  };

  const dataGrafico = [
    { name: "Entradas", value: saldo.total_entradas },
    { name: "Saídas", value: saldo.total_saidas }
  ];

  const COLORS = ["#22c55e", "#ef4444"];

  // agrupar por mês
  const agruparPorMes = () => {
    const mapa = {};

    transacoes.forEach((t) => {
      // pega apenas ano e mês (seguro)
      const [ano, mes] = t.data.split("-");
      const chave = `${ano}-${mes}`;

      if (!mapa[chave]) {
        mapa[chave] = {
          chave,
          mes: `${mes}/${ano}`,
          entradas: 0,
          saidas: 0
        };
      }

      if (t.tipo === "entrada") {
        mapa[chave].entradas += t.valor;
      } else {
        mapa[chave].saidas += t.valor;
      }
    });

    // ordenar cronologicamente
    return Object.values(mapa).sort((a, b) => a.chave.localeCompare(b.chave));
  };
  const dadosMensais = agruparPorMes();


  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        💰 Controle Financeiro
      </h1>

      {/* RESUMO */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-500 text-white p-4 rounded-xl shadow">
          <p>Entradas</p>
          <h2 className="text-xl font-bold">R$ {saldo.total_entradas}</h2>
        </div>

        <div className="bg-red-500 text-white p-4 rounded-xl shadow">
          <p>Saídas</p>
          <h2 className="text-xl font-bold">R$ {saldo.total_saidas}</h2>
        </div>

        <div className="bg-blue-500 text-white p-4 rounded-xl shadow">
          <p>Saldo</p>
          <h2 className="text-xl font-bold">R$ {saldo.saldo}</h2>
        </div>
      </div>

      {/* GRAFICOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

        {/* GRAFICO 1 */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-lg font-bold mb-4 text-center">
            Resumo Visual
          </h2>

          <div className="flex justify-center">
            <PieChart width={300} height={250}>
              <Pie
                data={dataGrafico}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label
              >
                {dataGrafico.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>

              <Tooltip formatter={(value) => `R$ ${value}`} />
              <Legend />
            </PieChart>
          </div>
        </div>

        {/* GRAFICO 2 */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-lg font-bold mb-4 text-center">Evolução Mensal</h2>

          <div className="flex justify-center">
            <LineChart width={300} height={250} data={dadosMensais}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />

              <Line type="monotone" dataKey="entradas" stroke="#22c55e" />
              <Line type="monotone" dataKey="saidas" stroke="#ef4444" />
            </LineChart>
          </div>
        </div>

        {/* GRAFICO 3 (placeholder por enquanto) */}
        <div className="bg-white p-4 rounded-xl shadow flex items-center justify-center">
          <p className="text-gray-500">Gráfico de categorias (em breve)</p>
        </div>

      </div>

      {/* FORM */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h2 className="text-lg font-bold mb-4">
          {editandoId ? "Editar Transação" : "Nova Transação"}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <input
            name="descricao"
            placeholder="Descrição"
            value={form.descricao}
            onChange={handleChange}
            className="border p-2 rounded col-span-2"
          />

          <input
            name="valor"
            type="number"
            placeholder="Valor"
            value={form.valor}
            onChange={handleChange}
            className="border p-2 rounded"
          />

          <select
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>

          <input
            name="categoria"
            placeholder="Categoria"
            value={form.categoria}
            onChange={handleChange}
            className="border p-2 rounded"
          />

          <input
            name="data"
            type="date"
            value={form.data}
            onChange={handleChange}
            className="border p-2 rounded"
          />

          <button
            type="submit"
            className="col-span-2 md:col-span-5 bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            {editandoId ? "Atualizar" : "Adicionar"}
          </button>
        </form>
      </div>

      {/* TABELA */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-bold mb-4">Transações</h2>

        <table className="w-full">
          <thead>
            <tr className="border-b text-left">
              <th>ID</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Tipo</th>
              <th>Categoria</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {transacoes.map((t) => (
              <tr key={t.id} className="border-b hover:bg-gray-50">
                <td>{t.id}</td>
                <td>{t.descricao}</td>

                <td className={t.tipo === "entrada" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                  R$ {t.valor}
                </td>

                <td>{t.tipo}</td>
                <td>{t.categoria}</td>
                <td>{t.data}</td>

                <td className="flex gap-2">
                  <button
                    onClick={() => editarTransacao(t)}
                    className="bg-yellow-400 px-3 py-1 rounded"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => deletarTransacao(t.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Deletar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;