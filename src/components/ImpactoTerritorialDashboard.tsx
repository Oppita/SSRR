import React, { useMemo } from 'react';
import { ProjectData } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { 
  Target, Users, TrendingDown, MapPin, AlertTriangle, Lightbulb, Zap, Activity, CheckCircle2
} from 'lucide-react';

interface ImpactoTerritorialDashboardProps {
  projects: ProjectData[];
  onSelectProject: (project: ProjectData) => void;
}

export const ImpactoTerritorialDashboard: React.FC<ImpactoTerritorialDashboardProps> = ({ projects, onSelectProject }) => {
  
  const impactData = useMemo(() => {
    // Calculate metrics
    let totalPoblacion = 0;
    let totalRiesgoAntes = 0;
    let totalRiesgoDespues = 0;
    let proyectosConImpacto = 0;
    let totalInversion = 0;
    const impactoPorDepartamento: Record<string, { poblacion: number, reduccionRiesgo: number, inversion: number, count: number }> = {};

    const projectsWithImpact = projects.map(p => {
      const poblacion = p.project.poblacionBeneficiada || 0;
      const riesgoAntes = p.project.riesgoAntes || 0;
      const riesgoDespues = p.project.riesgoDespues || 0;
      const coherencia = p.project.coherenciaTerritorial || 0;
      
      const inversion = p.presupuesto.valorTotal;
      const eficiencia = inversion > 0 ? (poblacion * (riesgoAntes - riesgoDespues)) / (inversion / 1000000) : 0; // Impact per million COP
      const costoPorPersona = poblacion > 0 ? inversion / poblacion : 0;
      const reduccionRiesgo = riesgoAntes - riesgoDespues;

      let semaforoImpacto = 'Alto';
      if (reduccionRiesgo < 20) semaforoImpacto = 'Bajo';
      else if (reduccionRiesgo < 40) semaforoImpacto = 'Medio';
      
      totalPoblacion += poblacion;
      totalRiesgoAntes += riesgoAntes;
      totalRiesgoDespues += riesgoDespues;
      totalInversion += inversion;
      proyectosConImpacto++;

      if (!impactoPorDepartamento[p.project.departamento]) {
        impactoPorDepartamento[p.project.departamento] = { poblacion: 0, reduccionRiesgo: 0, inversion: 0, count: 0 };
      }
      impactoPorDepartamento[p.project.departamento].poblacion += poblacion;
      impactoPorDepartamento[p.project.departamento].reduccionRiesgo += reduccionRiesgo;
      impactoPorDepartamento[p.project.departamento].inversion += inversion;
      impactoPorDepartamento[p.project.departamento].count += 1;

      return {
        ...p,
        impacto: {
          poblacion,
          riesgoAntes,
          riesgoDespues,
          reduccionRiesgo,
          coherencia,
          eficiencia,
          costoPorPersona,
          semaforoImpacto
        }
      };
    }).sort((a, b) => b.impacto.eficiencia - a.impacto.eficiencia);

    const avgRiesgoAntes = proyectosConImpacto > 0 ? totalRiesgoAntes / proyectosConImpacto : 0;
    const avgRiesgoDespues = proyectosConImpacto > 0 ? totalRiesgoDespues / proyectosConImpacto : 0;
    const costoPromedioPorPersona = totalPoblacion > 0 ? totalInversion / totalPoblacion : 0;

    const impactoDepartamentalArray = Object.entries(impactoPorDepartamento).map(([dep, data]) => ({
      departamento: dep,
      poblacion: data.poblacion,
      reduccionRiesgoPromedio: data.reduccionRiesgo / data.count,
      costoPorPersona: data.poblacion > 0 ? data.inversion / data.poblacion : 0
    })).sort((a, b) => b.poblacion - a.poblacion);
    
    // Evolución del riesgo en el tiempo (interpolated data based on projects)
    const evolucionRiesgo = [
      { mes: 'Ene', riesgoPromedio: avgRiesgoAntes },
      { mes: 'Feb', riesgoPromedio: avgRiesgoAntes - (avgRiesgoAntes - avgRiesgoDespues) * 0.2 },
      { mes: 'Mar', riesgoPromedio: avgRiesgoAntes - (avgRiesgoAntes - avgRiesgoDespues) * 0.4 },
      { mes: 'Abr', riesgoPromedio: avgRiesgoAntes - (avgRiesgoAntes - avgRiesgoDespues) * 0.6 },
      { mes: 'May', riesgoPromedio: avgRiesgoAntes - (avgRiesgoAntes - avgRiesgoDespues) * 0.8 },
      { mes: 'Jun', riesgoPromedio: avgRiesgoDespues }
    ];

    // Alertas de municipios con riesgo alto sin intervención
    const municipiosRiesgoAlto = [
      { municipio: 'Quibdó', departamento: 'Chocó', nivelRiesgo: 95, poblacionAfectada: 120000 },
      { municipio: 'Mocoa', departamento: 'Putumayo', nivelRiesgo: 92, poblacionAfectada: 45000 },
      { municipio: 'Lloró', departamento: 'Chocó', nivelRiesgo: 88, poblacionAfectada: 15000 }
    ].filter(m => !projects.some(p => p.project.municipio === m.municipio));

    // Recomendaciones de nuevos proyectos
    const recomendaciones = municipiosRiesgoAlto.map(m => ({
      ...m,
      tipoSugerido: m.nivelRiesgo > 90 ? 'Obras de Mitigación Definitiva' : 'Sistema de Alerta Temprana',
      presupuestoEstimado: m.poblacionAfectada * 50000 // Mock calculation
    }));

    // Proyectos con bajo impacto real (alto avance físico, baja reducción de riesgo)
    const bajoImpacto = projectsWithImpact.filter(p => 
      p.project.avanceFisico > 50 && p.impacto.reduccionRiesgo < 20
    );

    return {
      projectsWithImpact,
      totalPoblacion,
      avgRiesgoAntes,
      avgRiesgoDespues,
      costoPromedioPorPersona,
      impactoDepartamentalArray,
      evolucionRiesgo,
      municipiosRiesgoAlto,
      recomendaciones,
      bajoImpacto
    };
  }, [projects]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Users size={24} />
            </div>
            <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-[10px] font-bold" title="Datos validados mediante informes de interventoría">
              <CheckCircle2 size={12} />
              Validado Interventoría
            </div>
          </div>
          <h4 className="text-slate-500 text-sm font-medium mb-1">Personas Protegidas</h4>
          <div className="text-3xl font-bold text-slate-900">{impactData.totalPoblacion.toLocaleString()}</div>
          <div className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
            <TrendingDown size={14} /> Impacto directo estimado
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
              <Target size={24} />
            </div>
          </div>
          <h4 className="text-slate-500 text-sm font-medium mb-1">Coherencia Territorial</h4>
          <div className="text-3xl font-bold text-slate-900">
            {Math.round(impactData.projectsWithImpact.reduce((sum, p) => sum + p.impacto.coherencia, 0) / (impactData.projectsWithImpact.length || 1))}%
          </div>
          <div className="text-xs text-indigo-600 mt-2 font-medium">Alineación con POT/POD</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
              <Activity size={24} />
            </div>
          </div>
          <h4 className="text-slate-500 text-sm font-medium mb-1">Riesgo Promedio (Antes)</h4>
          <div className="text-3xl font-bold text-slate-900">{Math.round(impactData.avgRiesgoAntes)}/100</div>
          <div className="text-xs text-slate-400 mt-2 font-medium">Nivel de vulnerabilidad inicial</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingDown size={24} />
            </div>
          </div>
          <h4 className="text-slate-500 text-sm font-medium mb-1">Riesgo Promedio (Actual)</h4>
          <div className="text-3xl font-bold text-slate-900">{Math.round(impactData.avgRiesgoDespues)}/100</div>
          <div className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
            <TrendingDown size={14} /> -{Math.round(impactData.avgRiesgoAntes - impactData.avgRiesgoDespues)} puntos
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <Zap size={24} />
            </div>
          </div>
          <h4 className="text-slate-500 text-sm font-medium mb-1">Costo por Persona</h4>
          <div className="text-3xl font-bold text-slate-900">{formatCurrency(impactData.costoPromedioPorPersona)}</div>
          <div className="text-xs text-blue-600 mt-2 font-medium">Inversión / Población</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Evolución del Riesgo */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Activity className="text-indigo-500" />
                Evolución del Riesgo en el Tiempo
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={impactData.evolucionRiesgo}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line type="monotone" dataKey="riesgoPromedio" name="Nivel de Riesgo" stroke="#6366f1" strokeWidth={3} dot={{r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Impacto Acumulado por Departamento */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <MapPin className="text-indigo-500" />
                Impacto Acumulado por Departamento
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={impactData.impactoDepartamentalArray.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis dataKey="departamento" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={100} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [value.toLocaleString(), 'Población']}
                    />
                    <Bar dataKey="poblacion" name="Población Protegida" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Avance Físico vs Impacto Real */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Zap className="text-amber-500" />
                Avance Físico vs Impacto Real
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" dataKey="avanceFisico" name="Avance Físico (%)" domain={[0, 100]} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis type="number" dataKey="reduccionRiesgo" name="Reducción de Riesgo" domain={[0, 100]} tick={{fill: '#64748b', fontSize: 12}} />
                    <ZAxis type="number" dataKey="poblacion" range={[50, 400]} name="Población" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Scatter name="Proyectos" data={impactData.projectsWithImpact.map(p => ({
                      name: p.project.nombre,
                      avanceFisico: p.project.avanceFisico,
                      reduccionRiesgo: p.impacto.reduccionRiesgo,
                      poblacion: p.impacto.poblacion
                    }))} fill="#10b981" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ranking de Eficiencia */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Target className="text-indigo-500" />
                Ranking de Eficiencia ($ vs Impacto)
              </h3>
              <div className="space-y-4">
                {impactData.projectsWithImpact.slice(0, 5).map((p, index) => (
                  <div key={p.project.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-amber-100 text-amber-700' : 
                        index === 1 ? 'bg-slate-200 text-slate-700' : 
                        index === 2 ? 'bg-orange-100 text-orange-700' : 
                        'bg-white text-slate-500 border border-slate-200'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{p.project.nombre}</p>
                        <p className="text-xs text-slate-500">{p.project.municipio}, {p.project.departamento}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-black text-emerald-600">{Math.round(p.impacto.eficiencia)} pts/M$</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Eficiencia</p>
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        p.impacto.semaforoImpacto === 'Alto' ? 'bg-emerald-100 text-emerald-700' :
                        p.impacto.semaforoImpacto === 'Medio' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {p.impacto.semaforoImpacto}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Alertas y Recomendaciones */}
        <div className="space-y-6">
          <button 
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
            onClick={() => alert('Generando Informe de Impacto Territorial...')}
          >
            <Target size={18} />
            Generar Informe de Impacto
          </button>

          {/* Bajo Impacto Real */}
          {impactData.bajoImpacto.length > 0 && (
            <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 shadow-sm">
              <h3 className="text-sm font-bold text-rose-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="text-rose-600" size={18} />
                Bajo Impacto Real Detectado
              </h3>
              <div className="space-y-3">
                {impactData.bajoImpacto.map(p => (
                  <div key={p.project.id} className="bg-white p-3 rounded-xl border border-rose-100 text-sm">
                    <p className="font-bold text-slate-800">{p.project.nombre}</p>
                    <p className="text-xs text-rose-600 mt-1">
                      Avance: {p.project.avanceFisico}% | Reducción Riesgo: {Math.round(p.impacto.reduccionRiesgo)} pts
                    </p>
                    <div className="mt-2 pt-2 border-t border-rose-100">
                      <p className="text-[10px] font-bold text-rose-700 uppercase">Sugerencia:</p>
                      <p className="text-xs text-slate-600">Evaluar rediseño o intervención correctiva urgente.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Municipios sin intervención */}
          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 shadow-sm">
            <h3 className="text-sm font-bold text-amber-900 mb-4 flex items-center gap-2">
              <MapPin className="text-amber-600" size={18} />
              Riesgo Alto Sin Intervención
            </h3>
            <div className="space-y-3">
              {impactData.municipiosRiesgoAlto.map((m, i) => (
                <div key={i} className="bg-white p-3 rounded-xl border border-amber-100 text-sm">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-slate-800">{m.municipio}, {m.departamento}</p>
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold">
                      Riesgo: {m.nivelRiesgo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{m.poblacionAfectada.toLocaleString()} personas en riesgo</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recomendaciones */}
          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 shadow-sm">
            <h3 className="text-sm font-bold text-indigo-900 mb-4 flex items-center gap-2">
              <Lightbulb className="text-indigo-600" size={18} />
              Recomendaciones de Proyectos
            </h3>
            <div className="space-y-3">
              {impactData.recomendaciones.map((r, i) => (
                <div key={i} className="bg-white p-3 rounded-xl border border-indigo-100 text-sm">
                  <p className="font-bold text-slate-800">{r.tipoSugerido}</p>
                  <p className="text-xs text-slate-600 mt-1">Para: {r.municipio}, {r.departamento}</p>
                  <p className="text-[10px] text-indigo-600 font-bold mt-2 uppercase">
                    Est. {formatCurrency(r.presupuestoEstimado)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
