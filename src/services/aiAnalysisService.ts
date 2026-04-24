import { Project, Contract, Otrosie, ProjectDocument, Afectacion } from "../types";
import { aiProviderService } from "./aiProviderService";

export async function analyzeProject(
  project: Project,
  contracts: Contract[],
  otrosies: Otrosie[],
  documents: ProjectDocument[]
) {
  const prompt = `Analiza el siguiente proyecto y genera un resumen detallado:
  Proyecto: ${JSON.stringify(project)}
  Contratos: ${JSON.stringify(contracts)}
  Otrosíes: ${JSON.stringify(otrosies)}
  Documentos: ${JSON.stringify(documents)}
  
  Genera un análisis técnico, financiero y jurídico.`;

  return await aiProviderService.generateContent(prompt, aiProviderService.getAIModel());
}

export async function detectPendingTasks(
  project: Project,
  contracts: Contract[]
) {
  const prompt = `Detecta tareas pendientes para el proyecto:
  Proyecto: ${JSON.stringify(project)}
  Contratos: ${JSON.stringify(contracts)}
  
  Devuelve una lista de tareas pendientes.`;

  return await aiProviderService.generateContent(prompt, aiProviderService.getAIModel());
}

export async function detectUnfulfilledObligations(contracts: Contract[]) {
  const prompt = `Detecta obligaciones no cumplidas en los contratos:
  Contratos: ${JSON.stringify(contracts)}
  
  Devuelve una lista de obligaciones no cumplidas.`;

  return await aiProviderService.generateContent(prompt, aiProviderService.getAIModel());
}

export async function detectMissingDocuments(
  project: Project,
  documents: ProjectDocument[]
) {
  const prompt = `Detecta documentos faltantes para el proyecto:
  Proyecto: ${JSON.stringify(project)}
  Documentos actuales: ${JSON.stringify(documents)}
  
  Devuelve una lista de documentos faltantes necesarios.`;

  return await aiProviderService.generateContent(prompt, aiProviderService.getAIModel());
}

export async function generatePrioritizedActions(
  project: Project,
  contracts: Contract[],
  otrosies: Otrosie[],
  documents: ProjectDocument[]
) {
  const prompt = `Genera una lista priorizada de acciones para el proyecto:
  Proyecto: ${JSON.stringify(project)}
  Contratos: ${JSON.stringify(contracts)}
  Otrosíes: ${JSON.stringify(otrosies)}
  Documentos: ${JSON.stringify(documents)}
  
  Devuelve una lista priorizada de acciones.`;

  return await aiProviderService.generateContent(prompt, aiProviderService.getAIModel());
}

export async function analyzeContractLifecycle(
  contract: Contract,
  otrosies: Otrosie[],
  afectaciones: Afectacion[]
) {
  const prompt = `Realiza un análisis riguroso y detallado del ciclo de vida del contrato.
  Contrato: ${JSON.stringify(contract)}
  Acta de Inicio: ${contract.actaInicio || 'No registrada'}
  Otrosíes: ${JSON.stringify(otrosies)}
  Afectaciones: ${JSON.stringify(afectaciones)}
  
  Genera un análisis técnico, financiero y jurídico detallado, identificando todas las afectaciones, riesgos, y el impacto acumulado en el contrato.`;

  return await aiProviderService.generateContent(prompt, aiProviderService.getAIModel());
}
