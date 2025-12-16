

import React, { useState } from 'react';
import { Tecnico, Mantenimiento, ControlAsistencia, Dispositivo } from '../types';
import { generateReportAnalysis } from '../services/geminiService';
import { FileText, Printer, Sparkles, Loader2, Building2, CheckSquare, BarChart3, Settings, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ReportGeneratorProps {
  tecnicos: Tecnico[];
  mantenimientos: Mantenimiento[];
  asistencia: ControlAsistencia[];
  dispositivos: Dispositivo[];
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ tecnicos, mantenimientos, asistencia, dispositivos }) => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Configuration State
  const [config, setConfig] = useState({
      ops: true,
      maintenance: true,
      staff: true,
      inventory: true,
      recommendations: true
  });

  const handleGenerate = async () => {
    setIsLoading(true);
    setShowReport(true);
    setAiAnalysis(''); // Clear previous
    
    const analysis = await generateReportAnalysis(tecnicos, mantenimientos, asistencia, dispositivos, startDate, endDate, config);
    setAiAnalysis(analysis);
    setIsLoading(false);
  };

  const handlePrint = () => {
      const content = document.getElementById('ai-report-printable');
      if (content) {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
              printWindow.document.write(`
              <html>
                  <head>
                      <title>Informe Ejecutivo TI - SIHCE</title>
                      <script src="https://cdn.tailwindcss.com"></script>
                      <style>
                          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                          @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&display=swap');
                          body { font-family: 'Inter', sans-serif; background: white; }
                          h1, h2, h3, h4 { font-family: 'Merriweather', serif; }
                          @media print {
                              @page { size: A4; margin: 1cm; }
                              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                              .no-print { display: none !important; }
                          }
                      </style>
                  </head>
                  <body class="p-0 bg-white">
                      <div class="max-w-5xl mx-auto p-8">
                        ${content.innerHTML}
                      </div>
                      <script>
                          setTimeout(() => {
                              window.print();
                          }, 1000);
                      </script>
                  </body>
              </html>
              `);
              printWindow.document.close();
          }
      } else {
          // Fallback
          window.print();
      }
  };

  // Metrics Calculation
  const totalMants = mantenimientos.filter(m => m.fecha_mant >= startDate && m.fecha_mant <= endDate).length;
  const preventivos = mantenimientos.filter(m => m.fecha_mant >= startDate && m.fecha_mant <= endDate && m.tipo_mant === 'Preventivo').length;
  const efficiency = totalMants > 0 ? Math.round((preventivos / totalMants) * 100) : 0;
  const activeStaff = asistencia.filter(a => a.fecha_asistencia >= startDate && a.fecha_asistencia <= endDate).length;
  const invHealth = Math.round((dispositivos.filter(d => d.estado__disp_e === 'Bueno').length / dispositivos.length) * 100) || 0;

  return (
    <div className="p-8 h-full overflow-y-auto print:p-0 print:h-auto print:overflow-visible bg-gray-50">
      <div className="no-print mb-8 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Sparkles className="text-brand-600"/> Centro de Inteligencia & Reportes
        </h2>
        <p className="text-gray-500 mb-6">Generación de informes ejecutivos asistida por Inteligencia Artificial.</p>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* DATE SELECTION */}
              <div>
                  <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><CalendarIcon size={18}/> Rango del Reporte</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Inicio</label>
                        <input type="date" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Fin</label>
                        <input type="date" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                  </div>
              </div>

              {/* CONFIGURATION */}
              <div>
                  <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Settings size={18}/> Contenido del Análisis</h3>
                  <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-2 rounded hover:bg-gray-100">
                          <input type="checkbox" checked={config.ops} onChange={() => setConfig({...config, ops: !config.ops})} className="text-brand-600 rounded"/> 
                          <span className="text-sm">Resumen Ejecutivo</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-2 rounded hover:bg-gray-100">
                          <input type="checkbox" checked={config.maintenance} onChange={() => setConfig({...config, maintenance: !config.maintenance})} className="text-brand-600 rounded"/> 
                          <span className="text-sm">Mantenimiento</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-2 rounded hover:bg-gray-100">
                          <input type="checkbox" checked={config.staff} onChange={() => setConfig({...config, staff: !config.staff})} className="text-brand-600 rounded"/> 
                          <span className="text-sm">Personal & Asistencia</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-2 rounded hover:bg-gray-100">
                          <input type="checkbox" checked={config.inventory} onChange={() => setConfig({...config, inventory: !config.inventory})} className="text-brand-600 rounded"/> 
                          <span className="text-sm">Estado Inventario</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-2 rounded hover:bg-gray-100 col-span-2 border-t mt-1 pt-2">
                          <input type="checkbox" checked={config.recommendations} onChange={() => setConfig({...config, recommendations: !config.recommendations})} className="text-brand-600 rounded"/> 
                          <span className="text-sm font-bold text-brand-700">Incluir Recomendaciones Estratégicas IA</span>
                      </label>
                  </div>
              </div>
          </div>

          <div className="mt-8 flex justify-end">
              <button onClick={handleGenerate} disabled={isLoading} className="flex items-center gap-2 px-8 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 shadow-md font-bold text-lg transition-all transform hover:scale-105">
                {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
                {isLoading ? 'Analizando Datos...' : 'Generar Informe Inteligente'}
              </button>
          </div>
        </div>
      </div>

      {showReport && (
        <div id="ai-report-printable" className="bg-white p-12 rounded-none md:rounded-xl shadow-2xl print:shadow-none print:p-0 max-w-5xl mx-auto border border-gray-200 print:border-none print:w-full min-h-[29.7cm]">
          
          {/* HEADER DEL REPORTE */}
          <div className="flex justify-between items-start border-b-4 border-gray-900 pb-6 mb-8 print:mb-6">
            <div className="flex items-center gap-6">
               <div className="w-20 h-20 bg-gray-900 rounded-lg flex items-center justify-center text-white print:bg-gray-900 print:text-white shadow-lg">
                 <Building2 size={40} />
               </div>
               <div>
                <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight font-serif">Informe de Gestión TI</h1>
                <p className="text-gray-500 font-medium text-lg mt-1">Dirección de Redes Integradas de Salud Lima Norte</p>
               </div>
            </div>
            <div className="text-right">
              <div className="text-brand-600 font-bold text-2xl tracking-wider">SIHCE PRO</div>
              <div className="text-gray-400 text-xs font-mono uppercase tracking-widest mt-1">Reporte Confidencial</div>
              <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm font-bold mt-2 inline-block">
                  {new Date(startDate).toLocaleDateString()} — {new Date(endDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* LIVE METRICS DASHBOARD (SNAPSHOT) */}
          <div className="grid grid-cols-4 gap-4 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100 print:bg-gray-50 print:border">
              <div className="text-center">
                  <div className="text-2xl font-black text-gray-800">{totalMants}</div>
                  <div className="text-[10px] uppercase font-bold text-gray-500">Atenciones</div>
              </div>
              <div className="text-center border-l border-gray-200">
                  <div className="text-2xl font-black text-blue-600">{efficiency}%</div>
                  <div className="text-[10px] uppercase font-bold text-gray-500">Preventivos</div>
              </div>
              <div className="text-center border-l border-gray-200">
                  <div className="text-2xl font-black text-green-600">{activeStaff}</div>
                  <div className="text-[10px] uppercase font-bold text-gray-500">Marcas Asistencia</div>
              </div>
              <div className="text-center border-l border-gray-200">
                  <div className="text-2xl font-black text-purple-600">{invHealth}%</div>
                  <div className="text-[10px] uppercase font-bold text-gray-500">Inventario OK</div>
              </div>
          </div>

          {/* CUERPO DEL REPORTE */}
          <div className="mb-12 print:mb-6 min-h-[500px]">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <Loader2 size={48} className="animate-spin text-brand-500 mb-4"/>
                    <p className="text-lg animate-pulse">La IA está analizando sus datos...</p>
                </div>
            ) : (
                <div className="prose max-w-none prose-headings:font-serif prose-headings:font-bold prose-h3:text-brand-700 prose-h3:border-b prose-h3:pb-2 prose-h3:mt-8 prose-strong:text-gray-800 prose-ul:list-disc prose-li:ml-4 text-justify text-gray-700 leading-relaxed">
                    <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                </div>
            )}
          </div>

          {/* FOOTER DEL REPORTE */}
          <div className="mt-12 pt-8 border-t border-gray-300 flex justify-between items-end text-sm text-gray-500 print:fixed print:bottom-0 print:left-0 print:w-full print:px-12 print:pb-8 print:bg-white">
            <div>
                <p className="font-bold uppercase text-xs tracking-widest mb-1">Oficina General de Tecnologías de Información</p>
                <p>Generado por Sistema SIHCE el {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()}</p>
            </div>
            <div className="text-right">
                <p>Página 1 de 1</p>
            </div>
          </div>

          {/* BOTONES DE ACCION (NO IMPRIMIBLES) */}
          <div className="fixed bottom-8 right-8 flex gap-4 no-print">
            <button onClick={() => setShowReport(false)} className="px-6 py-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-900 font-bold transition-transform hover:scale-105">
                Cerrar
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-xl font-bold transition-transform hover:scale-105">
              <Printer size={20} /> Imprimir / Guardar PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Icon for date input above
function CalendarIcon({size}: {size: number}) {
    return <Calendar size={size}/>
}
