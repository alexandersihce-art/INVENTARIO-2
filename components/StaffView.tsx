




import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Tecnico, Personal, Establecimiento, ACADEMIC_DEGREES, COMMON_JOB_TITLES } from '../types';
import { User, Mail, Phone, Shield, Search, Plus, X, Edit, Trash2, Stethoscope, Briefcase, Building2, Download, FileText, FileSpreadsheet, MapPin } from 'lucide-react';

interface StaffViewProps {
  tecnicos: Tecnico[];
  setTecnicos: React.Dispatch<React.SetStateAction<Tecnico[]>>;
  personalSalud: Personal[];
  setPersonalSalud: React.Dispatch<React.SetStateAction<Personal[]>>;
  establecimientos: Establecimiento[];
}

export const StaffView: React.FC<StaffViewProps> = ({ 
    tecnicos, 
    setTecnicos, 
    personalSalud, 
    setPersonalSalud,
    establecimientos
}) => {
  const [activeTab, setActiveTab] = useState<'CENTRAL' | 'IPRESS'>('CENTRAL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form States
  const initialCentralState: Partial<Tecnico> = {
      id_dni_tec: undefined,
      nombre_completo_tec: '',
      cargo_tec: '',
      grado_academico: '',
      carrera: '',
      oficina: '',
      fecha_registro: new Date().toISOString().split('T')[0],
      email_tec: '',
      telefono_tec: ''
  };
  const initialIPRESSState: Partial<Personal> = {
      id_dni_pers: undefined,
      nombre_completo_pers: '',
      cargo_pers: '',
      grado_academico: '',
      carrera: '',
      fecha_registro: new Date().toISOString().split('T')[0],
      email_pers: '',
      telefono_pers: '',
      id_codigo_ipress_estab: undefined
  };

  const [formCentral, setFormCentral] = useState<Partial<Tecnico>>(initialCentralState);
  const [formIPRESS, setFormIPRESS] = useState<Partial<Personal>>(initialIPRESSState);

  // Dynamic Job Title Search State
  const [jobTitleSearch, setJobTitleSearch] = useState('');
  const [showJobTitleSuggestions, setShowJobTitleSuggestions] = useState(false);
  const jobTitleRef = useRef<HTMLDivElement>(null);

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportStartDate, setReportStartDate] = useState('2020-01-01');
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Click outside listener for job title dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (jobTitleRef.current && !jobTitleRef.current.contains(event.target as Node)) {
        setShowJobTitleSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filters
  const filteredCentral = tecnicos.filter(t => 
      t.nombre_completo_tec.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.id_dni_tec.toString().includes(searchTerm)
  );

  const filteredIPRESS = personalSalud.filter(p => 
      p.nombre_completo_pers.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id_dni_pers.toString().includes(searchTerm)
  );

  // Filtered lists for report
  const getFilteredReportData = () => {
      const start = reportStartDate;
      const end = reportEndDate;
      
      if (activeTab === 'CENTRAL') {
          return filteredCentral.filter(t => {
              const reg = t.fecha_registro || '2000-01-01';
              return reg >= start && reg <= end;
          });
      } else {
          return filteredIPRESS.filter(p => {
              const reg = p.fecha_registro || '2000-01-01';
              return reg >= start && reg <= end;
          });
      }
  };

  // Job Title Filter
  const filteredJobTitles = useMemo(() => {
      return COMMON_JOB_TITLES.filter(t => t.toLowerCase().includes(jobTitleSearch.toLowerCase()));
  }, [jobTitleSearch]);

  const handleManualAddJobTitle = () => {
      if (jobTitleSearch) {
          // It will be added when saving
          setShowJobTitleSuggestions(false);
      }
  };

  // Actions
  const handleOpenCreate = () => {
      setModalMode('CREATE');
      setEditingId(null);
      setFormCentral(initialCentralState);
      setFormIPRESS(initialIPRESSState);
      setJobTitleSearch('');
      setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
      setModalMode('EDIT');
      if (activeTab === 'CENTRAL') {
          setEditingId(item.id_dni_tec);
          setFormCentral({ ...item });
          setJobTitleSearch(item.cargo_tec || '');
      } else {
          setEditingId(item.id_dni_pers);
          setFormIPRESS({ ...item });
          setJobTitleSearch(item.cargo_pers || '');
      }
      setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
      if (confirm('¿Eliminar registro?')) {
          if (activeTab === 'CENTRAL') setTecnicos(prev => prev.filter(t => t.id_dni_tec !== id));
          else setPersonalSalud(prev => prev.filter(p => p.id_dni_pers !== id));
      }
  };

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      if (activeTab === 'CENTRAL') {
          const payload = { ...formCentral, cargo_tec: jobTitleSearch } as Tecnico;
          if (modalMode === 'CREATE') setTecnicos(prev => [...prev, payload]);
          else setTecnicos(prev => prev.map(t => t.id_dni_tec === editingId ? payload : t));
      } else {
          const payload = { ...formIPRESS, cargo_pers: jobTitleSearch } as Personal;
          if (modalMode === 'CREATE') setPersonalSalud(prev => [...prev, payload]);
          else setPersonalSalud(prev => prev.map(p => p.id_dni_pers === editingId ? payload : p));
      }
      setIsModalOpen(false);
  };

  const handleExportPDF = () => {
      const data = getFilteredReportData();
      const title = activeTab === 'CENTRAL' ? 'REPORTE DE PERSONAL ADMINISTRATIVO (SEDE CENTRAL)' : 'REPORTE DE PERSONAL ADMINISTRATIVO (IPRESS)';
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
          const rows = data.map((row: any) => {
              const location = activeTab === 'IPRESS' ? establecimientos.find(e => e.id_codigo_ipress_estab === row.id_codigo_ipress_estab)?.nombre_estab : row.oficina;
              return `
                <tr>
                    <td class="border p-2 font-mono">${activeTab === 'CENTRAL' ? row.id_dni_tec : row.id_dni_pers}</td>
                    <td class="border p-2">${activeTab === 'CENTRAL' ? row.nombre_completo_tec : row.nombre_completo_pers}</td>
                    <td class="border p-2">${activeTab === 'CENTRAL' ? row.cargo_tec : row.cargo_pers}</td>
                    <td class="border p-2">${row.grado_academico || '-'} / ${row.carrera || '-'}</td>
                    <td class="border p-2 text-xs">${location || '-'}</td>
                    <td class="border p-2 text-xs">${activeTab === 'CENTRAL' ? row.telefono_tec : row.telefono_pers}</td>
                    <td class="border p-2 text-xs">${row.fecha_registro || '-'}</td>
                </tr>
              `;
          }).join('');

          printWindow.document.write(`
            <html>
                <head>
                    <title>Reporte Personal</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                </head>
                <body class="p-8 font-sans">
                    <h1 class="text-xl font-bold mb-2">${title}</h1>
                    <p class="mb-6 text-gray-600 text-sm">Filtro de Registro: ${reportStartDate} al ${reportEndDate} | Registros: ${data.length}</p>
                    <table class="w-full border-collapse text-sm">
                        <thead>
                            <tr class="bg-gray-100">
                                <th class="border p-2 text-left">DNI</th>
                                <th class="border p-2 text-left">Nombre Completo</th>
                                <th class="border p-2 text-left">Cargo</th>
                                <th class="border p-2 text-left">Formación</th>
                                <th class="border p-2 text-left">${activeTab === 'CENTRAL' ? 'Oficina' : 'Establecimiento'}</th>
                                <th class="border p-2 text-left">Contacto</th>
                                <th class="border p-2 text-left">F. Registro</th>
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
      
      data.forEach((row: any) => {
          const location = activeTab === 'IPRESS' ? establecimientos.find(e => e.id_codigo_ipress_estab === row.id_codigo_ipress_estab)?.nombre_estab : row.oficina;
          tableRows += `
            <tr>
                <td style="border: 1px solid #000; padding: 5px;">${activeTab === 'CENTRAL' ? row.id_dni_tec : row.id_dni_pers}</td>
                <td style="border: 1px solid #000; padding: 5px;">${activeTab === 'CENTRAL' ? row.nombre_completo_tec : row.nombre_completo_pers}</td>
                <td style="border: 1px solid #000; padding: 5px;">${activeTab === 'CENTRAL' ? row.cargo_tec : row.cargo_pers}</td>
                <td style="border: 1px solid #000; padding: 5px;">${row.grado_academico || ''}</td>
                <td style="border: 1px solid #000; padding: 5px;">${row.carrera || ''}</td>
                <td style="border: 1px solid #000; padding: 5px;">${location || ''}</td>
                <td style="border: 1px solid #000; padding: 5px;">${activeTab === 'CENTRAL' ? row.telefono_tec : row.telefono_pers}</td>
                <td style="border: 1px solid #000; padding: 5px;">${activeTab === 'CENTRAL' ? row.email_tec : row.email_pers}</td>
                <td style="border: 1px solid #000; padding: 5px;">${row.fecha_registro || ''}</td>
            </tr>
          `;
      });

      const excelTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"></head>
        <body>
            <h3>Listado de Personal (${activeTab})</h3>
            <table border="1">
                <thead>
                    <tr style="background-color: #cccccc;">
                        <th>DNI</th><th>Nombre</th><th>Cargo</th><th>Grado</th><th>Carrera</th><th>${activeTab === 'CENTRAL' ? 'Oficina' : 'Establecimiento'}</th><th>Teléfono</th><th>Email</th><th>Fecha Registro</th>
                    </tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
        </body>
        </html>
      `;

      const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Personal_${activeTab}_${new Date().toISOString().split('T')[0]}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Personal</h2>
          <p className="text-gray-500">Administración de RR.HH. y colaboradores</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <input 
                  type="text" 
                  placeholder="Buscar por nombre o DNI..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
             <button onClick={() => setIsReportModalOpen(true)} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-slate-900 shadow-sm whitespace-nowrap transition-colors">
               <Download size={18}/> 
               <span className="hidden sm:inline">Exportar Lista</span>
             </button>
             <button onClick={handleOpenCreate} className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-brand-700 shadow-sm whitespace-nowrap transition-colors">
               <Plus size={18}/> 
               <span className="hidden sm:inline">Nuevo Registro</span>
             </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button onClick={() => setActiveTab('CENTRAL')} className={`px-4 py-2 flex items-center gap-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'CENTRAL' ? 'bg-brand-50 text-brand-600 border-b-2 border-brand-600' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Briefcase size={16}/> P. Administrativo Sede Central
        </button>
        <button onClick={() => setActiveTab('IPRESS')} className={`px-4 py-2 flex items-center gap-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'IPRESS' ? 'bg-green-50 text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Stethoscope size={16}/> P. Administrativo IPRESS
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'CENTRAL' ? (
            filteredCentral.map(tec => (
              <div key={tec.id_dni_tec} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4 group hover:border-brand-300 transition-all">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-lg">
                    {tec.nombre_completo_tec.substring(0,2).toUpperCase()}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenEdit(tec)} className="p-1 text-gray-400 hover:text-brand-600"><Edit size={16}/></button>
                      <button onClick={() => handleDelete(tec.id_dni_tec)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{tec.nombre_completo_tec}</h3>
                  <p className="text-brand-600 font-medium text-xs flex items-center gap-1 mt-1 bg-brand-50 w-fit px-2 py-0.5 rounded">
                    <Shield size={12} /> {tec.cargo_tec}
                  </p>
                  <p className="text-xs text-gray-400 mt-2 font-mono">DNI: {tec.id_dni_tec}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs font-bold text-gray-600">
                      <Building2 size={12}/> {tec.oficina || 'Sin Oficina'}
                  </div>
                  {tec.grado_academico && <p className="text-xs text-gray-500 mt-1">{tec.grado_academico} - {tec.carrera}</p>}
                </div>
                <div className="space-y-2 mt-auto pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500"><Mail size={14} /> {tec.email_tec}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500"><Phone size={14} /> {tec.telefono_tec}</div>
                </div>
              </div>
            ))
        ) : (
            filteredIPRESS.map(pers => {
                const estab = establecimientos.find(e => e.id_codigo_ipress_estab === pers.id_codigo_ipress_estab);
                return (
                  <div key={pers.id_dni_pers} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4 group hover:border-green-300 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-lg">
                        {pers.nombre_completo_pers.substring(0,2).toUpperCase()}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenEdit(pers)} className="p-1 text-gray-400 hover:text-brand-600"><Edit size={16}/></button>
                          <button onClick={() => handleDelete(pers.id_dni_pers)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{pers.nombre_completo_pers}</h3>
                      <p className="text-green-600 font-medium text-xs flex items-center gap-1 mt-1 bg-green-50 w-fit px-2 py-0.5 rounded">
                        <Stethoscope size={12} /> {pers.cargo_pers}
                      </p>
                      <p className="text-xs text-gray-400 mt-2 font-mono">DNI: {pers.id_dni_pers}</p>
                      {pers.grado_academico && <p className="text-xs text-gray-500 mt-1">{pers.grado_academico} - {pers.carrera}</p>}
                    </div>
                    <div className="mt-auto pt-4 border-t border-gray-100">
                       <div className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-2"><MapPin size={14} /> {estab?.nombre_estab || 'Sin Asignar'}</div>
                       <div className="flex items-center gap-2 text-xs text-gray-500"><Mail size={14} /> {pers.email_pers || '-'}</div>
                    </div>
                  </div>
                );
            })
        )}
      </div>

      {/* --- REPORT MODAL --- */}
      {isReportModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Download className="text-brand-600" size={20}/> Exportar Personal
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">Filtrar por fecha de registro en el sistema.</p>
                  
                  <div className="space-y-4 mb-6">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Desde</label>
                          <input type="date" className="w-full border p-2 rounded" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)}/>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Hasta</label>
                          <input type="date" className="w-full border p-2 rounded" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)}/>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                      <button onClick={handleExportPDF} className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-red-50 hover:border-red-200 text-red-700 transition-colors">
                          <FileText size={24} className="mb-1"/>
                          <span className="text-xs font-bold">PDF Lista</span>
                      </button>
                      <button onClick={handleExportExcel} className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-green-50 hover:border-green-200 text-green-700 transition-colors">
                          <FileSpreadsheet size={24} className="mb-1"/>
                          <span className="text-xs font-bold">Excel</span>
                      </button>
                  </div>
                  <button onClick={() => setIsReportModalOpen(false)} className="w-full mt-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm">Cancelar</button>
              </div>
          </div>
      )}

      {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4 border-b pb-4">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          {activeTab === 'CENTRAL' ? <Briefcase className="text-brand-600"/> : <Stethoscope className="text-green-600"/>} 
                          {modalMode === 'CREATE' ? 'Nuevo Registro' : 'Editar Personal'}
                      </h3>
                      <button onClick={() => setIsModalOpen(false)}><X className="text-gray-400 hover:text-gray-600"/></button>
                  </div>
                  <form onSubmit={handleSave} className="space-y-4">
                      {activeTab === 'CENTRAL' ? (
                          <>
                             <div className="bg-brand-50 p-3 rounded-lg border border-brand-100 mb-2">
                                <label className="block text-xs font-bold text-brand-800 mb-1">Sede (Fijo)</label>
                                <input type="text" disabled className="w-full border border-brand-200 bg-white p-2 rounded text-sm font-bold text-gray-600" value="SEDE CENTRAL DIRIS LIMA NORTE" />
                             </div>
                             
                             <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">DNI *</label><input type="number" required className="w-full border p-2 rounded text-sm" value={formCentral.id_dni_tec || ''} onChange={e => setFormCentral({...formCentral, id_dni_tec: parseInt(e.target.value)})} disabled={modalMode === 'EDIT'} /></div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">Teléfono</label><input type="text" className="w-full border p-2 rounded text-sm" value={formCentral.telefono_tec || ''} onChange={e => setFormCentral({...formCentral, telefono_tec: e.target.value})} /></div>
                             </div>
                             <div><label className="block text-xs font-bold text-gray-500 mb-1">Nombre Completo *</label><input type="text" required className="w-full border p-2 rounded text-sm" value={formCentral.nombre_completo_tec || ''} onChange={e => setFormCentral({...formCentral, nombre_completo_tec: e.target.value})} /></div>
                             
                             {/* SEARCHABLE JOB TITLE */}
                             <div className="relative" ref={jobTitleRef}>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Cargo / Puesto *</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full border p-2 rounded text-sm" 
                                    placeholder="Seleccionar o escribir..."
                                    value={jobTitleSearch} 
                                    onChange={e => { setJobTitleSearch(e.target.value); setShowJobTitleSuggestions(true); }}
                                    onFocus={() => setShowJobTitleSuggestions(true)}
                                />
                                {showJobTitleSuggestions && (
                                    <div className="absolute z-10 w-full bg-white border mt-1 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                        {filteredJobTitles.map(t => (
                                            <div key={t} className="p-2 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => { setJobTitleSearch(t); setShowJobTitleSuggestions(false); }}>{t}</div>
                                        ))}
                                        {!filteredJobTitles.includes(jobTitleSearch) && jobTitleSearch && (
                                            <div className="p-2 bg-blue-50 text-blue-700 cursor-pointer text-sm font-bold flex items-center gap-2 border-t" onClick={handleManualAddJobTitle}>
                                                <Plus size={14}/> Agregar "{jobTitleSearch}"
                                            </div>
                                        )}
                                    </div>
                                )}
                             </div>

                             <div><label className="block text-xs font-bold text-gray-500 mb-1">Oficina / Área *</label><input type="text" required className="w-full border p-2 rounded text-sm" value={formCentral.oficina || ''} onChange={e => setFormCentral({...formCentral, oficina: e.target.value})} placeholder="Ej. Logística, Recursos Humanos, TI" /></div>

                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Grado Académico</label>
                                    <select className="w-full border p-2 rounded text-sm" value={formCentral.grado_academico} onChange={e => setFormCentral({...formCentral, grado_academico: e.target.value})}>
                                        <option value="">-- Seleccionar --</option>
                                        {ACADEMIC_DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Carrera / Profesión</label>
                                    <input type="text" className="w-full border p-2 rounded text-sm" value={formCentral.carrera || ''} onChange={e => setFormCentral({...formCentral, carrera: e.target.value})} placeholder="Ej. Sistemas"/>
                                </div>
                             </div>

                             <div><label className="block text-xs font-bold text-gray-500 mb-1">Email</label><input type="email" className="w-full border p-2 rounded text-sm" value={formCentral.email_tec || ''} onChange={e => setFormCentral({...formCentral, email_tec: e.target.value})} /></div>
                          </>
                      ) : (
                          <>
                             <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">DNI *</label><input type="number" required className="w-full border p-2 rounded text-sm" value={formIPRESS.id_dni_pers || ''} onChange={e => setFormIPRESS({...formIPRESS, id_dni_pers: parseInt(e.target.value)})} disabled={modalMode === 'EDIT'} /></div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">Teléfono</label><input type="text" className="w-full border p-2 rounded text-sm" value={formIPRESS.telefono_pers || ''} onChange={e => setFormIPRESS({...formIPRESS, telefono_pers: e.target.value})} /></div>
                             </div>
                             <div><label className="block text-xs font-bold text-gray-500 mb-1">Nombre Completo *</label><input type="text" required className="w-full border p-2 rounded text-sm" value={formIPRESS.nombre_completo_pers || ''} onChange={e => setFormIPRESS({...formIPRESS, nombre_completo_pers: e.target.value})} /></div>
                             
                             {/* SEARCHABLE JOB TITLE */}
                             <div className="relative" ref={jobTitleRef}>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Cargo *</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full border p-2 rounded text-sm" 
                                    placeholder="Seleccionar o escribir..."
                                    value={jobTitleSearch} 
                                    onChange={e => { setJobTitleSearch(e.target.value); setShowJobTitleSuggestions(true); }}
                                    onFocus={() => setShowJobTitleSuggestions(true)}
                                />
                                {showJobTitleSuggestions && (
                                    <div className="absolute z-10 w-full bg-white border mt-1 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                        {filteredJobTitles.map(t => (
                                            <div key={t} className="p-2 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => { setJobTitleSearch(t); setShowJobTitleSuggestions(false); }}>{t}</div>
                                        ))}
                                        {!filteredJobTitles.includes(jobTitleSearch) && jobTitleSearch && (
                                            <div className="p-2 bg-blue-50 text-blue-700 cursor-pointer text-sm font-bold flex items-center gap-2 border-t" onClick={handleManualAddJobTitle}>
                                                <Plus size={14}/> Agregar "{jobTitleSearch}"
                                            </div>
                                        )}
                                    </div>
                                )}
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Grado Académico</label>
                                    <select className="w-full border p-2 rounded text-sm" value={formIPRESS.grado_academico} onChange={e => setFormIPRESS({...formIPRESS, grado_academico: e.target.value})}>
                                        <option value="">-- Seleccionar --</option>
                                        {ACADEMIC_DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Carrera / Profesión</label>
                                    <input type="text" className="w-full border p-2 rounded text-sm" value={formIPRESS.carrera || ''} onChange={e => setFormIPRESS({...formIPRESS, carrera: e.target.value})} placeholder="Ej. Enfermería"/>
                                </div>
                             </div>

                             <div><label className="block text-xs font-bold text-gray-500 mb-1">Establecimiento (Sede) *</label><select required className="w-full border p-2 rounded text-sm" value={formIPRESS.id_codigo_ipress_estab || ''} onChange={e => setFormIPRESS({...formIPRESS, id_codigo_ipress_estab: parseInt(e.target.value)})}> <option value="">-- Seleccionar --</option> {establecimientos.map(e => <option key={e.id_codigo_ipress_estab} value={e.id_codigo_ipress_estab}>{e.nombre_estab}</option>)} </select></div>
                             <div><label className="block text-xs font-bold text-gray-500 mb-1">Email</label><input type="email" className="w-full border p-2 rounded text-sm" value={formIPRESS.email_pers || ''} onChange={e => setFormIPRESS({...formIPRESS, email_pers: e.target.value})} /></div>
                          </>
                      )}
                      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                          <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                          <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm">Guardar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};