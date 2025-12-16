

import { GoogleGenAI } from "@google/genai";
import { Tecnico, Mantenimiento, Dispositivo, ControlAsistencia } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateReportAnalysis = async (
  tecnicos: Tecnico[],
  mantenimientos: Mantenimiento[],
  asistencia: ControlAsistencia[],
  dispositivos: Dispositivo[],
  startDate: string,
  endDate: string,
  analysisOptions: {
      ops: boolean;
      maintenance: boolean;
      staff: boolean;
      inventory: boolean;
      recommendations: boolean;
  }
): Promise<string> => {
  
  const dataContext = JSON.stringify({
    period: { start: startDate, end: endDate },
    tecnicos: tecnicos.map(t => ({ nombre: t.nombre_completo_tec, cargo: t.cargo_tec })),
    mantenimientos: mantenimientos.filter(m => m.fecha_mant >= startDate && m.fecha_mant <= endDate).map(m => ({
        id: m.id_mant,
        tipo: m.tipo_mant,
        diagnostico: m.diagnostico,
        equipo: m.id_codigo_patrimonial_disp_e,
        estado: m.estado_mant
    })),
    inventarioResumen: {
        totalEquipos: dispositivos.length,
        estados: dispositivos.reduce((acc, curr) => {
            acc[curr.estado__disp_e] = (acc[curr.estado__disp_e] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    },
    asistenciaResumen: {
        totalRegistros: asistencia.length,
        asistenciasPeriodo: asistencia.filter(a => a.fecha_asistencia >= startDate && a.fecha_asistencia <= endDate).length
    }
  });

  const prompt = `
    Actúa como un **Auditor Senior de TI y Gerente de Operaciones** para una institución de salud (Diris Lima Norte).
    Analiza los siguientes datos operativos en formato JSON para el periodo ${startDate} a ${endDate}.
    
    Tus objetivos son: Identificar cuellos de botella, evaluar la eficiencia del mantenimiento y sugerir mejoras estratégicas.

    DATOS:
    ${dataContext}

    OPCIONES SOLICITADAS: ${JSON.stringify(analysisOptions)}

    Genera un informe ejecutivo en formato MARKDOWN profesional con las siguientes secciones (solo incluye las solicitadas):

    ${analysisOptions.ops ? `
    ### 📊 Resumen Ejecutivo
    *   **Visión General:** Proporciona un párrafo introductorio sobre el estado de las operaciones en este periodo.
    *   **KPIs Clave:** Lista 3 indicadores clave (ej. Tasa de resolución, Disponibilidad de equipos) basados en los datos.
    ` : ''}

    ${analysisOptions.maintenance ? `
    ### 🛠️ Análisis de Mantenimiento
    *   **Patrones de Fallo:** Analiza los diagnósticos frecuentes. ¿Hay problemas recurrentes (ej. Disco duro, Red)?
    *   **Preventivo vs. Correctivo:** Comenta sobre la proporción. ¿Estamos siendo proactivos o reactivos?
    *   **Incidentes Críticos:** Menciona si hubo mantenimientos anulados o equipos con múltiples intervenciones.
    ` : ''}

    ${analysisOptions.staff ? `
    ### 👥 Productividad del Personal
    *   **Cobertura:** Evalúa si el personal técnico ha tenido actividad registrada en mantenimientos y asistencia.
    *   **Carga de Trabajo:** Identifica si hay técnicos con sobrecarga o subutilización (inferido por la cantidad de reportes).
    ` : ''}

    ${analysisOptions.inventory ? `
    ### 📦 Salud del Inventario
    *   **Ciclo de Vida:** Comenta sobre el estado de los equipos (Bueno/Regular/Malo). ¿Qué porcentaje requiere renovación urgente?
    *   **Integridad de Datos:** Valida brevemente si los datos parecen consistentes.
    ` : ''}

    ${analysisOptions.recommendations ? `
    ### 💡 Plan de Acción Recomendado
    1.  **Corto Plazo:** [Acción inmediata para corregir fallos críticos]
    2.  **Mediano Plazo:** [Mejora de procesos o capacitación]
    3.  **Inversión:** [Sugerencia de compra o renovación basada en los equipos malos/regulares]
    ` : ''}

    **Estilo:** Formal, directivo, técnico pero accesible para gerencia. Usa negritas para resaltar datos.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Error generating report:", error);
    return "Error de conexión con IA. Por favor verifique su API Key.";
  }
};