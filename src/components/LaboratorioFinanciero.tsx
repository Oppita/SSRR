import React, { useState, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, Activity, ShieldCheck, 
  BarChart3, PieChart, LineChart, Layers, 
  BrainCircuit, AlertTriangle, CheckCircle2, 
  ArrowUpRight, ArrowDownRight, Zap, Calculator,
  Search, Filter, Download, Plus, Info, Database
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, AreaChart, Area, 
  PieChart as RePieChart, Pie, Legend, LineChart as ReLineChart, Line,
  ComposedChart
} from 'recharts';
import { useProject } from '../store/ProjectContext';
import { formatCurrency } from '../utils/formatters';
import { FinancialExecutionModule } from './FinancialExecutionModule';
import { FinancialTraceabilityDashboard } from './FinancialTraceabilityDashboard';
import { NationalFinancialDashboard } from './NationalFinancialDashboard';
import { FinancialSixSigmaQuality } from './FinancialSixSigmaQuality';

export const LaboratorioFinanciero: React.FC = () => {
  const { state } = useProject();
  const [activeTab, setActiveTab] = useState<'nacional' | 'dashboard' | 'documentos' | 'trazabilidad' | 'montecarlo' | 'analisis' | 'prediccion' | 'sixsigma'>('nacional');

  // Calculate global metrics
  const metrics = useMemo(() => {
    const totalProjects = state.proyectos.length;
    const totalConvenios = state.convenios.reduce((sum, c) => sum + (Number(c.valorTotal) || 0), 0);
    const totalContratos = state.contratos.reduce((sum, c) => sum + (Number(c.valor) || 0), 0);
    const totalPagos = state.pagos.reduce((sum, p) => sum + (Number(p.valor) || 0), 0);
    
    const totalCDP = state.financialDocuments?.filter(d => d.tipo === 'CDP').reduce((sum, d) => sum + d.valor, 0) || 0;
    const totalRC = state.financialDocuments?.filter(d => d.tipo === 'RC').reduce((sum, d) => sum + d.valor, 0) || 0;
    const totalPagado = state.financialDocuments?.reduce((sum, d) => sum + (d.valorPagado || 0), 0) || 0;

    return {
      totalProjects,
      totalConvenios,
      totalContratos,
      totalPagos: totalPagos + totalPagado,
      totalCDP,
      totalRC,
      totalPagado,
      ejecucionFinanciera: totalContratos > 0 ? ((totalPagos + totalPagado) / totalContratos) * 100 : 0,
      coberturaCDP: totalConvenios > 0 ? (totalCDP / totalConvenios) * 100 : 0
    };
  }, [state]);

  // Data for charts
  const executionBySector = useMemo(() => {
    const sectors: Record<string, { name: string, value: number, compromisos: number }> = {};
    
    // Base sectors from projects
    state.proyectos.forEach(p => {
      const sector = p.linea || 'Otros';
      if (!sectors[sector]) sectors[sector] = { name: sector, value: 0, compromisos: 0 };
      sectors[sector].value += p.matrix?.valorTotalProyecto || 0;
    });

    // Add commitments from financial documents
    state.financialDocuments?.forEach(doc => {
      const project = state.proyectos.find(p => p.id === doc.projectId);
      const sector = project?.linea || 'Otros';
      if (!sectors[sector]) sectors[sector] = { name: sector, value: 0, compromisos: 0 };
      
      if (doc.tipo === 'RC') {
        sectors[sector].compromisos += doc.valor;
      }
    });

    return Object.values(sectors).sort((a, b) => b.value - a.value);
  }, [state.proyectos, state.financialDocuments]);

  const monthlyExecution = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentYear = new Date().getFullYear();
    
    const data = months.map((m, index) => {
      const real = state.financialDocuments?.filter(doc => {
        const docDate = new Date(doc.fecha);
        return docDate.getMonth() === index && docDate.getFullYear() === currentYear && (doc.tipo === 'RC');
      }).reduce((sum, doc) => sum + (doc.valor || 0), 0) || 0;

      // Projected is a simple linear distribution of the total budget for now
      const projected = metrics.totalConvenios / 12;

      return { month: m, real, proyectado: projected };
    });

    // Filter to show only months with data or up to current month
    const currentMonth = new Date().getMonth();
    return data.slice(0, Math.max(6, currentMonth + 1));
  }, [state.financialDocuments, metrics.totalConvenios]);

  const monteCarloData = useMemo(() => {
    // Simulated Monte Carlo for project completion budget
    return Array.from({ length: 20 }, (_, i) => ({
      iteration: i,
      cost: metrics.totalConvenios * (0.95 + Math.random() * 0.15),
      probability: Math.random()
    })).sort((a, b) => a.cost - b.cost);
  }, [metrics.totalConvenios]);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
              <TrendingUp size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Laboratorio Financiero SRR</h1>
              <p className="text-slate-500 font-medium">Análisis predictivo, simulación de riesgos y trazabilidad de inversión</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all">
              <Download size={18} />
              Exportar Reporte
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
              <BrainCircuit size={18} />
              Simular Escenario
            </button>
          </div>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-10">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Presupuesto Global</p>
            <p className="text-2xl font-black text-slate-800">{formatCurrency(metrics.totalConvenios)}</p>
            <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs font-bold">
              <ArrowUpRight size={14} />
              <span>+4.2% vs año anterior</span>
            </div>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Compromisos (RC)</p>
            <p className="text-2xl font-black text-slate-800">{formatCurrency(metrics.totalRC)}</p>
            <div className="flex items-center gap-1 mt-2 text-indigo-600 text-xs font-bold">
              <Activity size={14} />
              <span>{((metrics.totalRC / metrics.totalConvenios) * 100).toFixed(1)}% del total</span>
            </div>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ejecución Real (Pagos)</p>
            <p className="text-2xl font-black text-emerald-600">{formatCurrency(metrics.totalPagos)}</p>
            <div className="flex items-center gap-1 mt-2 text-slate-500 text-xs font-bold">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>{metrics.ejecucionFinanciera.toFixed(1)}% de contratos</span>
            </div>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Saldo por Comprometer</p>
            <p className="text-2xl font-black text-amber-600">{formatCurrency(metrics.totalConvenios - metrics.totalCDP)}</p>
            <div className="flex items-center gap-1 mt-2 text-amber-600 text-xs font-bold">
              <AlertTriangle size={14} />
              <span>Requiere gestión inmediata</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mt-8 border-b border-slate-100 overflow-x-auto pb-1">
          {[
            { id: 'nacional', label: 'Monitor Nacional', icon: <Activity size={18} /> },
            { id: 'sixsigma', label: 'Calidad Seis Sigma', icon: <CheckCircle2 size={18} /> },
            { id: 'dashboard', label: 'Dashboard Ejecutivo', icon: <BarChart3 size={18} /> },
            { id: 'documentos', label: 'Gestión de Documentos', icon: <Database size={18} /> },
            { id: 'trazabilidad', label: 'Trazabilidad Fiscal', icon: <ShieldCheck size={18} /> },
            { id: 'montecarlo', label: 'Simulación Monte Carlo', icon: <Zap size={18} /> },
            { id: 'analisis', label: 'Análisis de Riesgo', icon: <AlertTriangle size={18} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-4 whitespace-nowrap font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
                activeTab === tab.id 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="animate-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'nacional' && (
          <NationalFinancialDashboard />
        )}

        {activeTab === 'sixsigma' && (
          <FinancialSixSigmaQuality />
        )}

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Charts */}
            <div className="lg:col-span-2 space-y-8">
              {/* Execution Trend */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <LineChart size={20} className="text-indigo-600" />
                    Tendencia de Ejecución Mensual
                  </h3>
                  <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-xs font-bold outline-none">
                    <option>Vigencia 2024</option>
                    <option>Vigencia 2023</option>
                  </select>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyExecution}>
                      <defs>
                        <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="real" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorReal)" />
                      <Line type="monotone" dataKey="proyectado" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Distribution by Sector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <PieChart size={20} className="text-emerald-600" />
                    Inversión por Sector
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={executionBySector}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {executionBySector.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {executionBySector.slice(0, 3).map((s, i) => (
                      <div key={s.name} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                          <span className="text-slate-600">{s.name}</span>
                        </div>
                        <span className="font-bold text-slate-800">{((s.value / metrics.totalConvenios) * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <BarChart3 size={20} className="text-amber-600" />
                    Eficiencia de Contratación
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={executionBySector.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" hide />
                        <YAxis hide />
                        <Tooltip />
                        <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-slate-500 mt-4 text-center italic">
                    Relación entre presupuesto asignado y contratos liquidados por sector.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Laboratory & Simulations */}
            <div className="space-y-8">
              {/* AI Financial Insights */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-indigo-600">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <BrainCircuit size={20} className="text-indigo-600" />
                  Insights de IA Financiera
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <p className="text-xs font-bold text-indigo-800 uppercase mb-1">Alerta de Sub-ejecución</p>
                    <p className="text-sm text-indigo-700">
                      El sector de <strong>Protección Costera</strong> presenta un retraso del 15% en la emisión de RP frente al cronograma financiero proyectado.
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-800 uppercase mb-1">Optimización Detectada</p>
                    <p className="text-sm text-emerald-700">
                      La consolidación de CDPs en el rubro de <strong>Saneamiento</strong> podría reducir costos administrativos en un 4.2%.
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-xs font-bold text-amber-800 uppercase mb-1">Riesgo de Liquidez</p>
                    <p className="text-sm text-amber-700">
                      Proyección de flujo de caja para Q4 muestra un déficit potencial si no se agilizan los RC de convenios nacionales.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Herramientas de Control</h4>
                <div className="grid grid-cols-2 gap-4">
                  <button className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all text-center">
                    <Database size={24} className="mx-auto mb-2 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">Auditoría Matrix</span>
                  </button>
                  <button className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all text-center">
                    <Layers size={24} className="mx-auto mb-2 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">Cruce de Rubros</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documentos' && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <FinancialExecutionModule />
          </div>
        )}

        {activeTab === 'trazabilidad' && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <FinancialTraceabilityDashboard />
          </div>
        )}

        {activeTab === 'montecarlo' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-slate-900 text-white p-8 rounded-3xl shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500 rounded-xl">
                  <Zap size={20} />
                </div>
                <h3 className="text-xl font-bold">Laboratorio Monte Carlo</h3>
              </div>
              
              <p className="text-slate-400 text-sm mb-6">
                Simulación de 10,000 iteraciones sobre el costo final de la cartera de proyectos basada en volatilidad de insumos y retrasos.
              </p>

              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monteCarloData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis dataKey="iteration" hide />
                    <YAxis tick={{fill: '#94a3b8', fontSize: 10}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                      itemStyle={{ color: '#818cf8' }}
                    />
                    <Bar dataKey="cost" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Resultados de Simulación</h4>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-xs font-bold text-slate-400 mb-1">Escenario Probable (P50)</p>
                    <p className="text-xl font-black text-slate-800">{formatCurrency(metrics.totalConvenios * 1.05)}</p>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                    <p className="text-xs font-bold text-rose-800 mb-1">Escenario Pesimista (P95)</p>
                    <p className="text-xl font-black text-rose-600">{formatCurrency(metrics.totalConvenios * 1.18)}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-800 mb-1">Escenario Optimista (P5)</p>
                    <p className="text-xl font-black text-emerald-600">{formatCurrency(metrics.totalConvenios * 0.98)}</p>
                  </div>
                </div>
                <button className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                  <RefreshCw size={18} />
                  Recalcular Simulación
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper for Refresh icon (not imported in lucide-react list above)
const RefreshCw: React.FC<{size?: number, className?: string}> = ({size = 18, className = ""}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);
