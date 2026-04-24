import React, { useState } from 'react';
import { ProjectMatrix } from '../types';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';

interface MatrixFormFieldsProps {
  matrix: Partial<ProjectMatrix>;
  onChange: (field: keyof ProjectMatrix, value: any) => void;
}

const FIELD_GROUPS = [
  {
    title: 'Identificación y Ubicación',
    fields: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'departamento', label: 'DEPARTAMENTO', type: 'text' },
      { key: 'municipio', label: 'MUNICIPIO', type: 'text' },
      { key: 'ubicacion', label: 'UBICACIÓN', type: 'text' },
      { key: 'codigoMunicipio', label: 'CODIGO MUNICIPIO', type: 'text' },
      { key: 'clave', label: 'CLAVE', type: 'text' },
      { key: 'tipoObra', label: 'TIPO DE OBRA', type: 'text' },
      { key: 'nombreProyecto', label: 'NOMBRE DEL PROYECTO', type: 'text' },
      { key: 'linea', label: 'LINEA', type: 'text' },
      { key: 'regalias', label: 'REGALIAS', type: 'text' },
    ]
  },
  {
    title: 'Convenio',
    fields: [
      { key: 'numeroConvenio', label: 'N° CONVENIO', type: 'text' },
      { key: 'partesConvenio', label: 'PARTES DEL CONVENIO', type: 'text' },
      { key: 'objetoConvenio', label: 'OBJETO DEL CONVENIO', type: 'textarea' },
      { key: 'plazoInicialMesesConvenio', label: 'PLAZO INICIAL (MESES) CONVENIO', type: 'number' },
      { key: 'tiempoTotalEjecucionMeses', label: 'TIEMPO TOTAL DE EJECUCIÓN (MESES)', type: 'number' },
      { key: 'actaInicioConvenio', label: 'ACTA DE INICIO CONVENIO', type: 'date' },
      { key: 'fechaFinalizacionConvenio', label: 'FECHA FINALIZACIÓN CONVENIO', type: 'date' },
    ]
  },
  {
    title: 'Presupuesto y CDP/RC',
    fields: [
      { key: 'afectacionPresupuestal', label: 'AFECTACIÓN PRESUPUESTAL', type: 'text' },
      { key: 'cdpConvenio', label: 'Numero de CDP CONVENIO', type: 'text' },
      { key: 'fechaCdpConvenio', label: 'Fecha de CDP CONVENIO', type: 'date' },
      { key: 'rcConvenio', label: 'Número de RC CONVENIO', type: 'text' },
      { key: 'fechaRcConvenio', label: 'Fecha de RC CONVENIO', type: 'date' },
      { key: 'cdpObra', label: 'Numero de CDP OBRA', type: 'text' },
      { key: 'fechaCdpObra', label: 'Fecha de CDP OBRA', type: 'date' },
      { key: 'rcObra', label: 'Número de RC OBRA', type: 'text' },
      { key: 'fechaRcObra', label: 'Fecha de RC OBRA', type: 'date' },
      { key: 'cdpInterventoria', label: 'Numero de CDP INTERVENTORIA', type: 'text' },
      { key: 'fechaCdpInterventoria', label: 'Fecha de CDP INTERVENTORIA', type: 'date' },
      { key: 'rcInterventoria', label: 'Número de RC INTERVENTORIA', type: 'text' },
      { key: 'fechaRcInterventoria', label: 'Fecha de RC INTERVENTORIA', type: 'date' },
      { key: 'afectacionesPresupuestalesAdiciones', label: 'AFECTACIONES PRESUPUESTALES ADICIONES', type: 'text' },
    ]
  },
  {
    title: 'Valores y Aportes',
    fields: [
      { key: 'aporteMunicipioGobernacionObraInterventoria', label: 'APORTE DEL MUNICIPIO O GOBERNACION OBRA + INTERVENTORIA', type: 'number' },
      { key: 'aporteFngrdObraInterventoria', label: 'APORTE DEL FNGRD OBRA + INTERVENTORIA', type: 'number' },
      { key: 'valorTotalProyecto', label: 'VALOR TOTAL PROYECTO', type: 'number' },
      { key: 'valorObraInterventoria', label: 'VALOR OBRA + INTERVENTORIA', type: 'number' },
      { key: 'aporteFondo', label: 'APORTE FONDO', type: 'number' },
      { key: 'valorPagadoConvenio', label: 'VALOR PAGADO CONVENIO', type: 'number' },
      { key: 'valorPagadoObra', label: 'VALOR PAGADO OBRA', type: 'number' },
      { key: 'valorPagadoInterventoria', label: 'VALOR PAGADO INTERVENTORIA', type: 'number' },
    ]
  },
  {
    title: 'Impacto',
    fields: [
      { key: 'personasBeneficiadas', label: 'PERSONAS BENEFICIADAS', type: 'number' },
      { key: 'empleosGenerados', label: 'EMPLEOS GENERADOS', type: 'number' },
    ]
  },
  {
    title: 'Contratación Obra',
    fields: [
      { key: 'numeroContratoObra', label: 'N° CONTRATO DE OBRA', type: 'text' },
      { key: 'objetoObra', label: 'OBJETO OBRA', type: 'textarea' },
      { key: 'valorContratoObra', label: 'VALOR CONTRATO OBRA', type: 'number' },
      { key: 'contratistaObra', label: 'CONTRATISTA OBRA', type: 'text' },
      { key: 'conformacionLegalObra', label: 'CONFORMACION LEGAL OBRA', type: 'text' },
      { key: 'nitContratistaObra', label: 'NIT CONTRATISTA OBRA', type: 'text' },
      { key: 'fechaInicioObra', label: 'FECHA INICIO OBRA', type: 'date' },
    ]
  },
  {
    title: 'Contratación Interventoría',
    fields: [
      { key: 'numeroContratoInterventoria', label: 'N° CONTRATO DE INTERVENTORIA', type: 'text' },
      { key: 'objetoInterventoria', label: 'OBJETO INTERVENTORIA', type: 'textarea' },
      { key: 'valorContratoInterventoria', label: 'VALOR CONTRATO INTERVENTORIA', type: 'number' },
      { key: 'contratistaInterventoria', label: 'CONTRATISTA DE INTERVENTORIA', type: 'text' },
      { key: 'conformacionLegalInterventoria', label: 'CONFORMACION LEGAL INTERVENTORÍA', type: 'text' },
      { key: 'nitContratistaInterventoria', label: 'NIT CONTRATISTA INTERVENTORIA', type: 'text' },
      { key: 'fechaSuscripcionInterventoria', label: 'FECHA DE SUSCRIPCION INTERVENTORÍA', type: 'date' },
    ]
  },
  {
    title: 'Fechas y Plazos (Ejecución)',
    fields: [
      { key: 'fechaFinalizacionInicial', label: 'FECHA FINALIZACIÓN INICIAL', type: 'date' },
      { key: 'fechaFinalizacionActual', label: 'FECHA FINALIZACIÓN ACTUAL', type: 'date' },
      { key: 'mesFinalizacionActual', label: 'MES FINALIZACION ACTUAL', type: 'text' },
      { key: 'anioFinalizacionActual', label: 'AÑO FINALIZACION ACTUAL', type: 'text' },
      { key: 'atrasoEjecucionObra', label: 'ATRASO EJECUCION OBRA', type: 'number' },
      { key: 'diasRestantesFinalizacion', label: 'DIAS RESTANTES FINALIZACION PROYECTO', type: 'number' },
      { key: 'entregaMunicipio', label: 'ENTREGA AL MUNICIPIO', type: 'text' },
      { key: 'fechaEntregaMunicipio', label: 'FECHA DE ENTREGA AL MUNICIPIO', type: 'date' },
    ]
  },
  {
    title: 'Liquidación',
    fields: [
      { key: 'fechaPerdidaCompetenciaLiquidacion', label: 'FECHA PERDIDA DE COMPETENCIA PARA LIQUIDACION', type: 'date' },
      { key: 'anioPerdidaCompetencia', label: 'AÑO PERDIDA DE COMPETENCIA', type: 'text' },
      { key: 'mesPerdidaCompetencia', label: 'MES PERDIDA DE COMPETENCIA', type: 'text' },
      { key: 'valorContraLiquidacionObra', label: 'VALOR CONTRA LIQUIDACION OBRA', type: 'number' },
      { key: 'valorContraLiquidacionInterventoria', label: 'VALOR CONTRA LIQUIDACION INTERVENTORIA', type: 'number' },
      { key: 'anioVencimientoLiquidacion', label: 'AÑO VENCIMIENTO LIQUIDACION', type: 'text' },
      { key: 'mesVencimiento', label: 'MES VENCIMIENTO', type: 'text' },
      { key: 'vencioTerminosLiquidacion', label: 'VENCIÓ TERMINOS PARA LIQUIDACION', type: 'text' },
      { key: 'liquidacionJudicialObra', label: 'LIQUIDACION JUDICIAL OBRA', type: 'text' },
      { key: 'liquidacionJudicialInterventoria', label: 'LIQUIDACION JUDICIAL INTERVENTORIA', type: 'text' },
    ]
  },
  {
    title: 'Avances',
    fields: [
      { key: 'avanceProgramado', label: 'AVANCE PROGRAMADO (%)', type: 'number' },
      { key: 'avanceFisico', label: 'AVANCE FISICO (%)', type: 'number' },
      { key: 'avanceFinancieroObra', label: 'AVANCE FINANCIERO OBRA (%)', type: 'number' },
      { key: 'avanceFinancieroInterventoria', label: 'AVANCE FINANCIERO INTERVENTORIA (%)', type: 'number' },
      { key: 'avanceFinancieroPonderado', label: 'AVANCE FINANCIERO PONDERADO OBRA E INTERVENTORIA (%)', type: 'number' },
      { key: 'ejecucionAl100', label: 'LA EJECUCIÓN LLEGÓ AL 100', type: 'text' },
    ]
  },
  {
    title: 'Estados y Apoyos',
    fields: [
      { key: 'estadoObra', label: 'ESTADO OBRA', type: 'text' },
      { key: 'estadoInterventoria', label: 'ESTADO INTERVENTORIA', type: 'text' },
      { key: 'estadoProyecto', label: 'ESTADO PROYECTO', type: 'text' },
      { key: 'detalleEstado', label: 'DETALLE ESTADO', type: 'textarea' },
      { key: 'apoyoTecnicoAntigüo', label: 'APOYO TECNICO ANTIGUO', type: 'text' },
      { key: 'apoyoFinanciero', label: 'APOYO FINANCIERO', type: 'text' },
      { key: 'apoyoJuridico', label: 'APOYO JURIDICO', type: 'text' },
      { key: 'apoyoJuridico2026', label: 'APOYO JURIDICO 2026', type: 'text' },
      { key: 'apoyoTecnico', label: 'APOYO TÉCNICO', type: 'text' },
      { key: 'apoyoTecnico2026', label: 'APOYO TECNICO 2026', type: 'text' },
    ]
  },
  {
    title: 'Alertas y Entes de Control',
    fields: [
      { key: 'afectaciones', label: 'AFECTACIONES', type: 'text' },
      { key: 'inhabilidadObra', label: 'INHABILIDAD OBRA', type: 'text' },
      { key: 'inhabilidadInterventoria', label: 'INHABILIDAD INTERVENTORIA', type: 'text' },
      { key: 'seguimientoEntesControl', label: 'SEGUIMIENTO ENTES DE CONTROL', type: 'text' },
      { key: 'pendienteFidu', label: 'PENDIENTE FIDU', type: 'text' },
      { key: 'detalleSeguimientoEntesControl', label: 'DETALLE SEGUIMIENTO ENTES DE CONTROL', type: 'textarea' },
      { key: 'alertaSarlaft', label: 'ALERTA SARLAFT', type: 'text' },
      { key: 'detalleAlerta', label: 'DETALLE ALERTA', type: 'textarea' },
      { key: 'detalleIncumplimiento', label: 'DETALLE INCUMPLIMIENTO', type: 'textarea' },
      { key: 'detalleConciliacionPrejudicial', label: 'DETALLE CONCILIACION PREJUDICIAL', type: 'textarea' },
    ]
  },
  {
    title: 'Permisos Ambientales',
    fields: [
      { key: 'autoridadAmbientalCompetente', label: 'AUTORIDAD AMBIENTAL COMPETENTE', type: 'text' },
      { key: 'requierePermisoOcupacionCauce', label: 'REQUIERE PERMISO DE OCUPACIÓN DE CAUCE (SI/NO)', type: 'text' },
      { key: 'tramitoPermisoOcupacionCauce', label: 'TRAMITO PERMISO DE OCUPACIÓN DE CAUCE (SI/NO)', type: 'text' },
      { key: 'numeroResolucionOcupacionCauce', label: 'NÚMERO DE RESOLUCIÓN PERMISO OCUPACIÓN DE CAUCE', type: 'text' },
      { key: 'fechaSolicitudOcupacionCauce', label: 'FECHA DE SOLICITUD PERMISO OCUPACIÓN DE CAUCE', type: 'date' },
      { key: 'fechaResolucionOcupacionCauce', label: 'FECHA DE RESOLUCIÓN PERMISO OCUPACIÓN DE CAUCE', type: 'date' },
      { key: 'alcanceResolucion', label: 'ALCANCE RESOLUCIÓN (tramos, km)', type: 'text' },
      { key: 'alcanceRealObra', label: 'ALCANCE REAL DE LA OBRA (tramos, km)', type: 'text' },
      { key: 'brechaIdentificada', label: 'BRECHA IDENTIFICADA (Detalle)', type: 'textarea' },
      { key: 'requierePermisoAprovechamientoForestal', label: 'REQUIERE PERMISO DE APROVECHAMIENTO FORESTAL (SI/NO)', type: 'text' },
      { key: 'tramitePermisoAprovechamientoForestal', label: 'TRAMITE PERMISO DE APROVECHAMIENTO FORESTAL (SI/NO)', type: 'text' },
      { key: 'numeroResolucionAprovechamientoForestal', label: 'NÚMERO DE RESOLUCIÓN PERMISO APROVECHAMIENTO FORESTAL', type: 'text' },
      { key: 'fechaTramiteAprovechamientoForestal', label: 'FECHA TRAMITE PERMISO APROVECHAMIENTO FORESTAL', type: 'date' },
      { key: 'fechaPermisoAprovechamientoForestal', label: 'FECHA PERMISO APROVECHAMIENTO FORESTAL', type: 'date' },
      { key: 'especificacionPermiso', label: 'ESPECIFICACIÓN PERMISO', type: 'text' },
      { key: 'analisisMultitemporalAdjunto', label: 'ANÁLISIS MULTITEMPORAL ADJUNTO (sí/no)', type: 'text' },
      { key: 'evidenciaFotografica', label: 'EVIDENCIA FOTOGRAFICA (sí/no)', type: 'text' },
      { key: 'compensacionesExigidas', label: 'COMPENSACIONES EXIGIDAS', type: 'text' },
      { key: 'inversion1Pct', label: 'Inversión del 1% (aplica/no)', type: 'text' },
      { key: 'estadoCumplimiento1Pct', label: 'Estado del cumplimiento del 1%', type: 'text' },
      { key: 'observacionesGenerales', label: 'Observaciones generales', type: 'textarea' },
    ]
  },
  {
    title: 'Seguimientos y Reportes',
    fields: [
      { key: 'avancesReportadosInterventoria', label: 'AVANCES REPORTADOS POR INTERVENTORIA', type: 'textarea' },
      { key: 'avancesReportadosEnteTerritorial', label: 'AVANCES REPORTADOS POR ENTE TERRITORIAL', type: 'textarea' },
      { key: 'avancesReportadosAutoridadAmbiental', label: 'AVANCES REPORTADOS POR LA AUTORIDAD AMBIENTAL', type: 'textarea' },
      { key: 'seguimientoSubdirectoraSept2025', label: 'Seguimiento Subdirectora Septiembre 2025', type: 'textarea' },
      { key: 'seguimientoSubdirectoraOct2025', label: 'Seguimiento Subdirectora Octubre 2025', type: 'textarea' },
      { key: 'seguimientoNov11_2025', label: 'Seguimiento 11 de Noviembre 2025', type: 'textarea' },
      { key: 'seguimientoNov20_2025', label: 'Seguimiento 20 de Noviembre 2025', type: 'textarea' },
      { key: 'seguimientoDic05_2025', label: 'Seguimiento 5 de Diciembre 2025', type: 'textarea' },
      { key: 'seguimientoDic12_2025', label: 'Seguimiento 12 de Diciembre de 2025', type: 'textarea' },
      { key: 'seguimientoDic13_2025', label: 'Seguimiento 13 de Diciembre de 2025', type: 'textarea' },
      { key: 'seguimientoEne08_2026', label: 'Seguimiento 8 de Enero de 2026', type: 'textarea' },
      { key: 'seguimientoEne22_2026', label: 'Seguimiento 22 de Enero de 2026', type: 'textarea' },
      { key: 'seguimientoFeb06_2026', label: 'Seguimiento de 6 de Febrero de 2026', type: 'textarea' },
      { key: 'seguimientoFeb16_2026', label: 'Seguimiento de 16 de Febrero de 2026', type: 'textarea' },
      { key: 'seguimientoFeb24_2026', label: 'Seguimiento 24 de Febrero de 2026', type: 'textarea' },
      { key: 'seguimientoMar02_2026', label: 'Seguimiento 02 de Marzo de 2026', type: 'textarea' },
      { key: 'seguimientoMar16_2026', label: 'Seguimiento 16 de Marzo de 2026', type: 'textarea' },
    ]
  }
];

export const MatrixFormFields: React.FC<MatrixFormFieldsProps> = ({ matrix, onChange }) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Identificación y Ubicación': true,
    'Convenio': true,
  });

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Layers className="text-indigo-600" size={24} />
        <h3 className="text-xl font-bold text-slate-800">
          Campos de la Matriz Oficial Institucional
        </h3>
      </div>
      
      {FIELD_GROUPS.map((group) => (
        <div key={group.title} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <button
            type="button"
            onClick={() => toggleGroup(group.title)}
            className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <span className="font-bold text-slate-700">{group.title}</span>
            {expandedGroups[group.title] ? (
              <ChevronUp size={20} className="text-slate-500" />
            ) : (
              <ChevronDown size={20} className="text-slate-500" />
            )}
          </button>
          
          {expandedGroups[group.title] && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-slate-200">
              {group.fields.map((field) => (
                <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {field.label}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px]"
                      value={(matrix[field.key as keyof ProjectMatrix] as string) || ''}
                      onChange={(e) => onChange(field.key as keyof ProjectMatrix, e.target.value)}
                    />
                  ) : field.type === 'number' ? (
                    <input
                      type="number"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={(matrix[field.key as keyof ProjectMatrix] as number) ?? ''}
                      onChange={(e) => onChange(field.key as keyof ProjectMatrix, e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  ) : (
                    <input
                      type={field.type}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={(matrix[field.key as keyof ProjectMatrix] as string) || ''}
                      onChange={(e) => onChange(field.key as keyof ProjectMatrix, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
