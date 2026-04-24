import React from 'react';
import { Building2, ShieldCheck, FileText, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onEnterAdmin: () => void;
  onEnterSurveys: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterAdmin, onEnterSurveys }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
            <Building2 size={40} />
          </div>
        </div>
        
        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
          Sistema de Gestión Institucional
        </h1>
        
        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Plataforma integral para el control, seguimiento y estructuración de proyectos de inversión pública y gestión del riesgo.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-3xl mx-auto text-sm">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-left">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <ShieldCheck size={24} />
            </div>
            <h3 className="font-bold text-slate-800 mb-2">Control Transparente</h3>
            <p className="text-slate-500 text-sm">Seguimiento en tiempo real de la ejecución física y financiera.</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-left">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <FileText size={24} />
            </div>
            <h3 className="font-bold text-slate-800 mb-2">Gestión Documental</h3>
            <p className="text-slate-500 text-sm">Repositorio centralizado para todos los soportes del proyecto.</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-left">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <ArrowRight size={24} />
            </div>
            <h3 className="font-bold text-slate-800 mb-2">Encuestas Sociales</h3>
            <p className="text-slate-500 text-sm">Módulo de análisis de constructo social y percepción del riesgo.</p>
          </div>
        </div>

        <div className="pt-12 flex flex-col md:flex-row gap-4 justify-center">
          <button 
            onClick={onEnterAdmin}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95"
          >
            Módulo Administrativo <ArrowRight size={20} />
          </button>
          
          <button 
            onClick={onEnterSurveys}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-black hover:shadow-lg hover:shadow-slate-200 transition-all active:scale-95 border-2 border-slate-900"
          >
            Encuestas Territoriales <FileText size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
