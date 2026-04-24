import React, { useState, useContext } from 'react';
import { ProjectContext } from '../store/ProjectContext';
import { simularInversion, simularInversionInversa } from '../services/riskService';
import { Calculator, TrendingDown, Users, Zap } from 'lucide-react';

export const InvestmentSimulator: React.FC = () => {
  const context = useContext(ProjectContext);
  if (!context) return null;
  const { state } = context;
  const [monto, setMonto] = useState(0);
  const [municipioId, setMunicipioId] = useState('');
  const [tipoObra, setTipoObra] = useState('infraestructura');
  const [resultado, setResultado] = useState<any>(null);
  const [targetReduccion, setTargetReduccion] = useState(0);
  const [resultadoInverso, setResultadoInverso] = useState<any>(null);

  const handleSimular = () => {
    const res = simularInversion(monto, municipioId, tipoObra, state.riesgosTerritoriales || []);
    setResultado(res);
  };

  const handleSimularInversa = () => {
    const res = simularInversionInversa(targetReduccion, municipioId, tipoObra, state.riesgosTerritoriales || []);
    setResultadoInverso(res);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Calculator className="text-indigo-600" /> Simulador de Inversión
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-bold text-slate-700">Simulación Directa</h3>
          <input type="number" placeholder="Monto ($)" className="w-full p-2 border rounded" onChange={(e) => setMonto(Number(e.target.value))} />
          <select className="w-full p-2 border rounded" onChange={(e) => setMunicipioId(e.target.value)}>
            <option value="">Seleccione Municipio</option>
            {state.municipios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
          <select className="w-full p-2 border rounded" onChange={(e) => setTipoObra(e.target.value)}>
            <option value="infraestructura">Infraestructura</option>
            <option value="educacion">Educación</option>
            <option value="salud">Salud</option>
            <option value="ambiental">Ambiental</option>
          </select>
          <button onClick={handleSimular} className="w-full bg-indigo-600 text-white p-2 rounded font-bold">Simular</button>
          
          {resultado && (
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg space-y-2 text-sm">
              <p className="flex items-center gap-2"><TrendingDown size={16} /> Reducción Riesgo: {resultado.reduccionRiesgo.toFixed(2)}</p>
              <p className="flex items-center gap-2"><Users size={16} /> Personas Protegidas: {resultado.personasProtegidas}</p>
              <p className="flex items-center gap-2"><Zap size={16} /> Eficiencia: {resultado.eficiencia.toFixed(4)}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-slate-700">Simulación Inversa</h3>
          <input type="number" placeholder="% Reducción Riesgo" className="w-full p-2 border rounded" onChange={(e) => setTargetReduccion(Number(e.target.value))} />
          <button onClick={handleSimularInversa} className="w-full bg-rose-600 text-white p-2 rounded font-bold">Calcular Inversión</button>
          
          {resultadoInverso && (
            <div className="mt-4 p-4 bg-rose-50 rounded-lg space-y-2 text-sm">
              <p>Inversión Requerida: ${resultadoInverso.montoRequerido.toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
