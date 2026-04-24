import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  ArrowRight, 
  Database, 
  ShieldCheck, 
  Activity, 
  Scale, 
  Zap,
  FileText,
  History,
  Fingerprint,
  TrendingDown,
  Info
} from 'lucide-react';

interface Municipality {
  id: string;
  name: string;
  dept: string;
  historicalBias: number; // B_h
  reports: EDANReport[];
}

interface EDANReport {
  id: string;
  date: string;
  status: 'PENDIENTE' | 'VALIDADO' | 'AJUSTADO';
  icr: number;
  wed: number;
  sigma: number;
  data: {
    VIV: { rep: number; val: number; weight: number };
    PER: { rep: number; val: number; weight: number };
    HEC: { rep: number; val: number; weight: number };
  };
}

export const CaseStudySimulation: React.FC = () => {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([
    {
      id: 'MUN-001',
      name: 'Mocoa',
      dept: 'Putumayo',
      historicalBias: 1.15,
      reports: [
        {
          id: 'REP-101',
          date: '2026-04-10',
          status: 'AJUSTADO',
          icr: 0.82,
          wed: 0.18,
          sigma: 4.2,
          data: {
            VIV: { rep: 120, val: 100, weight: 0.35 },
            PER: { rep: 550, val: 500, weight: 0.40 },
            HEC: { rep: 45, val: 40, weight: 0.25 }
          }
        }
      ]
    }
  ]);

  const [newMunName, setNewMunName] = useState('');
  const [activeMunId, setActiveMunId] = useState<string | null>('MUN-001');

  const addMunicipality = () => {
    if (!newMunName) return;
    const newMun: Municipality = {
      id: `MUN-00${municipalities.length + 1}`,
      name: newMunName,
      dept: 'Por asignar',
      historicalBias: 1.0,
      reports: []
    };
    setMunicipalities([...municipalities, newMun]);
    setNewMunName('');
    setActiveMunId(newMun.id);
  };

  const deleteMunicipality = (id: string) => {
    setMunicipalities(municipalities.filter(m => m.id !== id));
    if (activeMunId === id) setActiveMunId(null);
  };

  const activeMun = municipalities.find(m => m.id === activeMunId);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header & Case Study Context */}
      <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Building2 size={240} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <ShieldCheck size={24} />
            </div>
            <span className="font-black uppercase tracking-[0.3em] text-xs text-indigo-300">Caso de Estudio Real</span>
          </div>
          <h2 className="text-5xl font-black mb-6 leading-tight max-w-3xl">
            Simulación de Erradicación de Discrepancias
          </h2>
          <p className="text-slate-400 max-w-2xl text-xl leading-relaxed">
            Este entorno permite probar cómo el modelo Six Sigma + ICR neutraliza el riesgo moral y alinea los reportes territoriales con la realidad técnica validada.
          </p>
        </div>
      </div>

      {/* Municipality Management Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar: Municipality List */}
        <div className="lg:col-span-1 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col h-[600px]">
          <h3 className="text-sm font-black text-slate-900 uppercase mb-6 flex items-center gap-2">
            <Building2 size={16} className="text-indigo-600" /> Municipios en Sistema
          </h3>
          
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              placeholder="Nuevo municipio..." 
              value={newMunName}
              onChange={(e) => setNewMunName(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button 
              onClick={addMunicipality}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {municipalities.map(m => (
              <div 
                key={m.id}
                onClick={() => setActiveMunId(m.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center group ${activeMunId === m.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}`}
              >
                <div>
                  <p className="text-xs font-black text-slate-800">{m.name}</p>
                  <p className="text-[10px] text-slate-400">{m.dept}</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteMunicipality(m.id); }}
                  className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content: Validation Flow */}
        <div className="lg:col-span-3 space-y-8">
          {activeMun ? (
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm min-h-[600px]">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-3xl font-black text-slate-900">{activeMun.name}</h3>
                  <p className="text-slate-500 text-sm">Sesgo Histórico (B_h): <span className="font-bold text-indigo-600">{activeMun.historicalBias}</span></p>
                </div>
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Estado de Auditoría</p>
                    <p className="text-xs font-bold text-emerald-600">Cumplimiento 100%</p>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Proof of Work */}
              <div className="space-y-12">
                {/* 1. Raw Data vs Adjusted */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400 mb-4">
                      <Database size={16} />
                      <span className="text-[10px] font-black uppercase">Reporte Territorial (Crudo)</span>
                    </div>
                    <p className="text-3xl font-black text-slate-800">1,250</p>
                    <p className="text-[10px] text-slate-500 mt-1 italic">Unidades de daño reportadas</p>
                  </div>
                  <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 relative">
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md z-10">
                      <ArrowRight size={16} className="text-indigo-600" />
                    </div>
                    <div className="flex items-center gap-2 text-indigo-400 mb-4">
                      <ShieldCheck size={16} />
                      <span className="text-[10px] font-black uppercase">Validación Six Sigma</span>
                    </div>
                    <p className="text-3xl font-black text-indigo-600">0.82 ICR</p>
                    <p className="text-[10px] text-indigo-400 mt-1 italic">Nivel de coherencia técnica</p>
                  </div>
                  <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                    <div className="flex items-center gap-2 text-emerald-400 mb-4">
                      <Zap size={16} />
                      <span className="text-[10px] font-black uppercase">Dato Ajustado (Real)</span>
                    </div>
                    <p className="text-3xl font-black text-emerald-600">1,018</p>
                    <p className="text-[10px] text-emerald-500 mt-1 italic">Base para asignación fiscal</p>
                  </div>
                </div>

                {/* 2. The "Discrepancy Eradicator" Logic */}
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
                  <h4 className="text-lg font-black mb-6 flex items-center gap-3">
                    <Fingerprint className="text-indigo-400" /> Prueba de Trazabilidad Forense
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="mt-1"><CheckCircle2 size={16} className="text-emerald-400" /></div>
                      <div>
                        <p className="text-xs font-bold">Detección de Sesgo Histórico</p>
                        <p className="text-[10px] text-slate-400 mt-1">El sistema aplicó un factor de deflación de 1.15x basado en el comportamiento de los últimos 24 meses.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="mt-1"><CheckCircle2 size={16} className="text-emerald-400" /></div>
                      <div>
                        <p className="text-xs font-bold">Contraste Satelital</p>
                        <p className="text-[10px] text-slate-400 mt-1">La mancha de inundación detectada por Sentinel-2 solo justifica el 82% de las viviendas reportadas como "destruidas".</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="mt-1"><CheckCircle2 size={16} className="text-emerald-400" /></div>
                      <div>
                        <p className="text-xs font-bold">Alineación con Contraloría</p>
                        <p className="text-[10px] text-slate-400 mt-1">Se ha generado un ID único de auditoría (TR-2026-001) que vincula el nexo causal con la evidencia geoespacial.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Impact on Resources */}
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-1 space-y-4">
                    <h4 className="text-xl font-black text-slate-900">Impacto en la Eficiencia Fiscal</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Al erradicar la discrepancia de 232 unidades de daño (sobre-reporte), el Estado ahorra recursos que pueden ser reasignados a municipios con necesidades reales validadas.
                    </p>
                    <div className="flex gap-4">
                      <div className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase border border-rose-100">
                        -18.5% Discrepancia Eliminada
                      </div>
                      <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase border border-emerald-100">
                        100% Auditabilidad
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-64 p-8 bg-indigo-600 rounded-[2.5rem] text-white text-center shadow-xl shadow-indigo-200">
                    <TrendingDown size={40} className="mx-auto mb-4 opacity-50" />
                    <p className="text-[10px] font-black uppercase mb-1">Reducción de Varianza</p>
                    <p className="text-4xl font-black">22%</p>
                    <p className="text-[10px] mt-2 italic opacity-80">Meta Six Sigma Alcanzada</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-[3.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-20 text-center h-[600px]">
              <Building2 size={64} className="text-slate-300 mb-6" />
              <h3 className="text-xl font-black text-slate-400 uppercase">Selecciona un municipio</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-xs">Elige un municipio de la lista o crea uno nuevo para iniciar la simulación de auditoría.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
