import React from 'react';
import { EmergenciaEvento } from '../types';
import { FileText, Printer, X, ShieldCheck, Scale, TrendingUp, AlertTriangle, CloudRain, DollarSign, Activity } from 'lucide-react';

interface InformeMinHaciendaModalProps {
  evento: EmergenciaEvento;
  onClose: () => void;
}

export const InformeMinHaciendaModal: React.FC<InformeMinHaciendaModalProps> = ({ evento, onClose }) => {
  
  const handlePrint = () => {
    window.print();
  };

  const isFrenteFrio = evento.tipo === 'Frente Frío' || evento.nombre.toLowerCase().includes('frío');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 print:p-0 print:bg-white print:block">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Header - Hidden on print */}
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center shrink-0 print:hidden">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500 rounded-2xl">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Generador de Informe Técnico Oficial</h3>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Ministerio de Hacienda y Crédito Público</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <Printer size={16} />
              Imprimir / PDF
            </button>
            <button 
              onClick={onClose} 
              className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Document Content */}
        <div className="p-12 overflow-y-auto flex-1 bg-white print:p-8 text-slate-800" id="informe-minhacienda">
          
          {/* Official Header */}
          <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
            <h1 className="text-2xl font-black uppercase tracking-wider mb-2">Ministerio de Hacienda y Crédito Público</h1>
            <h2 className="text-lg font-bold text-slate-600 uppercase tracking-widest">Dirección General del Presupuesto Público Nacional</h2>
            <div className="mt-6 text-left text-sm font-medium space-y-1">
              <p><strong>Fecha:</strong> {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Radicado:</strong> MHCP-DGPPN-{new Date().getFullYear()}-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</p>
              <p><strong>Asunto:</strong> Sustentación Técnica, Metodológica y Financiera para la Asignación de Recursos - Evento Climático Extremo ({evento.tipo})</p>
            </div>
          </div>

          <div className="space-y-8 text-justify leading-relaxed">
            
            {/* I. Antecedentes y Contexto Constitucional */}
            <section>
              <h3 className="text-lg font-black uppercase border-l-4 border-slate-800 pl-3 mb-4 flex items-center gap-2">
                <Scale size={20} />
                I. Antecedentes y Contexto Constitucional
              </h3>
              <p className="mb-3">
                En el marco de la Ley 1523 de 2012 (Sistema Nacional de Gestión del Riesgo de Desastres), y ante la declaratoria de calamidad pública/desastre nacional asociada al evento denominado <strong>"{evento.nombre}"</strong>, el presente informe técnico sustenta la viabilidad financiera para la asignación de recursos extraordinarios.
              </p>
              <p>
                La asignación propuesta supera estrictamente los juicios de <strong>Conexidad Material</strong> (los recursos solicitados sirven exclusivamente para mitigar el impacto del evento), <strong>Proporcionalidad</strong> (la cuantía es equivalente a la magnitud del daño tasado) y <strong>Necesidad Estricta</strong> (insuficiencia de los mecanismos ordinarios para financiar la crisis), garantizando la superación del control automático de constitucionalidad.
              </p>
            </section>

            {/* II. Caracterización Técnica del Evento */}
            <section>
              <h3 className="text-lg font-black uppercase border-l-4 border-slate-800 pl-3 mb-4 flex items-center gap-2">
                <CloudRain size={20} />
                II. Caracterización Técnica del Evento (El Hecho Generador)
              </h3>
              <p className="mb-3">
                Con base en los boletines de Alerta Roja emitidos por el IDEAM, se certifica la ocurrencia, atipicidad e intensidad del fenómeno. 
                {isFrenteFrio ? (
                  <span> Se ha registrado una <strong>anomalía térmica negativa</strong> severa, caracterizada por un descenso abrupto de la temperatura, ráfagas de viento sistémicas y alteraciones pluviométricas que configuran un choque macroeconómico sectorial.</span>
                ) : (
                  <span> Se ha registrado una anomalía climática severa que configura un choque macroeconómico sectorial en los territorios afectados.</span>
                )}
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm font-medium bg-slate-50 p-4 rounded-xl border border-slate-200">
                <li><strong>Departamentos Afectados:</strong> {evento.departamentosAfectados?.join(', ') || 'No especificados'}</li>
                <li><strong>Duración del Evento:</strong> {evento.caracterizacion?.duracionDias || 'N/A'} días</li>
                <li><strong>Intensidad Registrada:</strong> {evento.caracterizacion?.intensidad || 'N/A'}</li>
                <li><strong>Anomalía Climática:</strong> {evento.caracterizacion?.anomaliaClimatica || 'N/A'}% respecto a la media histórica</li>
              </ul>
            </section>

            {/* III. Metodología de Cuantificación */}
            <section>
              <h3 className="text-lg font-black uppercase border-l-4 border-slate-800 pl-3 mb-4 flex items-center gap-2">
                <Activity size={20} />
                III. Metodología de Cuantificación de Daños y Pérdidas
              </h3>
              <p className="mb-3">
                La cuantificación no obedece a estimaciones empíricas. Se ha aplicado la <strong>Metodología DaLA (Damage and Loss Assessment)</strong> estandarizada por la CEPAL y el Banco Mundial, cruzada con los resultados consolidados de la Evaluación de Daños y Análisis de Necesidades (EDAN).
              </p>
              <p>
                {isFrenteFrio ? (
                  <span>Se ha realizado una separación estricta entre el <em>Daño</em> (ej. infraestructura de invernaderos colapsada por vientos/heladas) y la <em>Pérdida</em> (ej. flujo de caja perdido por cultivos quemados por estrés térmico), garantizando la focalización del gasto mediante el Registro Único de Damnificados (RUD).</span>
                ) : (
                  <span>Se ha realizado una separación estricta entre el <em>Daño</em> (afectación a infraestructura física) y la <em>Pérdida</em> (flujos económicos interrumpidos), garantizando la focalización del gasto mediante el Registro Único de Damnificados (RUD).</span>
                )}
              </p>
            </section>

            {/* IV. Cuantificación Financiera */}
            <section>
              <h3 className="text-lg font-black uppercase border-l-4 border-slate-800 pl-3 mb-4 flex items-center gap-2">
                <DollarSign size={20} />
                IV. Cuantificación Financiera y Focalización del Gasto
              </h3>
              <p className="mb-3">
                La necesidad de recursos se desglosa en líneas de intervención específicas, valoradas a Costos de Reposición (VCR) y ajustadas a los precios promedio del SECOP previos a la emergencia, mitigando el riesgo de sobrecostos por especulación.
              </p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="py-2 font-bold uppercase text-xs text-slate-500">Línea de Intervención</th>
                      <th className="py-2 font-bold uppercase text-xs text-slate-500 text-right">Valor Estimado (COP)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-2">Atención Inmediata (Ayuda Humanitaria)</td>
                      <td className="py-2 text-right font-mono font-bold">
                        ${(evento.metrics?.atencionInmediata || 0).toLocaleString('es-CO')}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2">Rehabilitación (Servicios Básicos)</td>
                      <td className="py-2 text-right font-mono font-bold">
                        ${(evento.metrics?.rehabilitacion || 0).toLocaleString('es-CO')}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2">Reconstrucción (Infraestructura y Medios de Vida)</td>
                      <td className="py-2 text-right font-mono font-bold">
                        ${(evento.metrics?.reconstruccion || 0).toLocaleString('es-CO')}
                      </td>
                    </tr>
                    <tr className="bg-slate-100">
                      <td className="py-2 font-black">TOTAL REQUERIDO</td>
                      <td className="py-2 text-right font-mono font-black text-indigo-700">
                        ${((evento.metrics?.atencionInmediata || 0) + (evento.metrics?.rehabilitacion || 0) + (evento.metrics?.reconstruccion || 0)).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* V. Análisis de Disponibilidad */}
            <section>
              <h3 className="text-lg font-black uppercase border-l-4 border-slate-800 pl-3 mb-4">
                V. Análisis de Disponibilidad y Fuentes de Financiación
              </h3>
              <p>
                La asignación propuesta ha sido evaluada frente al Marco Fiscal de Mediano Plazo (MFMP). Las fuentes de financiación provendrán de traslados presupuestales intra-institucionales, activación de instrumentos de retención de riesgo (Fondo de Contingencias) y, de ser necesario, descapitalización de activos, garantizando el Principio de Anualidad Presupuestal y la sostenibilidad fiscal de la Nación.
              </p>
            </section>

            {/* VI. Defensa Fiscal */}
            <section>
              <h3 className="text-lg font-black uppercase border-l-4 border-slate-800 pl-3 mb-4 flex items-center gap-2">
                <ShieldCheck size={20} />
                VI. Gestión del Riesgo Fiscal (Defensa ante Controlaría)
              </h3>
              <p className="mb-4">
                Para el control fiscal posterior y selectivo por parte de la Contraloría General de la República, se establecen los siguientes argumentos de salvaguarda del patrimonio público:
              </p>
              <div className="space-y-4">
                <div className="border-l-2 border-indigo-500 pl-4">
                  <h4 className="font-bold text-sm">A. Frente al hallazgo de "Improvisación o Falta de Planeación":</h4>
                  <p className="text-sm text-slate-600">La asignación no obedece a un cálculo ad-hoc, sino a la parametrización del modelo de Pérdida Máxima Probable (PMP) cruzado con el EDAN oficial de la UNGRD, garantizando el principio de planeación incluso en escenarios de emergencia.</p>
                </div>
                <div className="border-l-2 border-indigo-500 pl-4">
                  <h4 className="font-bold text-sm">B. Frente al hallazgo de "Sobrecostos":</h4>
                  <p className="text-sm text-slate-600">Se ha implementado el indicador de Costo Unitario de Atención (CUA). El Ministerio de Hacienda condiciona los desembolsos a que las entidades ejecutoras no superen el percentil 75 de los precios históricos del SECOP para bienes de asistencia, previniendo la especulación.</p>
                </div>
                <div className="border-l-2 border-indigo-500 pl-4">
                  <h4 className="font-bold text-sm">C. Frente al hallazgo de "Desvío de Recursos" (Falta de Conexidad):</h4>
                  <p className="text-sm text-slate-600">Se estableció un Índice de Coherencia Contractual (ICC) estricto. Los recursos aprobados tienen destinación específica bloqueada en el SIIF exclusivamente para rubros de mitigación del evento, impidiendo su uso en gastos de funcionamiento ordinario.</p>
                </div>
                <div className="border-l-2 border-indigo-500 pl-4">
                  <h4 className="font-bold text-sm">D. Frente al hallazgo de "Detrimento Patrimonial por Ineficacia":</h4>
                  <p className="text-sm text-slate-600">Los giros se estructuraron bajo un modelo de pagos por resultados y giros condicionados a la Velocidad de Respuesta Financiera (VRF), asegurando que el Estado solo desembolsa liquidez en la medida en que la asistencia llega efectivamente a la población registrada en el RUD.</p>
                </div>
              </div>
            </section>

            {/* VII. Conclusiones */}
            <section>
              <h3 className="text-lg font-black uppercase border-l-4 border-slate-800 pl-3 mb-4">
                VII. Concepto de Viabilidad Financiera
              </h3>
              <p className="font-bold text-indigo-900 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                Con base en la caracterización técnica, la metodología de cuantificación y los mecanismos de control fiscal establecidos, la Dirección General del Presupuesto Público Nacional emite CONCEPTO FAVORABLE para la asignación y giro de los recursos solicitados, en estricto apego a la legalidad y la eficiencia del gasto público.
              </p>
            </section>

            {/* Signatures */}
            <div className="mt-16 pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center">
              <div>
                <div className="h-16 border-b border-slate-400 w-3/4 mx-auto mb-2"></div>
                <p className="font-bold text-sm">Asesor Técnico Especializado</p>
                <p className="text-xs text-slate-500">Ministerio de Hacienda y Crédito Público</p>
              </div>
              <div>
                <div className="h-16 border-b border-slate-400 w-3/4 mx-auto mb-2"></div>
                <p className="font-bold text-sm">Director General del Presupuesto</p>
                <p className="text-xs text-slate-500">Ministerio de Hacienda y Crédito Público</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
