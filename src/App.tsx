import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, FolderKanban, AlertTriangle, Settings, LogOut, Search, Bell, 
  TableProperties, Activity, Map, Zap, PlusCircle, Calendar, Users, FileText, 
  ClipboardCheck, CloudUpload, CloudDownload, Loader2, RefreshCw, CheckSquare, 
  BrainCircuit, ShieldCheck, Database, CloudRain, TrendingUp, Download, Lock as LockIcon, X 
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Vista360 } from './components/Vista360';
import { ProjectDetails } from './components/ProjectDetails';
import { MatrizInteligente } from './components/MatrizInteligente';
import { GeneradorInformes } from './components/GeneradorInformes';
import { CentroControlSRR } from './components/CentroControlSRR';
import { CentroInteligenciaSRR } from './components/CentroInteligenciaSRR';
import FlujoInstitucional from './components/FlujoInstitucional';
import { ColombiaMap } from './components/ColombiaMap';
import { TerritorialPanel } from './components/TerritorialPanel';
import { VigenciaModule } from './components/VigenciaModule';
import { ContractorProfile } from './components/ContractorProfile';
import { DocumentRepository } from './components/DocumentRepository';
import { AgendaPMU } from './components/AgendaPMU';
import { CreateProjectForm } from './components/CreateProjectForm';
import { LandingPage } from './components/LandingPage';
import { GestionOPS } from './components/GestionOPS';
import { GestionComisiones } from './components/GestionComisiones';
import { GestionPolizas } from './components/GestionPolizas';
import { TaskBoard } from './components/TaskBoard';
import { PriorizacionInversion } from './components/PriorizacionInversion';
import { RiskDashboard } from './components/RiskDashboard';
import { Auth } from './components/Auth';
import { ProteccionFinanciera } from './components/ProteccionFinanciera';
import { LaboratorioFinanciero } from './components/LaboratorioFinanciero';
import { FinancialTraceabilityDashboard } from './components/FinancialTraceabilityDashboard';
import { MicRModule } from './components/MicRModule';
import { EventosDashboard } from './components/EventosDashboard';
import { SurveyModule } from './components/SurveyModule';
import { supabase, isSupabaseConfigured, supabaseUrl } from './lib/supabase';
import { ProjectData, DepartmentRisk, Threat } from './types';

import { mockThreats } from './data/mockDepartments';
import { useProject } from './store/ProjectContext';
import { showAlert } from './utils/alert';

function App() {
  const { 
    state, 
    getProjectData, 
    addProject, 
    addContract,
    addFinancialDocument,
    addPago,
    addAvance,
    saveToSupabase, 
    loadFromSupabase, 
    repairAllUrls, 
    syncing, 
    loading: contextLoading, 
    error: syncError, 
    isCloudCheckComplete, 
    hasSyncedWithCloud,
    importFromJSON,
    exportToJSON
  } = useProject();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeView, setActiveView] = useState<
    'landing' | 'dashboard' | 'project' | 'vista360' | 'matriz' | 'informes' | 
    'centroControl' | 'mapa' | 'inteligencia' | 'crearProyecto' | 'vigencias' | 
    'contractors' | 'documents' | 'flujo' | 'ops' | 'comisiones' | 'tareas' | 
    'interventoria' | 'riesgo' | 'priorizacion' | 'pot' | 'riesgoDashboard' | 
    'polizas' | 'agenda' | 'financiera' | 'laboratorio' | 'micr' | 'eventos' | 
    'trazabilidad' | 'encuestas'
  >('landing');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [reportProjectId, setReportProjectId] = useState<string | undefined>();
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Perfiles de acceso por correo
  const userRole = useMemo(() => {
    if (!user) return 'public';
    if (user.email?.includes('encuestas') || user.email?.includes('survey')) return 'survey_only';
    // Make any logged in user an admin to avoid issues with export/import limits
    return 'admin';
  }, [user]);

  const canAccessModule = (view: string) => {
    if (userRole === 'admin') return true;
    if (userRole === 'survey_only') return view === 'encuestas';
    return view !== 'config' && view !== 'financiera' && view !== 'laboratorio' && view !== 'priorizacion';
  };

  const executeWithGuard = async (action: () => void) => {
    if (!isSupabaseConfigured) {
      action();
      return;
    }

    if (!user) {
      setShowAuth(true);
      showAlert('Debe iniciar sesión con una cuenta autorizada para realizar acciones de administración.');
      return;
    }

    const pass = prompt('⚠️ ACCIÓN PROTEGIDA: Por favor, ingrese su contraseña de Supabase para confirmar:');
    if (!pass) return;

    try {
      setAuthLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ 
        email: user.email, 
        password: pass 
      });
      
      if (error) {
        showAlert('❌ Acceso Denegado: La contraseña ingresada no es válida para esta cuenta.');
        return;
      }
      
      action();
    } catch (err) {
      showAlert('Error de seguridad al validar la cuenta.');
    } finally {
      setAuthLoading(false);
    }
  };

  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleAlert = (e: CustomEvent) => {
      setAlertMessage(e.detail);
    };
    window.addEventListener('show-alert', handleAlert as EventListener);
    return () => window.removeEventListener('show-alert', handleAlert as EventListener);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (!isSupabaseConfigured) {
        setAuthLoading(false);
        return;
      }

      console.log('🔄 Verificando estado de Supabase...');
      
      let retries = 3;
      let delay = 2000;
      let sessionFound = false;

      while (retries > 0 && !sessionFound) {
        try {
          // Timeout más largo: 12 segundos por intento
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout excedido')), 12000)
          );

          const sessionPromise = supabase.auth.getSession();
          
          const { data: { session }, error } = await Promise.race([
            sessionPromise,
            timeoutPromise
          ]) as any;

          if (error) {
            if (error.message.includes('Refresh Token Not Found') || error.message.includes('Invalid Refresh Token')) {
              console.warn('⚠️ Sesión expirada o inválida, limpiando estado...');
              await supabase.auth.signOut();
              setUser(null);
              sessionFound = true;
            } else {
              throw error;
            }
          } else {
            setUser(session?.user ?? null);
            sessionFound = true;
            console.log('✅ Supabase conectado correctamente');
          }
        } catch (err: any) {
          retries--;
          const errorMsg = err?.message || 'Error desconocido';
          console.warn(`⏳ Intento ${4 - retries}/3 falló: ${errorMsg}`);

          if (retries > 0) {
            // Esperar antes de reintentar (backoff exponencial)
            await new Promise(r => setTimeout(r, delay));
            delay *= 1.5;
          } else {
            console.warn('❌ Supabase no disponible después de reintentos, usando modo local');
          }
        }
      }

      setAuthLoading(false);
    };

    initAuth();

    const { data: { subscription } } = isSupabaseConfigured 
      ? supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
        })
      : { data: { subscription: { unsubscribe: () => {} } } };

    return () => subscription.unsubscribe();
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setActiveView('landing');
  };

  const handleExportData = () => {
    executeWithGuard(() => {
      const dataStr = localStorage.getItem('srr_app_state');
      if (!dataStr) {
        showAlert('No hay datos para exportar.');
        return;
      }
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `srr_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    });
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    executeWithGuard(() => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          // Validate JSON
          JSON.parse(content);
          localStorage.setItem('srr_app_state', content);
          showAlert('Datos importados correctamente. La página se recargará.');
          setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
          showAlert('Error al importar el archivo. Asegúrese de que sea un archivo JSON válido exportado desde esta aplicación.');
        }
      };
      reader.readAsText(file);
    });
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInjectTestProject = () => {
    executeWithGuard(() => {
      const now = Date.now();
      const pId = `PROJ-EJEMPLO-${now}`;
      const contractId = `CONT-EJEMPLO-${now}`;
      const cdpId = `CDP-EJEMPLO-${now}`;
      const rcId = `RC-EJEMPLO-${now}`;
      const pago1Id = `PAGO1-EJEMPLO-${now}`;
      const pago2Id = `PAGO2-EJEMPLO-${now}`;
      const curDate = new Date().toISOString().split('T')[0];

      // 1. Crear Proyecto
      addProject({
        id: pId,
        nombre: 'Proyecto de Ejemplo con Trazabilidad Financiera',
        objetivoGeneral: 'Construcción y mejoramiento de infraestructura vial con ejecución financiera completa.',
        departamento: 'Cundinamarca',
        municipio: 'Bogotá',
        linea: 'Infraestructura',
        fechaInicio: '2025-01-01',
        fechaFin: '2026-12-31',
        avanceFisico: 35,
        avanceProgramado: 40,
        estado: 'En ejecución'
      });

      // 2. Crear Contrato
      addContract({
        id: contractId,
        projectId: pId,
        numero: 'CONT-2025-001',
        tipo: 'Obra',
        objetoContractual: 'Construcción de vía principal fase 1',
        contratista: 'Consorcio Vías Colombia',
        nit: '900.123.456-7',
        valor: 4500000000,
        fechaInicio: '2025-01-15',
        fechaFin: '2026-11-30',
        estado: 'En ejecución',
        plazoMeses: 22,
        eventos: []
      });

      // 3. Crear CDP
      addFinancialDocument({
        id: cdpId,
        projectId: pId,
        contractId: contractId,
        tipo: 'CDP',
        numero: 'CDP-2025-100',
        valor: 4500000000,
        fecha: '2025-01-05',
        nombre: 'CDP Inicial para Obras',
        rubro: 'Inversión Infraestructura',
        fuente: 'Presupuesto General',
        descripcion: 'Certificado de disponibilidad presupuestal para el contrato de obra principal',
        validacion_ia: { coherente: true, observaciones: 'Aprobado automáticamente', inconsistencias: [] }
      });

      // 4. Crear RC (Registro de Compromiso)
      addFinancialDocument({
        id: rcId,
        projectId: pId,
        contractId: contractId,
        tipo: 'RC',
        numero: 'RC-2025-080',
        numeroCdp: 'CDP-2025-100', // Referencia al CDP
        valor: 4500000000,
        fecha: '2025-01-15',
        nombre: 'Compromiso Contrato 001',
        rubro: 'Inversión Infraestructura',
        fuente: 'Presupuesto General',
        descripcion: 'Registro de compromiso derivado del contrato de obra',
        valorPagado: 0, // Inicia en 0, los pagos lo alimentan
        validacion_ia: { coherente: true, observaciones: 'Acorde al CDP', inconsistencias: [] }
      });

      // 5. Crear Pagos (2 pagos de ejemplo)
      addPago({
        id: pago1Id,
        contractId: contractId,
        rcId: rcId, // Atado al RC
        numero: 'PAGO-001',
        numeroFactura: 'FAC-001',
        fecha: '2025-03-01',
        fechaPagoReal: '2025-03-05',
        valor: 1000000000,
        estado: 'Pagado',
        beneficiario: 'Consorcio Vías Colombia',
        nitBeneficiario: '900.123.456-7',
        entidadBancaria: 'Banco de Bogotá',
        comprobanteEgreso: 'CE-2025-03-01',
        observaciones: 'Pago de prueba'
      });

      addPago({
        id: pago2Id,
        contractId: contractId,
        rcId: rcId, // Atado al RC
        numero: 'PAGO-002',
        numeroFactura: 'FAC-002',
        fecha: '2025-04-01',
        fechaPagoReal: '2025-04-10',
        valor: 800000000, // Total pagado será 1.800.000.000
        estado: 'Pagado',
        beneficiario: 'Consorcio Vías Colombia',
        entidadBancaria: 'Banco de Bogotá',
        comprobanteEgreso: 'CE-2025-04-02',
        observaciones: 'Pago correspondiente al mes de abril'
      });

      // 6. Avance
      addAvance(pId, {
        id: `AV-${now}`,
        projectId: pId,
        fecha: curDate,
        fisicoPct: 35,
        financieroPct: (1800000000 / 4500000000) * 100, // 40%
        programadoPct: 40,
        observaciones: 'Avance calculado con ejemplo. Primeros meses de ejecución',
        reportadoPor: 'Sistema'
      });

      showAlert('Proyecto de Ejemplo cargado exitosamente. Búscalo como "Proyecto de Ejemplo con Trazabilidad Financiera".');
    });
  };

  const handleClearCache = () => {
    executeWithGuard(async () => {
      if (window.confirm('¿Está seguro de que desea limpiar el caché local? Esto eliminará los datos guardados en el navegador, cerrará su sesión y recargará la página.')) {
        // Clear Supabase session
        await supabase.auth.signOut();
        
        // Clear local storage
        localStorage.removeItem('srr_app_state');
        // Also clear other potential large keys
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('edan_data_') || key.includes('supabase.auth.token')) {
            localStorage.removeItem(key);
          }
        });
        
        // Final fallback: clear everything
        localStorage.clear();
        
        showAlert('Caché local limpiado y sesión cerrada. Recargando...');
        setTimeout(() => window.location.reload(), 1500);
      }
    });
  };
  
  // Reconstruct ProjectData array for components that expect it
  const projectsData: ProjectData[] = useMemo(() => {
    const allProjects = state.proyectos.map(p => getProjectData(p.id)!).filter(Boolean);
    return allProjects.filter(p => 
      (p.project.nombre || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (p.project.municipio || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      state.contratos.some(c => c.projectId === p.project.id && ((c.numero?.toString() || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || (c.nit?.toString() || '').toLowerCase().includes((searchQuery || '').toLowerCase())))
    );
  }, [state, getProjectData, searchQuery]);

  const dynamicDepartments = useMemo(() => {
    return state.departamentos.map(dept => {
      const deptProjects = projectsData.filter(p => p.project.departamento === dept.name);
      const totalInvestment = deptProjects.reduce((sum, p) => {
        const projectContracts = p.contracts || [];
        const contractValue = projectContracts.reduce((cSum, c) => cSum + c.valor, 0);
        return sum + contractValue;
      }, 0);
      
      return {
        ...dept,
        investment: totalInvestment > 0 ? totalInvestment : dept.investment // Fallback to mock if no projects
      };
    });
  }, [projectsData, state.departamentos]);

  const selectedProject = useMemo(() => {
    return selectedProjectId ? getProjectData(selectedProjectId) : null;
  }, [selectedProjectId, getProjectData]);

  const handleProjectSelect = (project: ProjectData) => {
    setSelectedProjectId(project.project.id);
    setActiveView('project');
  };

  const handleOpenPanel = (dept: string) => {
    setSelectedDept(dept);
  };

  const handleBackToDashboard = () => {
    setSelectedProjectId(null);
    setActiveView('dashboard');
  };

  // Function to update project data from the matrix
  const handleUpdateProject = (projectId: string, section: string, field: string, value: any) => {
    // In a real app, this would call a dispatch or an API
    console.log('Update project:', projectId, section, field, value);
  };

  const handleGenerateReport = (projectId: string) => {
    setReportProjectId(projectId);
    setActiveView('informes');
  };

  const handleSaveToCloud = async () => {
    executeWithGuard(async () => {
      try {
        await saveToSupabase(true);
        showAlert('Datos guardados en la nube correctamente.');
      } catch (e) {
        showAlert('Error al guardar en la nube.');
      }
    });
  };

  const handleLoadFromCloud = async () => {
    executeWithGuard(async () => {
      try {
        await loadFromSupabase(true);
        showAlert('Datos cargados desde la nube correctamente.');
      } catch (e) {
        showAlert('Error al cargar desde la nube.');
      }
    });
  };

  const [showAuth, setShowAuth] = useState(false);

  // Ya no bloqueamos la app con la pantalla de Auth. 
  // Permitimos que la app se cargue de inmediato con datos locales.
  
  if (activeView === 'landing' && !showAuth) {
    return <LandingPage 
      onEnterAdmin={() => {
        // Redirigir a encuestas si es perfil de encuestas, si no a dashboard
        if (userRole === 'survey_only') setActiveView('encuestas');
        else setActiveView('dashboard');
      }} 
      onEnterSurveys={() => setActiveView('encuestas')}
    />;
  }

  // Notificamos si no hay sesión pero no bloqueamos
  const isPublicUser = !user && isSupabaseConfigured;

  if (showAuth || (isPublicUser && activeView === 'landing' && false)) { // false por ahora para no bloquear
     return <Auth onSuccess={() => {
       setShowAuth(false);
       if (userRole === 'survey_only') setActiveView('encuestas');
       else setActiveView('dashboard');
     }} />;
  }

  if (activeView === 'encuestas') {
    return (
      <div className="h-screen w-screen bg-slate-50 overflow-y-auto overflow-x-hidden">
        <SurveyModule onExit={() => setActiveView('landing')} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold">
            M
          </div>
          <span className="font-semibold text-white tracking-wide">Matriz Inteligente</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {canAccessModule('dashboard') && (
            <button 
              onClick={handleBackToDashboard}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeView === 'dashboard' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <LayoutDashboard size={20} />
              <span className="font-medium">Dashboard Ejecutivo SRR</span>
            </button>
          )}
          
          {canAccessModule('flujo') && (
            <button 
              onClick={() => setActiveView('flujo')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeView === 'flujo' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <ClipboardCheck size={20} />
              <span className="font-medium">Banco de Proyectos</span>
            </button>
          )}

          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Gestión
          </div>
          
          {canAccessModule('inteligencia') && (
            <button 
              onClick={() => setActiveView('inteligencia')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeView === 'inteligencia' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <BrainCircuit size={20} />
              <span className="font-medium">Centro de Inteligencia</span>
            </button>
          )}

          {canAccessModule('financiera') && (
            <button 
              onClick={() => setActiveView('financiera')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeView === 'financiera' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <ShieldCheck size={20} />
              <span className="font-medium">Prot. Financiera</span>
            </button>
          )}

          {canAccessModule('laboratorio') && (
            <button 
              onClick={() => setActiveView('laboratorio')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeView === 'laboratorio' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <TrendingUp size={20} />
              <span className="font-medium">Laboratorio Financiero</span>
            </button>
          )}

          {canAccessModule('eventos') && (
            <button 
              onClick={() => setActiveView('eventos')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeView === 'eventos' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <CloudRain size={20} />
              <span className="font-medium">Gestión de Eventos (MIC-R/PMU)</span>
            </button>
          )}

          {canAccessModule('riesgoDashboard') && (
            <button 
              onClick={() => setActiveView('riesgoDashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeView === 'riesgoDashboard' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <AlertTriangle size={20} />
              <span className="font-medium">Dashboard de Riesgos</span>
            </button>
          )}

          {canAccessModule('priorizacion') && (
            <button 
              onClick={() => setActiveView('priorizacion')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeView === 'priorizacion' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <TableProperties size={20} />
              <span className="font-medium">Priorización Inversión</span>
            </button>
          )}

          {canAccessModule('centroControl') && (
            <button 
              onClick={() => setActiveView('centroControl')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeView === 'centroControl' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <Activity size={20} />
              <span className="font-medium">Centro de Control SRR</span>
            </button>
          )}

          {canAccessModule('mapa') && (
            <button 
              onClick={() => setActiveView('mapa')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeView === 'mapa' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <Map size={20} />
              <span className="font-medium">Mapa Territorial</span>
            </button>
          )}

          {canAccessModule('matriz') && (
            <button 
              onClick={() => setActiveView('matriz')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeView === 'matriz' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <TableProperties size={20} />
              <span className="font-medium">Matriz Seguimiento SRR</span>
            </button>
          )}

          {canAccessModule('informes') && (
            <button 
              onClick={() => setActiveView('informes')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeView === 'informes' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <FolderKanban size={20} />
              <span className="font-medium">Generador de Informes</span>
            </button>
          )}

          {canAccessModule('tareas') && (
            <button 
              onClick={() => setActiveView('tareas')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeView === 'tareas' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <CheckSquare size={20} />
              <span className="font-medium">Tareas y Notificaciones</span>
            </button>
          )}

          {canAccessModule('vigencias') && (
            <button 
              onClick={() => setActiveView('vigencias')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeView === 'vigencias' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <Calendar size={20} />
              <span className="font-medium">Vigencias e Inversión</span>
            </button>
          )}

          {canAccessModule('contractors') && (
            <button 
              onClick={() => setActiveView('contractors')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeView === 'contractors' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <Users size={20} />
              <span className="font-medium">Perfil de Contratista</span>
            </button>
          )}

          {canAccessModule('ops') && (
            <button 
              onClick={() => setActiveView('ops')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeView === 'ops' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <Users size={20} />
              <span className="font-medium">Gestión OPS</span>
            </button>
          )}

          {canAccessModule('comisiones') && (
            <button 
              onClick={() => setActiveView('comisiones')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeView === 'comisiones' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <Map size={20} />
              <span className="font-medium">Gestión Comisiones</span>
            </button>
          )}

          {canAccessModule('polizas') && (
            <button 
              onClick={() => setActiveView('polizas')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeView === 'polizas' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <ShieldCheck size={20} />
              <span className="font-medium">Gestión Pólizas</span>
            </button>
          )}

          {canAccessModule('documents') && (
            <button 
              onClick={() => setActiveView('documents')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeView === 'documents' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <FileText size={20} />
              <span className="font-medium">Repositorio Documental</span>
            </button>
          )}

          {canAccessModule('encuestas') && (
            <button 
              onClick={() => setActiveView('encuestas')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${(activeView as string) === 'encuestas' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <ClipboardCheck size={20} />
              <span className="font-medium">Módulo de Encuestas</span>
            </button>
          )}
        </nav>
        
        <div className="p-4 border-t border-slate-800 space-y-2">
          {isPublicUser ? (
            <button 
              onClick={() => setShowAuth(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 transition-colors border border-indigo-500/30"
            >
              <LockIcon size={20} />
              <span className="font-medium">Sincronizar Nube</span>
            </button>
          ) : (
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-rose-400 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Salir</span>
            </button>
          )}

          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleImportData} 
            className="hidden" 
          />
          {(userRole === 'admin' || isPublicUser) && (
            <>
              <button 
                onClick={handleInjectTestProject}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors mb-2"
              >
                <Database size={20} />
                <span className="font-medium text-left leading-tight">Cargar Proyecto de Ejemplo</span>
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-emerald-400 transition-colors"
              >
                <CloudUpload size={20} />
                <span className="font-medium">Importar Datos</span>
              </button>
              <button 
                onClick={handleExportData}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-indigo-400 transition-colors"
              >
                <CloudDownload size={20} />
                <span className="font-medium">Exportar Datos</span>
              </button>
              <button 
                onClick={handleClearCache}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-rose-400 transition-colors"
              >
                <RefreshCw size={20} />
                <span className="font-medium">Limpiar Caché Local</span>
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="hover:text-slate-900 cursor-pointer transition-colors" onClick={handleBackToDashboard}>Inicio</span>
            {activeView === 'project' && selectedProject && (
              <>
                <span>/</span>
                <span className="text-slate-900 font-medium truncate max-w-[300px]">{selectedProject.project.nombre}</span>
              </>
            )}
            {activeView === 'inteligencia' && (
              <>
                <span>/</span>
                <span className="text-slate-900 font-medium">Centro de Inteligencia</span>
              </>
            )}
            {activeView === 'centroControl' && (
              <>
                <span>/</span>
                <span className="text-slate-900 font-medium">Centro de Control SRR</span>
              </>
            )}
            {activeView === 'mapa' && (
              <>
                <span>/</span>
                <span className="text-slate-900 font-medium">Mapa Territorial</span>
              </>
            )}
            {activeView === 'matriz' && (
              <>
                <span>/</span>
                <span className="text-slate-900 font-medium">Matriz de Seguimiento SRR</span>
              </>
            )}
            {activeView === 'informes' && (
              <>
                <span>/</span>
                <span className="text-slate-900 font-medium">Generador de Informes Institucionales</span>
              </>
            )}
            {activeView === 'agenda' && (
              <>
                <span>/</span>
                <span className="text-slate-900 font-medium">Agenda y PMU</span>
              </>
            )}
            {activeView === 'tareas' && (
              <>
                <span>/</span>
                <span className="text-slate-900 font-medium">Tareas y Notificaciones</span>
              </>
            )}
            {activeView === 'vigencias' && (
              <>
                <span>/</span>
                <span className="text-slate-900 font-medium">Vigencias e Inversión</span>
              </>
            )}
            {activeView === 'contractors' && (
              <>
                <span>/</span>
                <span className="text-slate-900 font-medium">Perfil de Contratista</span>
              </>
            )}
            {activeView === 'documents' && (
              <>
                <span>/</span>
                <span className="text-slate-900 font-medium">Repositorio Documental</span>
              </>
            )}
            {activeView === 'laboratorio' && (
              <>
                <span>/</span>
                <span className="text-slate-900 font-medium">Laboratorio Financiero</span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-6">
            {/* Sync Controls */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 px-3 py-1.5 border-r border-slate-200 text-xs font-semibold">
                {!isCloudCheckComplete ? (
                  <>
                    <Loader2 size={12} className="animate-spin text-indigo-500" />
                    <span className="text-slate-500">Conectando...</span>
                  </>
                ) : hasSyncedWithCloud ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-600 font-medium">Nube Activa ({state.proyectos.length})</span>
                  </>
                ) : (
                  <>
                    <Database size={12} className="text-slate-400" />
                    <span className="text-slate-500">Solo Local</span>
                  </>
                )}
              </div>
              <button 
                onClick={handleSaveToCloud}
                disabled={syncing || !isSupabaseConfigured}
                title="Sincronizar con la nube (Subir)"
                className="p-2 text-slate-600 hover:bg-white hover:text-indigo-600 rounded-lg transition-all disabled:opacity-50"
              >
                {syncing ? <Loader2 size={18} className="animate-spin" /> : <CloudUpload size={18} />}
              </button>
              <button 
                onClick={handleLoadFromCloud}
                disabled={syncing || !isSupabaseConfigured}
                title="Cargar desde la nube (Descargar)"
                className="p-2 text-slate-600 hover:bg-white hover:text-indigo-600 rounded-lg transition-all disabled:opacity-50"
              >
                <CloudDownload size={18} />
              </button>
              <button 
                onClick={repairAllUrls}
                disabled={syncing}
                title="Reparar URLs de Almacenamiento"
                className="p-2 text-slate-600 hover:bg-white hover:text-amber-600 rounded-lg transition-all disabled:opacity-50"
              >
                <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
              </button>

              {/* Botones de Rescate JSON */}
              <div className="flex items-center gap-1 border-l border-slate-200 ml-1 pl-1">
                <button 
                  onClick={handleExportData}
                  title="Exportar copia de seguridad (JSON)"
                  className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <Download size={18} />
                </button>
                <label className="p-2 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer">
                  <FileText size={18} />
                  <input 
                    type="file" 
                    accept=".json" 
                    className="hidden" 
                    onChange={handleImportData} 
                  />
                </label>
              </div>

              {syncError && (
                <div className="px-2 text-xs text-rose-500 font-medium max-w-[150px] truncate" title={syncError}>
                  Error
                </div>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar proyecto, NIT, contrato..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all w-64"
              />
            </div>
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm border border-indigo-200">
              AD
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className={`flex-1 overflow-auto ${activeView === 'matriz' || activeView === 'centroControl' || activeView === 'vista360' ? 'p-0 bg-slate-100' : 'p-8'}`}>
          {activeView === 'crearProyecto' && (
            <div className="h-full p-4">
              <CreateProjectForm 
                onSave={(p) => {
                  addProject(p);
                  setActiveView('dashboard');
                }} 
                onCancel={() => setActiveView('flujo')}
              />
            </div>
          )}
          {activeView === 'dashboard' && (
            <Dashboard 
              projects={projectsData} 
              onSelectProject={handleProjectSelect} 
              onManageLiquidation={(project) => {
                setSelectedProjectId(project.project.id);
                setActiveView('flujo');
              }}
            />
          )}
          {activeView === 'vista360' && selectedProject && (
            <Vista360 project={selectedProject} onBack={() => setActiveView('dashboard')} />
          )}
          {activeView === 'project' && selectedProject && (
            <ProjectDetails 
              data={selectedProject} 
              onBack={handleBackToDashboard} 
              onUpdateProject={handleUpdateProject} 
              onOpenVista360={() => setActiveView('vista360')}
            />
          )}
          {activeView === 'matriz' && (
            <div className="h-full p-4">
              <MatrizInteligente projects={projectsData} onUpdateProject={handleUpdateProject} onSelectProject={handleProjectSelect} />
            </div>
          )}
          {activeView === 'informes' && (
            <div className="h-full p-4">
              <GeneradorInformes projects={projectsData} initialProjectId={reportProjectId} />
            </div>
          )}
          {activeView === 'tareas' && (
            <div className="h-full p-4">
              <TaskBoard />
            </div>
          )}
          {activeView === 'inteligencia' && (
            <div className="h-full p-4">
              <CentroInteligenciaSRR projects={projectsData} professionals={state.professionals} />
            </div>
          )}
          {activeView === 'priorizacion' && (
            <div className="h-full p-4 overflow-y-auto">
              <PriorizacionInversion projects={projectsData.map(p => p.project)} departmentsData={dynamicDepartments} />
            </div>
          )}
          {activeView === 'riesgoDashboard' && (
            <div className="h-full p-4 overflow-y-auto">
              <RiskDashboard 
                contracts={state.contratos} 
                otrosies={state.otrosies} 
                pagos={state.pagos} 
                reports={state.informesInterventoria} 
                projects={projectsData}
              />
            </div>
          )}
          {activeView === 'agenda' && (
            <div className="h-full bg-slate-50">
              <AgendaPMU />
            </div>
          )}
          {activeView === 'eventos' && (
            <div className="h-full bg-slate-50 overflow-y-auto">
              <EventosDashboard />
            </div>
          )}
          {activeView === 'flujo' && (
            <div className="h-full">
              <FlujoInstitucional 
                initialSelectedProjectId={selectedProjectId} 
                onGoToProjectDetails={(projectId) => {
                  setSelectedProjectId(projectId);
                  setActiveView('project');
                }}
                onCreateProject={() => setActiveView('crearProyecto')}
              />
            </div>
          )}
          {activeView === 'vigencias' && (
            <div className="h-full p-4">
              <VigenciaModule />
            </div>
          )}
          {activeView === 'contractors' && (
            <div className="h-full p-4">
              <ContractorProfile 
                onSelectProject={(projectId) => {
                  setSelectedProjectId(projectId);
                  setActiveView('project');
                }}
              />
            </div>
          )}
          {activeView === 'documents' && (
            <div className="h-full p-4">
              <DocumentRepository />
            </div>
          )}
          {activeView === 'ops' && (
            <div className="h-full p-4">
              <GestionOPS projectId={selectedProjectId || ''} />
            </div>
          )}
          {activeView === 'comisiones' && (
            <div className="h-full p-4">
              <GestionComisiones projectId={selectedProjectId || ''} />
            </div>
          )}
          {activeView === 'polizas' && (
            <div className="h-full p-4">
              <GestionPolizas projectId={selectedProjectId || ''} />
            </div>
          )}
          {activeView === 'financiera' && (
            <div className="h-full">
              <ProteccionFinanciera />
            </div>
          )}
          {activeView === 'laboratorio' && (
            <div className="h-full overflow-y-auto">
              <LaboratorioFinanciero />
            </div>
          )}
          {activeView === 'micr' && (
            <div className="h-full">
              <MicRModule />
            </div>
          )}
          {activeView === 'centroControl' && (
            <CentroControlSRR projects={projectsData} onGenerateReport={handleGenerateReport} />
          )}
          {activeView === 'mapa' && (
            <div className="h-full p-4">
              <ColombiaMap 
                projects={projectsData} 
                departmentsData={dynamicDepartments}
                threats={mockThreats}
                onOpenPanel={handleOpenPanel} 
                onSelectProject={(project) => {
                  setSelectedProjectId(project.project.id);
                  setActiveView('project');
                }}
              />
              {selectedDept && (
                <TerritorialPanel 
                  dept={selectedDept} 
                  projects={projectsData} 
                  threats={mockThreats}
                  onClose={() => setSelectedDept(null)} 
                  onSelectProject={(project) => {
                    setSelectedProjectId(project.project.id);
                    setActiveView('project');
                    setSelectedDept(null);
                  }}
                />
              )}
            </div>
          )}

        </div>
      </main>

      {/* Global Alert Modal */}
      {alertMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center animate-in zoom-in duration-200">
            <div className="mx-auto w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Aviso</h3>
            <p className="text-slate-600 mb-6">{alertMessage}</p>
            <button
              onClick={() => setAlertMessage(null)}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
