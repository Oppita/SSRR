import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, X, TrendingUp, AlertTriangle, FileText, Map as MapIcon, BarChart2, PieChart as PieIcon, History, Zap, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ProjectData, Professional } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { generateContent, getAIProvider, setAIProvider, AIProvider, getAIModel } from '../services/aiProviderService';

interface Props {
  projects: ProjectData[];
  professionals?: Professional[];
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'chart' | 'scenario' | 'report';
  data?: any;
}

export const StrategicAssistant: React.FC<Props> = ({ projects, professionals = [], onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Hola. Soy tu Asistente Estratégico de IA. Puedo ayudarte con análisis complejos, generación de escenarios, detección de patrones históricos, toma de decisiones basada en datos y consultas sobre contratistas (OPS). ¿En qué puedo apoyarte hoy?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<AIProvider>(getAIProvider());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    setAIProvider(newProvider);
  };

  const handleSend = async (query?: string) => {
    const userMessage = query || input.trim();
    if (!userMessage || isLoading) return;

    if (!query) setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Send all projects to the AI to maximize its capabilities.
      // We map only the essential fields to optimize token usage.
      const projectContext = projects.map(p => ({
        nombre: p.project.nombre,
        municipio: p.project.municipio,
        departamento: p.project.departamento,
        avanceFisico: p.project.avanceFisico,
        avanceProgramado: p.project.avanceProgramado,
        presupuesto: p.presupuesto.valorTotal,
        ejecutado: p.presupuesto.pagosRealizados,
        estado: p.project.estado,
        alertas: p.alerts.length,
        linea: p.project.linea,
        empleosGenerados: p.project.empleosGenerados,
        poblacionBeneficiada: p.project.poblacionBeneficiada,
        riesgoAntes: p.project.riesgoAntes,
        riesgoDespues: p.project.riesgoDespues
      }));

      const professionalContext = professionals.map(p => ({
        nombre: p.nombre,
        profesion: p.profesion,
        salarioMensual: p.salarioMensual,
        fechaInicio: p.fechaInicio,
        vigencia: p.vigencia,
        numeroContrato: p.numeroContrato,
        departamentosExperiencia: p.departamentosExperiencia,
        carga: p.carga
      }));

      const prompt = `
        Eres el "Centro de Inteligencia" y Asistente Estratégico de IA experto en gestión pública, infraestructura y gestión del riesgo en Colombia.
        Tu objetivo es realizar "Deep Learning" y análisis avanzado sobre el portafolio de proyectos y contratistas proporcionados.
        
        Tienes acceso a la siguiente información de proyectos:
        ${JSON.stringify(projectContext)}

        Tienes acceso a la siguiente información de contratistas (OPS):
        ${JSON.stringify(professionalContext)}
        
        Instrucciones CRÍTICAS:
        1. RESPONDE ÚNICA Y EXCLUSIVAMENTE basándote en los datos de los proyectos y contratistas proporcionados. 
        2. BAJO NINGUNA CIRCUNSTANCIA respondas a preguntas sobre temas ajenos a la gestión de estos proyectos o contratistas (ej. psicología, filosofía, programación general, etc.). Si el usuario pregunta algo fuera de contexto, responde cortésmente que tu función es analizar el portafolio de proyectos y contratistas.
        3. Analiza profundamente los datos para identificar tendencias, patrones de éxito, cuellos de botella y casos de éxito replicables.
        4. Responde a la pregunta del usuario: "${userMessage}"
        5. Proporciona recomendaciones basadas en evidencia, enfocadas en eficiencia, reducción de riesgos, impacto territorial (empleos, población) y cumplimiento de metas.
        6. Mantén un tono profesional, objetivo, estratégico y analítico.
        
        IMPORTANTE: Responde siempre en español. Usa formato Markdown.
        Si detectas que una visualización (gráfica de barras o torta) ayudaría a entender la respuesta, incluye al final de tu respuesta un bloque JSON con el siguiente formato exacto:
        \`\`\`json
        {
          "chart_type": "bar" | "pie",
          "chart_data": [{"name": "Label", "value": 100}]
        }
        \`\`\`
      `;

      const text = await generateContent(prompt, getAIModel());
      
      // Extract chart data if present
      let cleanText = text;
      let chartData = null;
      
      // Robust JSON extraction
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonCandidate = text.substring(firstBrace, lastBrace + 1);
        try {
          const parsed = JSON.parse(jsonCandidate);
          if (parsed.chart_type && parsed.chart_data) {
            chartData = { type: parsed.chart_type, data: parsed.chart_data };
            // Remove the JSON part from the text
            cleanText = text.replace(jsonCandidate, '').replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          }
        } catch (e) {
          console.error("Error parsing chart data", e);
        }
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: cleanText,
        type: chartData ? 'chart' : 'text',
        data: chartData
      }]);
    } catch (error) {
      console.error("Strategic Assistant Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, ocurrió un error al procesar tu consulta estratégica.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChart = (chart: any) => {
    if (!chart || !chart.data) return null;

    if (chart.type === 'bar') {
      return (
        <div className="h-64 w-full mt-4 bg-white p-4 rounded-xl border border-slate-200">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (chart.type === 'pie') {
      const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      return (
        <div className="h-64 w-full mt-4 bg-white p-4 rounded-xl border border-slate-200">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chart.data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="bg-slate-50 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <Bot size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Asistente Estratégico IA</h2>
              <p className="text-xs text-slate-400">Análisis Predictivo • Escenarios • Decisiones Basadas en Datos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
              className="bg-slate-800 text-white text-xs p-2 rounded-lg border border-slate-700"
            >
              <option value="gemini">Gemini</option>
              <option value="groq">Groq</option>
            </select>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border-b border-slate-200 p-3 flex gap-2 overflow-x-auto shrink-0 scrollbar-hide">
          {[
            { label: 'Optimizar Inversión', icon: TrendingUp, query: '¿Dónde debería invertirse para maximizar reducción del riesgo?' },
            { label: 'Impacto de Proyectos', icon: Zap, query: '¿Qué proyectos tienen mayor impacto social y económico?' },
            { label: 'Escenarios Nacionales', icon: MapIcon, query: 'Genera 3 escenarios estratégicos nacionales para el próximo semestre.' },
            { label: 'Patrones Históricos', icon: History, query: 'Detecta patrones históricos de riesgo y respuesta en los últimos proyectos.' },
            { label: 'Informe Ejecutivo', icon: FileText, query: 'Genera un informe ejecutivo automático del estado actual del portafolio.' }
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => handleSend(action.query)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 rounded-full text-xs font-semibold border border-slate-200 hover:border-indigo-200 transition-all whitespace-nowrap"
            >
              <action.icon size={14} />
              {action.label}
            </button>
          ))}
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-900 text-white'}`}>
                  {msg.role === 'user' ? <FileText size={16} /> : <Bot size={16} />}
                </div>
                <div className={`space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 rounded-tl-none'}`}>
                    <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : 'text-slate-700'}`}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                  {msg.data && renderChart(msg.data)}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                  <Loader2 size={18} className="animate-spin text-indigo-600" />
                  <span className="text-sm text-slate-500 font-medium italic">Procesando análisis estratégico...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-slate-200 shrink-0">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Haz una pregunta estratégica (ej: ¿Dónde maximizar la reducción del riesgo?)"
              className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className={`absolute right-2 p-2 rounded-xl transition-all ${!input.trim() || isLoading ? 'text-slate-300' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'}`}
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-3 uppercase tracking-widest font-bold">
            Potenciado por Gemini 3.1 Pro • Análisis de Datos en Tiempo Real
          </p>
        </div>
      </div>
    </div>
  );
};
