import { aiProviderService } from "./aiProviderService";
import { ProjectData } from "../types";

export const generateProjectDiagnosis = async (project: ProjectData) => {
  const prompt = `Analiza el siguiente proyecto y genera un diagnóstico automático:
  Proyecto: ${JSON.stringify(project.project)}
  Presupuesto: ${JSON.stringify(project.presupuesto)}
  Avances: ${JSON.stringify(project.avances.slice(-3))}
  Riesgos: ${JSON.stringify(project.riesgos)}
  `;

  return await aiProviderService.generateContent(prompt, aiProviderService.getAIModel());
};

export const generateInterventoriaSummary = async (project: ProjectData) => {
  const prompt = `Genera un resumen tipo interventoría para el siguiente proyecto:
  Proyecto: ${JSON.stringify(project.project)}
  Informes Interventoría: ${JSON.stringify(project.interventoriaReports?.slice(-1))}
  `;

  return await aiProviderService.generateContent(prompt, aiProviderService.getAIModel());
};

export const detectNonCompliancePatterns = async (projects: ProjectData[]) => {
  const prompt = `Analiza los siguientes proyectos y detecta patrones de incumplimiento:
  Proyectos: ${JSON.stringify(projects.map(p => ({ nombre: p.project.nombre, avanceFisico: p.project.avanceFisico, avanceProgramado: p.project.avanceProgramado })))}
  `;

  return await aiProviderService.generateContent(prompt, aiProviderService.getAIModel());
};

export const suggestCorrectiveActions = async (project: ProjectData) => {
  const prompt = `Sugiere acciones correctivas para el siguiente proyecto:
  Proyecto: ${JSON.stringify(project.project)}
  Riesgos: ${JSON.stringify(project.riesgos)}
  `;

  return await aiProviderService.generateContent(prompt, aiProviderService.getAIModel());
};
