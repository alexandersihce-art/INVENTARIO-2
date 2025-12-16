import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Tecnico, ProgramacionPersonal, Establecimiento, Ambiente } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, PlusCircle, X, AlertCircle, MapPin, Briefcase, User, Download, FileSpreadsheet, FileText, Plus, Trash2, Ban, Edit, Save, AlertTriangle, History, Printer, Search } from 'lucide-react';

interface SchedulerProps {
  tecnicos: Tecnico[];
  programacion: ProgramacionPersonal[];
  setProgramacion: React.Dispatch<React.SetStateAction<ProgramacionPersonal[]>>;
  establecimientos: Establecimiento[];
  ambientes: Ambiente[];
  
  availableActivities: string[];
  onAddActivity: (newAct: string) => void;
}

const ACTIVITY_COLORS: Record<string, string> = {
    'Mantenimiento': 'bg-orange-100 text-orange-700 border-orange-200',
    'Cableado': 'bg-blue-100 text-blue-700 border-blue-200',
    'Soporte': 'bg-green-100 text-green-700 border-green-200',
    'Guardia': 'bg-red-100 text-red-700 border-red-200',
    'Administrativo': 'bg-gray-100 text-gray-700 border-gray-200',
    'Otro': 'bg-purple-100 text-purple-700 border-purple-200'
};

const DEFAULT_ACTIVITY_COLOR = 'bg-indigo-100 text-indigo-700 border-indigo-200';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const Scheduler: React.FC<SchedulerProps> = ({ 
    tecnicos, 
    programacion, 
    setProgramacion, 
    establecimientos, 
    ambientes,
    availableActivities,
    onAddActivity
}) => {
  // Calendar Navigation State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [errorMsg, setErrorMsg] = useState('');

  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const selectedDateStr = formatDate(selectedDate);

  // Form State
  const [newProg, setNewProg] = useState<{
    id_dni_tec: string;
    hora_inicio: string;
    hora_fin: string;
    turno: 'Mañana' | 'Tarde' | 'Noche' | 'Guardia';
    id_estab: string;
    id_amb: string;
    tipo_actividad: string;
    tarea: string;
  }>({
    id_dni_tec: tecnicos[0]?.id_dni_tec.toString() || '',
    hora_inicio: '08:00',
    hora_fin: '14:00',
    turno: 'Mañana',
    id_estab: '',
    id_amb: '',
    tipo_actividad: 'Mantenimiento',
    tarea: ''
  });

  // Dynamic Activity Search
  const [activitySearch, setActivitySearch] = useState('');
  const [showActivitySuggestions, setShowActivitySuggestions] = useState(false);
  const activityRef = useRef<HTMLDivElement>(null);

  // REPORT MODAL STATES
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportTechId, setReportTechId] = useState<string>('');

  // --- DAY DETAILS MODAL ---
  const [selectedDayShiftsModal, setSelectedDayShiftsModal] = useState<boolean>(false);
  const [dayShiftsDate, setDayShiftsDate] = useState<Date | null>(null);

  // --- DELETED HISTORY MODAL ---
  const [showDeletedHistory, setShowDeletedHistory] = useState(false);
  // Deleted History Filters
  const [deletedFilterName, setDeletedFilterName] = useState('');
  const [deletedFilterShiftDate, setDeletedFilterShiftDate] = useState('');
  const [deletedFilterDeleteDate, setDeletedFilterDeleteDate] = useState('');

  // --- AUDIT MODAL (WHO & WHY) ---
  const [auditModal, setAuditModal] = useState<{
      isOpen: boolean;
      actionType: 'EDIT' | 'ANULATE' | 'DELETE' | null;
      targetShiftId: string | null;
  }>({ isOpen: false, actionType: null, targetShiftId: null });

  const [auditForm, setAuditForm] = useState<{
      id_dni_auditoria: string;
      motivo: string;
      // For Edit only:
      newStart?: string;
      newEnd?: string;
  }>({ id_dni_auditoria: '', motivo: '' });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (activityRef.current && !activityRef.current.contains(event.target as Node)) {
        setShowActivitySuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calendar Helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0 = Sun

  const changeMonth = (delta: number) => {
      const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1);
      setCurrentMonth(newDate);
  };
  
  const handleMonthSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newMonthIndex = parseInt(e.target.value);
      const newDate = new Date(currentMonth.getFullYear(), newMonthIndex, 1);
      setCurrentMonth(newDate);
  };

  const handleYearSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newYear = parseInt(e.target.value);
      const newDate = new Date(newYear, currentMonth.getMonth(), 1);
      setCurrentMonth(newDate);
  };

  // Generate Year Range (Fixed Start to Future)
  const yearsRange = useMemo(() => {
      const currentYear = new Date().getFullYear();
      const startYear = 2020; 
      const endYear = currentYear + 30; // Margen futuro amplio
      
      const years = [];
      for (let i = startYear; i <= endYear; i++) {
          years.push(i);
      }
      return years;
  }, []);

  // Form Helpers
  const filteredAmbientes = useMemo(() => {
      if (!newProg.id_estab) return [];
      return ambientes.filter(a => a.id_codigo_ipress_estab === parseInt(newProg.id_estab));
  }, [newProg.id_estab, ambientes]);

  const filteredActivities = useMemo(() => {
      if (!activitySearch) return availableActivities;
      return availableActivities.filter(a => a.toLowerCase().includes(activitySearch.toLowerCase()));
  }, [activitySearch, availableActivities]);

  const handleAddActivityManual = () => {
      if(activitySearch) {
          onAddActivity(activitySearch);
          setNewProg({...newProg, tipo_actividad: activitySearch});
          setShowActivitySuggestions(false);
      }
  };

  const handleAddShift = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!newProg.id_dni_tec) return;
    if (!newProg.id_estab) { setErrorMsg('Debe seleccionar un establecimiento.'); return; }
    if (!newProg.tipo_actividad && !activitySearch) { setErrorMsg('Indique una actividad.'); return; }
    
    // Validar integridad de horas
    if (newProg.hora_inicio >= newProg.hora_fin) {
        setErrorMsg('La hora de inicio debe ser anterior a la hora de fin.');
        return;
    }

    const finalActivity = newProg.tipo_actividad || activitySearch;

    // Check overlaps (Time Collision Detection)
    // Ignore Eliminado AND Anulado for collision
    const existingShifts = programacion.filter(p => 
        p.id_dni_tec === parseInt(newProg.id_dni_tec) && 
        p.fecha_programacion_inicio === selectedDateStr &&
        p.estado !== 'Anulado' && p.estado !== 'Eliminado'
    );

    const hasOverlap = existingShifts.some(existing => {
        // Logic: (StartA < EndB) and (EndA > StartB)
        return (newProg.hora_inicio < existing.hora_programacion_fin) && (newProg.hora_fin > existing.hora_programacion_inicio);
    });

    if (hasOverlap) {
        setErrorMsg('Conflicto de horario: El técnico ya tiene una actividad activa que se cruza con este horario.');
        return;
    }

    const estabName = establecimientos.find(e => e.id_codigo_ipress_estab === parseInt(newProg.id_estab))?.nombre_estab || '';

    const newEntry: ProgramacionPersonal = {
      id_programacion: Math.random().toString(36).substr(2, 9),
      id_dni_tec: parseInt(newProg.id_dni_tec),
      fecha_programacion_inicio: selectedDateStr,
      fecha_programacion_fin: selectedDateStr,
      hora_programacion_inicio: newProg.hora_inicio,
      hora_programacion_fin: newProg.hora_fin,
      turno_programacion: newProg.turno,
      establecimiento: estabName, // Keep name for legacy support
      id_codigo_ipress_estab: parseInt(newProg.id_estab),
      id_amb: newProg.id_amb ? parseInt(newProg.id_amb) : undefined,
      tipo_actividad: finalActivity,
      tarea_programacion: newProg.tarea || finalActivity,
      estado: 'Activo'
    };

    setProgramacion([...programacion, newEntry]);
    setNewProg({ ...newProg, tarea: '' }); // Reset task field
  };

  // --- ACTION HANDLERS WITH AUDIT ---

  const handleActionRequest = (shiftId: string, type: 'EDIT' | 'ANULATE' | 'DELETE') => {
      // Find shift
      const shift = programacion.find(p => p.id_programacion === shiftId);
      if (!shift) return;

      setAuditForm({ 
          id_dni_auditoria: '', 
          motivo: '',
          newStart: shift.hora_programacion_inicio,
          newEnd: shift.hora_programacion_fin
      });
      setAuditModal({ isOpen: true, actionType: type, targetShiftId: shiftId });
  };

  const confirmAuditAction = () => {
      if (!auditModal.targetShiftId || !auditModal.actionType) return;
      if (!auditForm.id_dni_auditoria || !auditForm.motivo) {
          alert("Debe indicar el responsable y el motivo del cambio.");
          return;
      }

      const timestamp = new Date().toISOString();
      const tech = tecnicos.find(t => t.id_dni_tec === parseInt(auditForm.id_dni_auditoria));
      const auditorName = tech?.nombre_completo_tec || 'Desconocido';

      if (auditModal.actionType === 'DELETE') {
           // SOFT DELETE: Mark as 'Eliminado'
           setProgramacion(prev => prev.map(p => 
               p.id_programacion === auditModal.targetShiftId
               ? {
                   ...p,
                   estado: 'Eliminado',
                   id_dni_auditoria: parseInt(auditForm.id_dni_auditoria), 
                   nombre_auditoria: auditorName,
                   motivo_cambio: auditForm.motivo,
                   fecha_cambio: timestamp
               }
               : p
           ));
      } else if (auditModal.actionType === 'ANULATE') {
           setProgramacion(prev => prev.map(p => 
               p.id_programacion === auditModal.targetShiftId 
               ? { 
                   ...p, 
                   estado: 'Anulado', 
                   id_dni_auditoria: parseInt(auditForm.id_dni_auditoria), 
                   nombre_auditoria: auditorName,
                   motivo_cambio: auditForm.motivo,
                   fecha_cambio: timestamp
                 } 
               : p
           ));
      } else if (auditModal.actionType === 'EDIT') {
           setProgramacion(prev => prev.map(p => 
               p.id_programacion === auditModal.targetShiftId 
               ? { 
                   ...p, 
                   hora_programacion_inicio: auditForm.newStart || p.hora_programacion_inicio,
                   hora_programacion_fin: auditForm.newEnd || p.hora_programacion_fin,
                   id_dni_auditoria: parseInt(auditForm.id_dni_auditoria), 
                   nombre_auditoria: auditorName,
                   motivo_cambio: auditForm.motivo,
                   fecha_cambio: timestamp
                 } 
               : p
           ));
      }

      setAuditModal({ isOpen: false, actionType: null, targetShiftId: null });
      setAuditForm({ id_dni_auditoria: '', motivo: '' });
  };

  // --- REPORT GENERATION LOGIC ---
  const getFilteredReportData = () => {
      // Exclude 'Eliminado' from general reports
      return programacion.filter(p => {
          const date = p.fecha_programacion_inicio;
          const matchesDate = date >= reportStartDate && date <= reportEndDate;
          const matchesTech = reportTechId ? p.id_dni_tec.toString() === reportTechId : true;
          return matchesDate && matchesTech && p.estado !== 'Eliminado';
      }).sort((a,b) => a.fecha_programacion_inicio.localeCompare(b.fecha_programacion_inicio));
  };

  const handleExportPDF = () => {
      const data = getFilteredReportData();
      const techName = reportTechId ? tecnicos.find(t => t.id_dni_tec.toString() === reportTechId)?.nombre_completo_tec : 'TODOS';
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
          const rows = data.map(row => {
              const t = tecnicos.find(tec => tec.id_dni_tec === row.id_dni_tec);
              const amb = ambientes.find(a => a.id_amb === row.id_amb)?.nombre_servicio_amb || '-';
              const isAnulado = row.estado === 'Anulado';
              const auditInfo = row.fecha_cambio ? `<div class="text-[10px] text-gray-500">Modif: ${row.nombre_auditoria}<br/>Motivo: ${row.motivo_cambio}</div>` : '';
              
              return `
                <tr class="${isAnulado ? 'bg-red-50 text-red-600' : ''}">
                    <td class="border p-2">${row.fecha_programacion_inicio}</td>
                    <td class="border p-2">${t?.nombre_completo_tec}</td>
                    <td class="border p-2 text-center">${row.hora_programacion_inicio} - ${row.hora_programacion_fin}</td>
                    <td class="border p-2">${row.establecimiento}</td>
                    <td class="border p-2">${amb}</td>
                    <td class="border p-2 font-bold">${row.tipo_actividad}</td>
                    <td class="border p-2 text-xs">
                        ${isAnulado ? '<strong>[ANULADO]</strong>' : ''} ${row.tarea_programacion}
                        ${auditInfo}
                    </td>
                </tr>
              `;
          }).join('');

          printWindow.document.write(`
            <html>
                <head>
                    <title>Reporte de Turnos</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                </head>
                <body class="p-8 font-sans">
                    <h1 class="text-2xl font-bold mb-2 uppercase">Reporte de Programación de Personal</h1>
                    <p class="mb-6 text-gray-600">Periodo: ${reportStartDate} al ${reportEndDate} | Técnico: ${techName}</p>
                    <table class="w-full border-collapse text-sm">
                        <thead>
                            <tr class="bg-gray-100">
                                <th class="border p-2 text-left">Fecha</th>
                                <th class="border p-2 text-left">Técnico</th>
                                <th class="border p-2 text-center">Horario</th>
                                <th class="border p-2 text-left">Sede</th>
                                <th class="border p-2 text-left">Ambiente</th>
                                <th class="border p-2 text-left">Actividad</th>
                                <th class="border p-2 text-left">Estado / Observaciones</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                    <script>setTimeout(() => window.print(), 800);</script>
                </body>
            </html>
          `);
          printWindow.document.close();
      }
  };

  const handleExportExcel = () => {
      const data = getFilteredReportData();
      
      let tableRows = '';
      
      data.forEach(row => {
          const t = tecnicos.find(tec => tec.id_dni_tec === row.id_dni_tec);
          const amb = ambientes.find(a => a.id_amb === row.id_amb)?.nombre_servicio_amb || '-';
          const estado = row.estado || 'Activo';
          const audit = row.fecha_cambio ? `Modificado por ${row.nombre_auditoria}: ${row.motivo_cambio}` : '';

          tableRows += `
            <tr>
                <td style="border: 1px solid #000; padding: 5px;">${row.fecha_programacion_inicio}</td>
                <td style="border: 1px solid #000; padding: 5px;">${t?.nombre_completo_tec || 'Desconocido'}</td>
                <td style="border: 1px solid #000; padding: 5px;">${row.hora_programacion_inicio}</td>
                <td style="border: 1px solid #000; padding: 5px;">${row.hora_programacion_fin}</td>
                <td style="border: 1px solid #000; padding: 5px;">${row.establecimiento}</td>
                <td style="border: 1px solid #000; padding: 5px;">${amb}</td>
                <td style="border: 1px solid #000; padding: 5px;">${row.tipo_actividad}</td>
                <td style="border: 1px solid #000; padding: 5px;">${estado}</td>
                <td style="border: 1px solid #000; padding: 5px;">${row.tarea_programacion || ''}</td>
                <td style="border: 1px solid #000; padding: 5px;">${audit}</td>
            </tr>
          `;
      });

      const excelTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <style>
                body { font-family: Arial, sans-serif; }
                table { border-collapse: collapse; width: 100%; }
                th { background-color: #4f81bd; color: white; border: 1px solid #000; padding: 8px; text-align: left; }
                td { border: 1px solid #000; padding: 5px; }
            </style>
        </head>
        <body>
            <h3>Reporte de Programación de Personal - ${reportStartDate} al ${reportEndDate}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Técnico</th>
                        <th>Inicio</th>
                        <th>Fin</th>
                        <th>Establecimiento</th>
                        <th>Ambiente</th>
                        <th>Actividad</th>
                        <th>Estado</th>
                        <th>Tarea Detallada</th>
                        <th>Historial Cambios</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </body>
        </html>
      `;

      const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Reporte_Turnos_${reportStartDate}_${reportEndDate}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- FILTERED DELETED HISTORY LOGIC ---
  const getFilteredDeletedShifts = () => {
      return programacion.filter(p => {
          if (p.estado !== 'Eliminado') return false;

          const tec = tecnicos.find(t => t.id_dni_tec === p.id_dni_tec);
          
          // Filter by Name
          if (deletedFilterName && !tec?.nombre_completo_tec.toLowerCase().includes(deletedFilterName.toLowerCase())) {
              return false;
          }
          // Filter by Shift Date
          if (deletedFilterShiftDate && p.fecha_programacion_inicio !== deletedFilterShiftDate) {
              return false;
          }
          // Filter by Deletion Date
          if (deletedFilterDeleteDate && !p.fecha_cambio?.startsWith(deletedFilterDeleteDate)) {
              return false;
          }

          return true;
      }).sort((a,b) => new Date(b.fecha_cambio || '').getTime() - new Date(a.fecha_cambio || '').getTime());
  };

  const handlePrintDeletedHistory = () => {
      const data = getFilteredDeletedShifts();
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
          const rows = data.map(row => {
              const t = tecnicos.find(tec => tec.id_dni_tec === row.id_dni_tec);
              return `
                <tr>
                    <td class="border p-2 font-mono">${row.fecha_programacion_inicio} <br/> <span class="text-xs text-gray-500">${row.hora_programacion_inicio}-${row.hora_programacion_fin}</span></td>
                    <td class="border p-2">${t?.nombre_completo_tec}</td>
                    <td class="border p-2 font-bold">${row.nombre_auditoria}</td>
                    <td class="border p-2 italic">${row.motivo_cambio}</td>
                    <td class="border p-2 text-xs">${new Date(row.fecha_cambio!).toLocaleString()}</td>
                </tr>
              `;
          }).join('');

          printWindow.document.write(`
            <html>
                <head>
                    <title>Auditoría de Eliminados</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                </head>
                <body class="p-8 font-sans">
                    <h1 class="text-2xl font-bold mb-2 uppercase text-red-700">Reporte de Auditoría - Turnos Eliminados</h1>
                    <p class="mb-6 text-gray-600">Fecha de Impresión: ${new Date().toLocaleString()}</p>
                    <table class="w-full border-collapse text-sm">
                        <thead>
                            <tr class="bg-red-50 text-red-800">
                                <th class="border p-2 text-left">Fecha Turno</th>
                                <th class="border p-2 text-left">Técnico Afectado</th>
                                <th class="border p-2 text-left">Eliminado Por (Auditor)</th>
                                <th class="border p-2 text-left">Motivo de Eliminación</th>
                                <th class="border p-2 text-left">Fecha y Hora de Baja</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                    <script>setTimeout(() => window.print(), 800);</script>
                </body>
            </html>
          `);
          printWindow.document.close();
      }
  };


  const renderCalendar = () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      let firstDay = getFirstDayOfMonth(year, month);
      if (firstDay === 0) firstDay = 7; // Adjust to make Monday first
      firstDay -= 1; // 0 = Mon, 6 = Sun

      const days = [];
      // Empty cells for prev month
      for (let i = 0; i < firstDay; i++) {
          days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50/50 border border-gray-100"></div>);
      }

      // Day cells
      for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${year}-${(month+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
          // Hide Eliminado shifts from calendar
          const shifts = programacion.filter(p => p.fecha_programacion_inicio === dateStr && p.estado !== 'Eliminado');
          const isSelected = dateStr === selectedDateStr;
          
          days.push(
              <div 
                key={d} 
                onClick={() => setSelectedDate(new Date(year, month, d))}
                className={`h-24 border border-gray-100 p-2 cursor-pointer transition-all hover:bg-blue-50 relative flex flex-col justify-between ${isSelected ? 'bg-blue-50 ring-2 ring-blue-500 z-10' : 'bg-white'}`}
              >
                  <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${isSelected ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>{d}</span>
                  
                  {shifts.length > 0 && (
                      <div className="flex flex-col gap-1 mt-1">
                          <div className="flex flex-wrap gap-1">
                             {/* Mini indicators */}
                             {shifts.slice(0, 5).map((s, idx) => {
                                 const colorClass = ACTIVITY_COLORS[s.tipo_actividad || ''] || DEFAULT_ACTIVITY_COLOR;
                                 const bg = colorClass.split(' ')[0]; // Extract bg class
                                 // Add opacity if Anulado
                                 const opacity = s.estado === 'Anulado' ? 'opacity-40 bg-red-400' : bg;
                                 return <div key={idx} className={`w-2 h-2 rounded-full ${opacity}`}></div>
                             })}
                             {shifts.length > 5 && <span className="text-[10px] text-gray-400">+</span>}
                          </div>
                          <div 
                            className="text-[10px] font-bold text-gray-500 bg-gray-100 rounded px-1 w-fit hover:bg-gray-200 hover:text-blue-600 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation(); // Don't trigger date selection, just open modal
                                setSelectedDate(new Date(year, month, d)); // Ensure selection updates
                                setDayShiftsDate(new Date(year, month, d));
                                setSelectedDayShiftsModal(true);
                            }}
                          >
                            {shifts.length} Turnos
                          </div>
                      </div>
                  )}
              </div>
          );
      }
      return days;
  };

  // Hide Eliminado shifts from day sidebar
  const selectedDayShifts = programacion.filter(p => p.fecha_programacion_inicio === selectedDateStr && p.estado !== 'Eliminado');

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Programación de Personal</h2>
          <p className="text-gray-500">Gestión de turnos y actividades</p>
        </div>
        
        <div className="flex items-center gap-2">
            <button onClick={() => setShowDeletedHistory(true)} className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm hover:bg-red-200 shadow-sm transition-all" title="Ver Papelera">
                <Trash2 size={16}/> <span className="hidden sm:inline">Papelera</span>
            </button>
            <button onClick={() => setIsReportModalOpen(true)} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-900 shadow-sm transition-all">
                <Download size={16}/> Exportar Reporte
            </button>
            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg shadow-sm border border-gray-200">
                <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft size={20} /></button>
                
                {/* SELECTORES DE MES Y AÑO */}
                <div className="flex gap-2">
                    <select 
                        className="bg-transparent font-bold text-gray-800 text-sm outline-none cursor-pointer border-b border-transparent hover:border-gray-300"
                        value={currentMonth.getMonth()}
                        onChange={handleMonthSelectChange}
                    >
                        {MONTHS.map((m, idx) => (
                            <option key={idx} value={idx}>{m}</option>
                        ))}
                    </select>
                    <select 
                        className="bg-transparent font-bold text-gray-800 text-sm outline-none cursor-pointer border-b border-transparent hover:border-gray-300"
                        value={currentMonth.getFullYear()}
                        onChange={handleYearSelectChange}
                    >
                        {yearsRange.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight size={20} /></button>
            </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
        
        {/* CALENDAR GRID */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                    <div key={day} className="py-2 text-center text-xs font-bold text-gray-500 uppercase">{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 flex-1 overflow-y-auto">
                {renderCalendar()}
            </div>
        </div>

        {/* SIDEBAR: DETAILS & FORM */}
        <div className="w-full lg:w-96 flex flex-col gap-6 h-full overflow-y-auto pr-1">
            
            {/* DETAILS FOR SELECTED DAY */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col max-h-[50%]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl sticky top-0">
                    <div>
                        <h3 className="font-bold text-gray-800">Agenda del Día</h3>
                        <p className="text-xs text-gray-500 capitalize">{selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    </div>
                    <span className="bg-brand-100 text-brand-700 px-2 py-1 rounded text-xs font-bold">{selectedDayShifts.length}</span>
                </div>
                <div className="p-4 overflow-y-auto space-y-3 flex-1">
                    {selectedDayShifts.length === 0 ? (
                        <div className="text-center text-gray-400 py-4 text-sm italic">No hay programación para este día.</div>
                    ) : (
                        selectedDayShifts.map(shift => {
                            const tec = tecnicos.find(t => t.id_dni_tec === shift.id_dni_tec);
                            const ambName = ambientes.find(a => a.id_amb === shift.id_amb)?.nombre_servicio_amb;
                            const colorClass = ACTIVITY_COLORS[shift.tipo_actividad || ''] || DEFAULT_ACTIVITY_COLOR;
                            const isAnulado = shift.estado === 'Anulado';
                            
                            return (
                                <div key={shift.id_programacion} className={`border rounded-lg p-3 hover:shadow-md transition-shadow bg-white relative group ${isAnulado ? 'border-red-200 bg-red-50/50' : ''}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                                {tec?.nombre_completo_tec.substring(0,2)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-800 leading-tight">{tec?.nombre_completo_tec}</p>
                                                <p className="text-[10px] text-gray-500">{shift.hora_programacion_inicio} - {shift.hora_programacion_fin}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleActionRequest(shift.id_programacion, 'EDIT')} className="text-blue-400 hover:text-blue-600 p-0.5"><Edit size={14}/></button>
                                            <button onClick={() => handleActionRequest(shift.id_programacion, 'ANULATE')} className="text-orange-400 hover:text-orange-600 p-0.5"><Ban size={14}/></button>
                                            <button onClick={() => handleActionRequest(shift.id_programacion, 'DELETE')} className="text-gray-300 hover:text-red-500 p-0.5"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                    
                                    <div className={`text-xs px-2 py-1 rounded border inline-block mb-2 font-medium ${colorClass}`}>
                                        {shift.tipo_actividad || 'Actividad'}
                                    </div>

                                    {isAnulado && <div className="text-xs font-bold text-red-600 mb-1 border-t border-red-200 pt-1"> ANULADO </div>}

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                            <MapPin size={12} className="text-gray-400"/>
                                            <span className="truncate">{shift.establecimiento}</span>
                                        </div>
                                        {ambName && (
                                            <div className="flex items-center gap-1 text-xs text-gray-600 pl-4">
                                                <span className="truncate text-gray-500">↳ {ambName}</span>
                                            </div>
                                        )}
                                        {shift.tarea_programacion && (
                                             <div className="flex items-center gap-1 text-xs text-gray-600 mt-1 pt-1 border-t border-dashed">
                                                <Briefcase size={12} className="text-gray-400"/>
                                                <span className="italic">{shift.tarea_programacion}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ADD FORM */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <PlusCircle size={18} className="text-brand-600"/> Nuevo Turno
                </h3>
                
                {errorMsg && (
                    <div className="mb-3 p-2 bg-red-50 text-red-700 text-xs rounded flex items-center gap-2">
                        <AlertCircle size={14} /> {errorMsg}
                    </div>
                )}

                <form onSubmit={handleAddShift} className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Técnico</label>
                        <select className="w-full p-2 border rounded text-sm bg-gray-50" value={newProg.id_dni_tec} onChange={e => setNewProg({...newProg, id_dni_tec: e.target.value})}>
                            {tecnicos.map(t => <option key={t.id_dni_tec} value={t.id_dni_tec}>{t.nombre_completo_tec}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Inicio</label>
                            <input type="time" className="w-full p-2 border rounded text-sm" value={newProg.hora_inicio} onChange={e => setNewProg({...newProg, hora_inicio: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Fin</label>
                            <input type="time" className="w-full p-2 border rounded text-sm" value={newProg.hora_fin} onChange={e => setNewProg({...newProg, hora_fin: e.target.value})} />
                        </div>
                    </div>

                    <div className="relative" ref={activityRef}>
                         <label className="block text-xs font-bold text-gray-500 mb-1">Tipo Actividad</label>
                         <input 
                            type="text"
                            className="w-full p-2 border rounded text-sm"
                            placeholder="Seleccionar o escribir..."
                            value={activitySearch}
                            onChange={(e) => {
                                setActivitySearch(e.target.value);
                                setShowActivitySuggestions(true);
                                setNewProg({...newProg, tipo_actividad: e.target.value});
                            }}
                            onFocus={() => setShowActivitySuggestions(true)}
                         />
                         {showActivitySuggestions && (
                            <div className="absolute z-10 w-full bg-white border mt-1 rounded-lg shadow-lg max-h-40 overflow-y-auto bottom-full mb-1">
                                {filteredActivities.map(act => (
                                    <div key={act} className="p-2 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => { 
                                        setActivitySearch(act); 
                                        setNewProg({...newProg, tipo_actividad: act});
                                        setShowActivitySuggestions(false); 
                                    }}>
                                        {act}
                                    </div>
                                ))}
                                {!filteredActivities.some(a => a.toLowerCase() === activitySearch.toLowerCase()) && activitySearch && (
                                    <div className="p-2 bg-blue-50 text-blue-700 cursor-pointer text-sm font-bold flex items-center gap-2 border-t" onClick={handleAddActivityManual}>
                                        <Plus size={14}/> Agregar "{activitySearch}"
                                    </div>
                                )}
                            </div>
                         )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Establecimiento</label>
                        <select className="w-full p-2 border rounded text-sm" value={newProg.id_estab} onChange={e => setNewProg({...newProg, id_estab: e.target.value, id_amb: ''})}>
                            <option value="">-- Seleccionar Sede --</option>
                            {establecimientos.map(e => <option key={e.id_codigo_ipress_estab} value={e.id_codigo_ipress_estab}>{e.nombre_estab}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Ambiente (Opcional)</label>
                        <select className="w-full p-2 border rounded text-sm disabled:bg-gray-100" value={newProg.id_amb} onChange={e => setNewProg({...newProg, id_amb: e.target.value})} disabled={!newProg.id_estab}>
                            <option value="">-- General --</option>
                            {filteredAmbientes.map(a => <option key={a.id_amb} value={a.id_amb}>{a.nombre_servicio_amb} - {a.nombre_area_amb}</option>)}
                        </select>
                    </div>
                    
                    <div>
                         <label className="block text-xs font-bold text-gray-500 mb-1">Detalle Tarea</label>
                         <input type="text" className="w-full p-2 border rounded text-sm" placeholder="Ej. Revisión Puntos de Red" value={newProg.tarea} onChange={e => setNewProg({...newProg, tarea: e.target.value})} />
                    </div>

                    <button type="submit" className="w-full py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium text-sm shadow-sm mt-2">
                        + Agregar Turno
                    </button>
                </form>
            </div>
        </div>
      </div>

      {/* --- DAY DETAILS MODAL --- */}
      {selectedDayShiftsModal && dayShiftsDate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl w-full max-w-4xl p-6 shadow-2xl h-[80vh] flex flex-col">
                  <div className="flex justify-between items-center mb-4 border-b pb-4">
                      <div>
                          <h3 className="text-xl font-bold text-gray-800">Detalle de Programación</h3>
                          <p className="text-gray-500 capitalize">{dayShiftsDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                      <button onClick={() => setSelectedDayShiftsModal(false)}><X className="text-gray-400 hover:text-gray-600"/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0">
                              <tr>
                                  <th className="p-3">Horario</th>
                                  <th className="p-3">Técnico</th>
                                  <th className="p-3">Sede/Actividad</th>
                                  <th className="p-3">Estado</th>
                                  <th className="p-3 text-right">Acciones</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {programacion
                                .filter(p => p.fecha_programacion_inicio === formatDate(dayShiftsDate) && p.estado !== 'Eliminado')
                                .map(shift => {
                                  const tec = tecnicos.find(t => t.id_dni_tec === shift.id_dni_tec);
                                  const colorClass = ACTIVITY_COLORS[shift.tipo_actividad || ''] || DEFAULT_ACTIVITY_COLOR;
                                  const isAnulado = shift.estado === 'Anulado';

                                  return (
                                      <tr key={shift.id_programacion} className={`hover:bg-gray-50 ${isAnulado ? 'bg-red-50/50' : ''}`}>
                                          <td className="p-3 font-mono text-gray-600">{shift.hora_programacion_inicio} - {shift.hora_programacion_fin}</td>
                                          <td className="p-3 font-medium">{tec?.nombre_completo_tec}</td>
                                          <td className="p-3">
                                              <span className={`text-[10px] px-2 py-0.5 rounded border inline-block mb-1 ${colorClass}`}>{shift.tipo_actividad}</span>
                                              <div className="text-xs text-gray-500">{shift.establecimiento}</div>
                                          </td>
                                          <td className="p-3">
                                              {isAnulado ? 
                                                <span className="text-red-600 text-xs font-bold flex items-center gap-1"><Ban size={12}/> Anulado</span> : 
                                                <span className="text-green-600 text-xs font-bold">Activo</span>
                                              }
                                              {shift.nombre_auditoria && (
                                                  <div className="text-[9px] text-gray-400 mt-1">
                                                      Mod: {shift.nombre_auditoria} <br/>
                                                      {new Date(shift.fecha_cambio!).toLocaleTimeString()}
                                                  </div>
                                              )}
                                          </td>
                                          <td className="p-3 text-right">
                                              <div className="flex justify-end gap-2">
                                                  <button onClick={() => handleActionRequest(shift.id_programacion, 'EDIT')} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded" title="Editar"><Edit size={16}/></button>
                                                  { !isAnulado && <button onClick={() => handleActionRequest(shift.id_programacion, 'ANULATE')} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded" title="Anular"><Ban size={16}/></button> }
                                                  <button onClick={() => handleActionRequest(shift.id_programacion, 'DELETE')} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Eliminar"><Trash2 size={16}/></button>
                                              </div>
                                          </td>
                                      </tr>
                                  );
                              })}
                              {programacion.filter(p => p.fecha_programacion_inicio === formatDate(dayShiftsDate) && p.estado !== 'Eliminado').length === 0 && (
                                  <tr><td colSpan={5} className="p-8 text-center text-gray-400 italic">No hay registros para este día.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* --- DELETED HISTORY MODAL --- */}
      {showDeletedHistory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] backdrop-blur-sm">
              <div className="bg-white rounded-xl w-full max-w-5xl p-6 shadow-2xl h-[70vh] flex flex-col">
                  <div className="flex justify-between items-center mb-4 border-b pb-4">
                      <div className="flex items-center gap-2 text-red-700">
                          <Trash2 size={24}/>
                          <div>
                              <h3 className="text-xl font-bold">Historial de Eliminados</h3>
                              <p className="text-sm text-gray-500">Registro de auditoría de turnos borrados</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <button onClick={handlePrintDeletedHistory} className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-slate-900"><Printer size={14}/> Imprimir Reporte</button>
                          <button onClick={() => setShowDeletedHistory(false)} className="text-gray-400 hover:text-gray-600 p-1"><X/></button>
                      </div>
                  </div>
                  
                  {/* FILTERS SECTION */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Buscar por Técnico</label>
                          <div className="relative">
                             <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                             <input type="text" placeholder="Nombre..." className="w-full pl-7 pr-2 py-1.5 border rounded text-sm" value={deletedFilterName} onChange={e => setDeletedFilterName(e.target.value)} />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Fecha de Turno</label>
                          <input type="date" className="w-full py-1.5 px-2 border rounded text-sm" value={deletedFilterShiftDate} onChange={e => setDeletedFilterShiftDate(e.target.value)} />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Fecha de Eliminación</label>
                          <input type="date" className="w-full py-1.5 px-2 border rounded text-sm" value={deletedFilterDeleteDate} onChange={e => setDeletedFilterDeleteDate(e.target.value)} />
                      </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-red-50 text-red-700 font-medium sticky top-0">
                              <tr>
                                  <th className="p-3">Fecha Turno</th>
                                  <th className="p-3">Técnico Afectado</th>
                                  <th className="p-3">Eliminado Por (Auditor)</th>
                                  <th className="p-3">Motivo Eliminación</th>
                                  <th className="p-3">Fecha Baja</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {getFilteredDeletedShifts().map(shift => {
                                  const tec = tecnicos.find(t => t.id_dni_tec === shift.id_dni_tec);
                                  return (
                                      <tr key={shift.id_programacion} className="hover:bg-gray-50">
                                          <td className="p-3 font-mono text-gray-600">{shift.fecha_programacion_inicio} <span className="text-xs block">({shift.hora_programacion_inicio}-{shift.hora_programacion_fin})</span></td>
                                          <td className="p-3 font-medium">{tec?.nombre_completo_tec}</td>
                                          <td className="p-3 font-bold text-gray-700">{shift.nombre_auditoria}</td>
                                          <td className="p-3 italic text-gray-600">{shift.motivo_cambio}</td>
                                          <td className="p-3 text-xs text-gray-500">{new Date(shift.fecha_cambio!).toLocaleString()}</td>
                                      </tr>
                                  );
                              })}
                              {getFilteredDeletedShifts().length === 0 && (
                                  <tr><td colSpan={5} className="p-8 text-center text-gray-400 italic">No se encontraron registros eliminados con los filtros aplicados.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* --- AUDIT MODAL (WHO & WHY) --- */}
      {auditModal.isOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] backdrop-blur-sm">
              <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
                  <div className="flex items-center gap-2 mb-4 text-gray-800">
                      <AlertTriangle className="text-brand-600" />
                      <h3 className="text-lg font-bold">Registro de Auditoría</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                      Para {auditModal.actionType === 'DELETE' ? 'ELIMINAR' : auditModal.actionType === 'ANULATE' ? 'ANULAR' : 'EDITAR'} este registro, debe identificarse.
                  </p>

                  <div className="space-y-4">
                      {/* Only show time inputs if EDITing */}
                      {auditModal.actionType === 'EDIT' && (
                          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Nueva Hora Inicio</label>
                                  <input type="time" className="w-full border p-2 rounded text-sm" value={auditForm.newStart} onChange={e => setAuditForm({...auditForm, newStart: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Nueva Hora Fin</label>
                                  <input type="time" className="w-full border p-2 rounded text-sm" value={auditForm.newEnd} onChange={e => setAuditForm({...auditForm, newEnd: e.target.value})} />
                              </div>
                          </div>
                      )}

                      <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Responsable del Cambio *</label>
                          <select className="w-full p-2 border rounded" value={auditForm.id_dni_auditoria} onChange={e => setAuditForm({...auditForm, id_dni_auditoria: e.target.value})}>
                              <option value="">-- Seleccionar Personal --</option>
                              {tecnicos.map(t => <option key={t.id_dni_tec} value={t.id_dni_tec}>{t.nombre_completo_tec}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Motivo / Observación *</label>
                          <textarea 
                            className="w-full p-2 border rounded text-sm h-20" 
                            placeholder="Ej. Error de digitación, Cambio de turno..."
                            value={auditForm.motivo}
                            onChange={e => setAuditForm({...auditForm, motivo: e.target.value})}
                          />
                      </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                      <button onClick={() => setAuditModal({...auditModal, isOpen: false})} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                      <button 
                        onClick={confirmAuditAction} 
                        className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 flex items-center gap-2"
                        disabled={!auditForm.id_dni_auditoria || !auditForm.motivo}
                      >
                          <Save size={16}/> Confirmar Cambio
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- REPORT MODAL --- */}
      {isReportModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Download className="text-brand-600" size={20}/> Exportar Reporte
                  </h3>
                  
                  <div className="space-y-4 mb-6">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Fecha Inicio</label>
                          <input type="date" className="w-full border p-2 rounded" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)}/>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Fecha Fin</label>
                          <input type="date" className="w-full border p-2 rounded" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)}/>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Técnico (Opcional)</label>
                          <select className="w-full border p-2 rounded" value={reportTechId} onChange={e => setReportTechId(e.target.value)}>
                              <option value="">-- Todos --</option>
                              {tecnicos.map(t => <option key={t.id_dni_tec} value={t.id_dni_tec}>{t.nombre_completo_tec}</option>)}
                          </select>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                      <button onClick={handleExportPDF} className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-red-50 hover:border-red-200 text-red-700 transition-colors">
                          <FileText size={24} className="mb-1"/>
                          <span className="text-xs font-bold">PDF Imprimible</span>
                      </button>
                      <button onClick={handleExportExcel} className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-green-50 hover:border-green-200 text-green-700 transition-colors">
                          <FileSpreadsheet size={24} className="mb-1"/>
                          <span className="text-xs font-bold">Excel (Tabla)</span>
                      </button>
                  </div>
                  
                  <button onClick={() => setIsReportModalOpen(false)} className="w-full mt-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm">Cancelar</button>
              </div>
          </div>
      )}
    </div>
  );
};