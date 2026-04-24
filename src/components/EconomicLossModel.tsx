import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Layers, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Calculator, 
  Info, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Activity,
  Plus,
  Trash2,
  Settings2,
  Package,
  Home,
  Users,
  HardHat,
  ShoppingBag
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface CostItem {
  id: string;
  name: string;
  unit: string;
  unitCost: number;
  quantity: number;
  category: 'CAPA2_REPOSICION' | 'CAPA3_NECESIDAD';
  icon: React.ReactNode;
}

const INITIAL_ITEMS: CostItem[] = [
  { id: '1', name: 'Viviendas Dañadas', unit: 'Unidad', unitCost: 45000000, quantity: 120, category: 'CAPA2_REPOSICION', icon: <Home size={16} /> },
  { id: '2', name: 'Infraestructura Vial', unit: 'km', unitCost: 850000000, quantity: 5, category: 'CAPA2_REPOSICION', icon: <HardHat size={16} /> },
  { id: '3', name: 'Población Afectada (Subsidio)', unit: 'Persona', unitCost: 500000, quantity: 1500, category: 'CAPA2_REPOSICION', icon: <Users size={16} /> },
  { id: '4', name: 'Mercados de Emergencia', unit: 'Kit', unitCost: 150000, quantity: 2000, category: 'CAPA3_NECESIDAD', icon: <ShoppingBag size={16} /> },
  { id: '5', name: 'Agua Potable (Carrotanques)', unit: 'Viaje', unitCost: 450000, quantity: 50, category: 'CAPA3_NECESIDAD', icon: <Package size={16} /> },
];

export const EconomicLossModel: React.FC<{ municipioName?: string }> = ({ municipioName }) => {
  const [items, setItems] = useState<CostItem[]>(INITIAL_ITEMS);
  const [isParametrizing, setIsParametrizing] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', unit: '', unitCost: 0, quantity: 0, category: 'CAPA3_NECESIDAD' as const });

  const addItem = () => {
    if (!newItem.name) return;
    const item: CostItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newItem.name,
      unit: newItem.unit,
      unitCost: newItem.unitCost,
      quantity: newItem.quantity,
      category: newItem.category,
      icon: <Package size={16} />
    };
    setItems([...items, item]);
    setNewItem({ name: '', unit: '', unitCost: 0, quantity: 0, category: 'CAPA3_NECESIDAD' });
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof CostItem, value: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const totals = useMemo(() => {
    const capa2 = items.filter(i => i.category === 'CAPA2_REPOSICION').reduce((acc, i) => acc + (i.unitCost * i.quantity), 0);
    const capa3 = items.filter(i => i.category === 'CAPA3_NECESIDAD').reduce((acc, i) => acc + (i.unitCost * i.quantity), 0);
    return { capa2, capa3, total: capa2 + capa3 };
  }, [items]);

  const chartData = useMemo(() => {
    return items.map(i => ({
      name: i.name,
      total: i.unitCost * i.quantity,
      category: i.category === 'CAPA2_REPOSICION' ? 'Reposición' : 'Necesidad'
    }));
  }, [items]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header & Parametrization Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <TrendingUp className="text-indigo-600" /> Cuantificación Paramétrica PMU {municipioName ? `- ${municipioName}` : ''}
          </h2>
          <p className="text-sm text-slate-500 font-medium">Cálculo Particular de Costos de Reposición (Capa 2) y Necesidades (Capa 3) {municipioName ? `para ${municipioName}` : ''}</p>
        </div>
        
        <button 
          onClick={() => setIsParametrizing(!isParametrizing)}
          className={`px-6 py-3 rounded-2xl font-black text-xs transition-all flex items-center gap-2 uppercase tracking-widest ${
            isParametrizing ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          <Settings2 size={16} />
          {isParametrizing ? 'Finalizar Ajuste' : 'Parametrizar Costos'}
        </button>
      </div>

      {/* Parametrization Table */}
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item / Categoría</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidad</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Costo Unitario (COP)</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cantidad</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal</th>
                {isParametrizing && <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acción</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${item.category === 'CAPA2_REPOSICION' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{item.name}</p>
                        <p className={`text-[9px] font-bold uppercase tracking-tighter ${item.category === 'CAPA2_REPOSICION' ? 'text-indigo-400' : 'text-amber-400'}`}>
                          {item.category === 'CAPA2_REPOSICION' ? 'Capa 2: Reposición' : 'Capa 3: Necesidad'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{item.unit}</span>
                  </td>
                  <td className="px-8 py-4">
                    {isParametrizing ? (
                      <input 
                        type="number" 
                        value={item.unitCost}
                        onChange={(e) => updateItem(item.id, 'unitCost', Number(e.target.value))}
                        className="w-32 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <span className="text-xs font-black text-slate-700">$ {item.unitCost.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-8 py-4">
                    {isParametrizing ? (
                      <input 
                        type="number" 
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                        className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <span className="text-xs font-black text-slate-700">{item.quantity.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-sm font-black text-indigo-600">$ {(item.unitCost * item.quantity).toLocaleString()}</span>
                  </td>
                  {isParametrizing && (
                    <td className="px-8 py-4">
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              
              {/* Add New Item Row */}
              {isParametrizing && (
                <tr className="bg-indigo-50/30">
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2">
                      <input 
                        type="text" 
                        placeholder="Nombre del item..."
                        value={newItem.name}
                        onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                        className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <select 
                        value={newItem.category}
                        onChange={(e) => setNewItem({...newItem, category: e.target.value as any})}
                        className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="CAPA2_REPOSICION">Capa 2: Reposición</option>
                        <option value="CAPA3_NECESIDAD">Capa 3: Necesidad</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <input 
                      type="text" 
                      placeholder="Unidad (kg, kit, etc)"
                      value={newItem.unit}
                      onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                      className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-8 py-6">
                    <input 
                      type="number" 
                      placeholder="Costo unitario"
                      value={newItem.unitCost || ''}
                      onChange={(e) => setNewItem({...newItem, unitCost: Number(e.target.value)})}
                      className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-8 py-6">
                    <input 
                      type="number" 
                      placeholder="Cantidad"
                      value={newItem.quantity || ''}
                      onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value)})}
                      className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-8 py-6">
                    <button 
                      onClick={addItem}
                      className="w-full py-2 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Agregar
                    </button>
                  </td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Reposición (Capa 2)</p>
          <p className="text-3xl font-black text-slate-900">$ {totals.capa2.toLocaleString()}</p>
          <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500" style={{ width: `${(totals.capa2 / totals.total) * 100}%` }}></div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Necesidades (Capa 3)</p>
          <p className="text-3xl font-black text-slate-900">$ {totals.capa3.toLocaleString()}</p>
          <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500" style={{ width: `${(totals.capa3 / totals.total) * 100}%` }}></div>
          </div>
        </div>
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Impacto Total Parametrizado</p>
          <p className="text-3xl font-black text-emerald-400">$ {totals.total.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 mt-4 italic">Cálculo basado en requerimientos específicos del territorio.</p>
        </div>
      </div>

      {/* Visual Breakdown */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
        <h4 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
          <BarChart3 className="text-indigo-600" /> Distribución de Costos por Item
        </h4>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="total" radius={[0, 10, 10, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.category === 'Reposición' ? '#4f46e5' : '#f59e0b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
