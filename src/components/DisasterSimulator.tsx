import React, { useState } from 'react';
import { simularDesastre } from '../services/riskService';
import { useProject } from '../store/ProjectContext';

export const DisasterSimulator: React.FC = () => {
  const { state } = useProject();
  const [tipoDesastre, setTipoDesastre] = useState('inundación');
  const [resultado, setResultado] = useState<any>(null);

  const handleSimular = () => {
    const res = simularDesastre(tipoDesastre, state.riesgosTerritoriales, state.proyectos);
    setResultado(res);
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Simulador de Desastres</h2>
      <select 
        value={tipoDesastre} 
        onChange={(e) => setTipoDesastre(e.target.value)}
        className="border p-2 mb-4 w-full"
      >
        <option value="inundación">Inundación</option>
        <option value="deslizamiento">Deslizamiento</option>
        <option value="sequía">Sequía</option>
      </select>
      <button onClick={handleSimular} className="bg-blue-500 text-white p-2 rounded">Simular</button>
      
      {resultado && (
        <div className="mt-4">
          <p>Municipios afectados: {resultado.affectedMunicipios.length}</p>
          <p>Proyectos que ayudan: {resultado.projectsThatHelp.length}</p>
          <p>Impacto evitado (personas): {resultado.impactAvoided}</p>
        </div>
      )}
    </div>
  );
};
