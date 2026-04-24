export const normalizeString = (str: string) => {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

const deptMapping: Record<string, string> = {
  "co-sa": "San Andrés y Providencia",
  "co-ca": "Cauca",
  "co-na": "Nariño",
  "co-ch": "Chocó",
  "co-to": "Tolima",
  "co-cq": "Caquetá",
  "co-hu": "Huila",
  "co-pu": "Putumayo",
  "co-am": "Amazonas",
  "co-bl": "Bolívar",
  "co-vc": "Valle del Cauca",
  "co-su": "Sucre",
  "co-at": "Atlántico",
  "co-ce": "Cesar",
  "co-lg": "La Guajira",
  "co-ma": "Magdalena",
  "co-ar": "Arauca",
  "co-ns": "Norte de Santander",
  "co-cs": "Casanare",
  "co-gv": "Guaviare",
  "co-me": "Meta",
  "co-vp": "Vaupés",
  "co-vd": "Vichada",
  "co-an": "Antioquia",
  "co-co": "Córdoba",
  "co-by": "Boyacá",
  "co-st": "Santander",
  "co-cl": "Caldas",
  "co-cu": "Cundinamarca",
  "co-1136": "Bogotá D.C.",
  "co-ri": "Risaralda",
  "co-qd": "Quindío",
  "co-gn": "Guainía"
};

export const getOfficialDeptName = (rawName: string): string => {
  if (!rawName) return "";
  const normalized = normalizeString(rawName);
  if (normalized === "bogota" || normalized.includes("bogota")) return "bogota d.c.";
  if (normalized.includes("san andres") || normalized.includes("providencia")) return "san andres y providencia";
  if (normalized === "valle" || normalized === "valle del cauca") return "valle del cauca";
  if (normalized === "guajira" || normalized === "la guajira") return "la guajira";
  
  const exactMatch = Object.values(deptMapping).find(v => normalizeString(v) === normalized);
  if (exactMatch) return normalizeString(exactMatch);
  
  return normalized;
};
