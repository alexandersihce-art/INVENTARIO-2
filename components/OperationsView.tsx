

import React, { useState, useRef, useEffect } from 'react';
import { Mantenimiento, Dispositivo, Tecnico, Establecimiento } from '../types';
import { Wrench, CheckCircle, Clock, Plus, Search, X, Edit, Trash2, Printer, FileText, Upload, FileCheck, Ban, AlertTriangle, Save, Calendar, User, Laptop, AlertCircle, FileUp, Eye, Download, Layers, FileStack } from 'lucide-react';

interface OperationsViewProps {
  mantenimientos: Mantenimiento[];
  setMantenimientos: React.Dispatch<React.SetStateAction<Mantenimiento[]>>;
  dispositivos: Dispositivo[];
  tecnicos: Tecnico[];
  establecimientos: Establecimiento[];
}

// Auxiliar interface for batch adding
interface MaintenanceDeviceItem {
    id_codigo_patrimonial_disp_e: number;
    tipo_dispositivo: string;
    marca: string;
    modelo: string;
    serie: string;
}

export const OperationsView: React.FC<OperationsViewProps> = ({ 
  mantenimientos, 
  setMantenimientos,
  dispositivos, 
  tecnicos,
  establecimientos
}) => {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [searchTerm, setSearchTerm] = useState('');
  
  // -- STATES FOR PDF --
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [currentMant, setCurrentMant] = useState<Mantenimiento | null>(null);
  
  // -- STATES FOR ANULATION FLOW --
  const [isAnulateModalOpen, setIsAnulateModalOpen] = useState(false); // Paso 1: Responsable
  const [isAnulateConfirmOpen, setIsAnulateConfirmOpen] = useState(false); // Paso 2: Confirmación Crítica
  const [mantToAnulate, setMantToAnulate] = useState<string | null>(null);
  const [anulateResponsible, setAnulateResponsible] = useState<number | ''>('');

  // -- STATES FOR DELETION FLOW --
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleteErrorOpen, setIsDeleteErrorOpen] = useState(false);
  const [mantToDelete, setMantToDelete] = useState<string | null>(null);

  // -- STATES FOR UPLOAD FLOW --
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [mantToUpload, setMantToUpload] = useState<string | null>(null);
  const [uploadUrlInput, setUploadUrlInput] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -- STATES FOR VIEWING EVIDENCE --
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewEvidenceUrl, setViewEvidenceUrl] = useState('');
  const [blobUrl, setBlobUrl] = useState('');

  // -- FORM STATE --
  const initialFormState: Partial<Mantenimiento> = {
    fecha_mant: new Date().toISOString().split('T')[0],
    id_codigo_ipress_estab: undefined,
    id_codigo_patrimonial_disp_e: undefined,
    motivo_visita_tecnica: '',
    diagnostico: '',
    tipo_mant: 'Correctivo',
    actividades_realizadas: '',
    materiales_utilizados: '',
    recomendaciones: '',
    id_dni_tec_1: undefined,
    nombre_personal_conformidad: ''
  };

  const [formData, setFormData] = useState<Partial<Mantenimiento>>(initialFormState);
  
  // -- BATCH DEVICES STATE --
  const [selectedDevices, setSelectedDevices] = useState<MaintenanceDeviceItem[]>([]);
  const [deviceSearch, setDeviceSearch] = useState('');
  const [tempDevice, setTempDevice] = useState<MaintenanceDeviceItem>({
      id_codigo_patrimonial_disp_e: 0,
      tipo_dispositivo: 'PC',
      marca: '',
      modelo: '',
      serie: ''
  });
  
  // -- REPORT MODE STATE (INDIVIDUAL vs CONSOLIDATED) --
  const [reportMode, setReportMode] = useState<'INDIVIDUAL' | 'CONSOLIDATED'>('INDIVIDUAL');
  
  // --- EFFECT: HANDLE BLOB URL FOR CHROME SECURITY ---
  useEffect(() => {
    if (isViewerOpen && viewEvidenceUrl) {
        if (viewEvidenceUrl.startsWith('data:image')) {
            // Images usually work fine with data URIs
            setBlobUrl(viewEvidenceUrl);
        } else {
            // Convert PDF Base64 to Blob URL to bypass "Chrome blocked this page"
            try {
                const arr = viewEvidenceUrl.split(',');
                // Default to pdf if mime not found, though readAsDataURL usually provides it
                const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while(n--){
                    u8arr[n] = bstr.charCodeAt(n);
                }
                const blob = new Blob([u8arr], {type: mime});
                const url = URL.createObjectURL(blob);
                setBlobUrl(url);
                
                // Cleanup memory when component updates or unmounts
                return () => URL.revokeObjectURL(url);
            } catch (e) {
                console.error("Error converting to Blob", e);
                setBlobUrl(viewEvidenceUrl); // Fallback
            }
        }
    } else {
        setBlobUrl('');
    }
  }, [viewEvidenceUrl, isViewerOpen]);

  // --- CRUD ACTIONS ---

  const handleOpenCreate = () => {
    setModalMode('CREATE');
    setFormData(initialFormState);
    setDeviceSearch('');
    setSelectedDevices([]);
    setTempDevice({ id_codigo_patrimonial_disp_e: 0, tipo_dispositivo: 'PC', marca: '', modelo: '', serie: '' });
    setReportMode('INDIVIDUAL');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: Mantenimiento) => {
    setModalMode('EDIT');
    setFormData({ ...m });
    setDeviceSearch(m.id_codigo_patrimonial_disp_e.toString());
    
    const dev = dispositivos.find(d => d.id_codigo_patrimonial_disp_e === m.id_codigo_patrimonial_disp_e);
    setSelectedDevices([{
        id_codigo_patrimonial_disp_e: m.id_codigo_patrimonial_disp_e,
        tipo_dispositivo: m.tipo_dispositivo_disp_e || dev?.tipo_dispositivo_disp_e || 'PC',
        marca: m.marca_manual || dev?.marca_disp_e || '',
        modelo: m.modelo_manual || dev?.modelo_disp_e || '',
        serie: m.serie_manual || dev?.serie_disp_e || ''
    }]);

    setIsModalOpen(true);
  };

  // --- DELETE LOGIC ---
  const handleClickDelete = (m: Mantenimiento) => {
      const createdAt = m.created_at || 0; 
      const timeDiff = Date.now() - createdAt;
      const thirtyMinutesInMs = 30 * 60 * 1000;

      if (createdAt === 0) {
          // If no created_at (legacy data), block if time exceeded (or unknown implies old)
          setIsDeleteErrorOpen(true);
          return;
      }

      if (timeDiff > thirtyMinutesInMs) {
          setIsDeleteErrorOpen(true);
      } else {
          setMantToDelete(m.id_mant);
          setIsDeleteConfirmOpen(true);
      }
  };

  const confirmDelete = () => {
      if (mantToDelete) {
          setMantenimientos(prev => prev.filter(m => m.id_mant !== mantToDelete));
          setIsDeleteConfirmOpen(false);
          setMantToDelete(null);
      }
  };

  // --- UPLOAD EVIDENCE LOGIC ---
  const handleOpenUpload = (id: string) => {
      setMantToUpload(id);
      setUploadUrlInput("");
      setSelectedFileName("");
      setIsUploadModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setSelectedFileName(file.name);
        const reader = new FileReader();
        reader.onloadend = () => {
            setUploadUrlInput(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleTriggerFileSelect = () => {
      fileInputRef.current?.click();
  };

  const confirmUpload = () => {
      if (mantToUpload && uploadUrlInput) {
          setMantenimientos(prev => prev.map(m => m.id_mant === mantToUpload ? { ...m, evidencia_url: uploadUrlInput } : m));
          setIsUploadModalOpen(false);
          setMantToUpload(null);
          setUploadUrlInput('');
          setSelectedFileName('');
      }
  };

  // --- VIEW EVIDENCE LOGIC ---
  const handleViewEvidence = (url: string) => {
      setViewEvidenceUrl(url);
      setIsViewerOpen(true);
  };

  // --- ANULATION LOGIC ---
  const handleOpenAnulate = (id: string) => {
      setMantToAnulate(id);
      setAnulateResponsible('');
      setIsAnulateModalOpen(true); // Paso 1
  };

  const handleProceedToSecondConfirm = () => {
      if (anulateResponsible) {
          setIsAnulateModalOpen(false); // Cierra Paso 1
          setIsAnulateConfirmOpen(true); // Abre Paso 2
      }
  };

  const finalConfirmAnulate = () => {
      if (mantToAnulate && anulateResponsible) {
          setMantenimientos(prev => prev.map(m => 
              m.id_mant === mantToAnulate 
              ? { ...m, estado_mant: 'Anulado', id_dni_anulacion: Number(anulateResponsible) }
              : m
          ));
          setIsAnulateConfirmOpen(false);
          setMantToAnulate(null);
          setAnulateResponsible('');
      }
  };

  // --- BATCH HELPERS ---
  const handleAddDeviceToBatch = () => {
      if (!tempDevice.id_codigo_patrimonial_disp_e) {
          alert("Debe ingresar un Código Patrimonial.");
          return;
      }
      if (selectedDevices.some(d => d.id_codigo_patrimonial_disp_e === tempDevice.id_codigo_patrimonial_disp_e)) {
          alert("Este equipo ya está en la lista.");
          return;
      }
      setSelectedDevices([...selectedDevices, tempDevice]);
      setTempDevice({ id_codigo_patrimonial_disp_e: 0, tipo_dispositivo: 'PC', marca: '', modelo: '', serie: '' });
      setDeviceSearch('');
  };

  const handleRemoveDeviceFromBatch = (code: number) => {
      setSelectedDevices(selectedDevices.filter(d => d.id_codigo_patrimonial_disp_e !== code));
  };

  const handleSearchSelect = (d: Dispositivo) => {
      setTempDevice({
          id_codigo_patrimonial_disp_e: d.id_codigo_patrimonial_disp_e,
          tipo_dispositivo: d.tipo_dispositivo_disp_e,
          marca: d.marca_disp_e,
          modelo: d.modelo_disp_e,
          serie: d.serie_disp_e
      });
      setDeviceSearch(`${d.id_codigo_patrimonial_disp_e} - ${d.tipo_dispositivo_disp_e}`);
  };

  // --- SAVE LOGIC WITH SEQUENTIAL ID GENERATION ---
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDevices.length === 0) {
        alert("Debe agregar al menos un equipo.");
        return;
    }

    const currentTimestamp = Date.now();
    const year = new Date().getFullYear();
    const prefix = `${year}-`;
    const existingIds = mantenimientos.map(m => m.id_mant);
    const currentYearIds = existingIds.filter(id => id.startsWith(prefix));
    
    let maxSeq = 0;
    if (currentYearIds.length > 0) {
        // Extract number part: "2024-0005" -> 5
        maxSeq = Math.max(...currentYearIds.map(id => parseInt(id.split('-')[1])));
    }

    if (modalMode === 'CREATE') {
        
        let newRecords: Mantenimiento[] = [];

        if (reportMode === 'CONSOLIDATED' && selectedDevices.length > 1) {
            // LOGICA CONSOLIDADA (1 REGISTRO PARA N EQUIPOS)
            const newId = `${prefix}${(maxSeq + 1).toString().padStart(4, '0')}`;
            const primaryDevice = selectedDevices[0];
            
            // Generar lista detallada de equipos para el reporte
            const deviceListText = selectedDevices.map((d, i) => 
                `${i + 1}. [${d.id_codigo_patrimonial_disp_e}] ${d.tipo_dispositivo} ${d.marca} (S: ${d.serie})`
            ).join('\n');

            const consolidatedRecord: Mantenimiento = {
                ...formData,
                id_mant: newId,
                created_at: currentTimestamp,
                // Usamos el primer equipo como referencia de base de datos
                id_codigo_patrimonial_disp_e: primaryDevice.id_codigo_patrimonial_disp_e,
                // Indicamos visualmente que es un lote
                tipo_dispositivo_disp_e: 'LOTE CONSOLIDADO',
                marca_manual: 'VARIOS',
                modelo_manual: 'VARIOS',
                serie_manual: 'VER DETALLE',
                // Inyectamos la lista en las actividades para que salga en el PDF
                actividades_realizadas: `** EQUIPOS INTERVENIDOS (${selectedDevices.length}) **\n${deviceListText}\n\n** ACTIVIDADES **\n${formData.actividades_realizadas || ''}`,
                estado_mant: 'Activo'
            } as Mantenimiento;

            newRecords = [consolidatedRecord];

        } else {
            // LOGICA INDIVIDUAL (N REGISTROS PARA N EQUIPOS)
             newRecords = selectedDevices.map((device, index) => {
                const seq = maxSeq + 1 + index;
                const newId = `${prefix}${seq.toString().padStart(4, '0')}`; // e.g. 2024-0001
                
                return {
                    ...formData,
                    id_mant: newId,
                    created_at: currentTimestamp,
                    id_codigo_patrimonial_disp_e: device.id_codigo_patrimonial_disp_e,
                    tipo_dispositivo_disp_e: device.tipo_dispositivo,
                    marca_manual: device.marca,
                    modelo_manual: device.modelo,
                    serie_manual: device.serie,
                    estado_mant: 'Activo'
                } as Mantenimiento;
            });
        }

        setMantenimientos(prev => [...newRecords, ...prev]);
        
        if (reportMode === 'CONSOLIDATED') {
            alert(`Reporte consolidado generado con éxito. N°: ${newRecords[0].id_mant}`);
        } else {
            alert(`Se han generado ${newRecords.length} registros individuales. N° Inicio: ${newRecords[0].id_mant}`);
        }

    } else {
        // EDIT MODE (Solo edita el registro actual, no permite cambiar de individual a masivo en edicion)
        const device = selectedDevices[0];
        const payload = {
            ...formData,
            id_codigo_patrimonial_disp_e: device.id_codigo_patrimonial_disp_e,
            tipo_dispositivo_disp_e: device.tipo_dispositivo,
            marca_manual: device.marca,
            modelo_manual: device.modelo,
            serie_manual: device.serie,
            estado_mant: formData.estado_mant || 'Activo'
        } as Mantenimiento;
        setMantenimientos(prev => prev.map(m => m.id_mant === payload.id_mant ? payload : m));
    }
    setIsModalOpen(false);
  };

  const handleViewGuide = (m: Mantenimiento) => {
      setCurrentMant(m);
      setIsPrintPreviewOpen(true);
  };

  // --- NEW PRINT FUNCTIONALITY ---
  const handlePrint = () => {
      const content = document.getElementById('report-printable-area');
      if (content) {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
              printWindow.document.write(`
              <html>
                  <head>
                      <title>Ficha Técnica - ${currentMant?.id_mant || 'Reporte'}</title>
                      <script src="https://cdn.tailwindcss.com"></script>
                      <style>
                          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                          body { font-family: 'Inter', sans-serif; background: white; }
                          @media print {
                              @page { size: A4; margin: 0.5cm; }
                              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                          }
                      </style>
                  </head>
                  <body class="p-8">
                      ${content.innerHTML}
                      <script>
                          setTimeout(() => {
                              window.print();
                          }, 800);
                      </script>
                  </body>
              </html>
              `);
              printWindow.document.close();
          }
      } else {
          window.print();
      }
  };

  const filteredMantenimientos = mantenimientos.filter(m => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const dev = dispositivos.find(d => d.id_codigo_patrimonial_disp_e === m.id_codigo_patrimonial_disp_e);
      return (
          m.id_mant.toLowerCase().includes(term) ||
          m.diagnostico.toLowerCase().includes(term) ||
          dev?.tipo_dispositivo_disp_e.toLowerCase().includes(term) ||
          m.id_codigo_patrimonial_disp_e.toString().includes(term)
      );
  });

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Operaciones y Mantenimiento</h2>
          <p className="text-gray-500">Registro de atenciones técnicas y soporte</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <input 
                  type="text" 
                  placeholder="Buscar por código, diag..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
             <button onClick={handleOpenCreate} className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-brand-700 shadow-sm whitespace-nowrap transition-colors">
               <Plus size={18}/> 
               <span className="hidden sm:inline">Nuevo Mantenimiento</span>
             </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b">
              <tr>
                <th className="px-6 py-4 text-left">N° Reporte / Fecha</th>
                <th className="px-6 py-4 text-left">Equipo / IPRESS</th>
                <th className="px-6 py-4 text-left">Detalle Técnico</th>
                <th className="px-6 py-4 text-left">Responsable</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredMantenimientos.map(m => {
                const tec = tecnicos.find(t => t.id_dni_tec === m.id_dni_tec_1);
                const disp = dispositivos.find(d => d.id_codigo_patrimonial_disp_e === m.id_codigo_patrimonial_disp_e);
                const marca = m.marca_manual || disp?.marca_disp_e || '-';
                const modelo = m.modelo_manual || disp?.modelo_disp_e || '-';
                const estab = establecimientos.find(e => e.id_codigo_ipress_estab === m.id_codigo_ipress_estab);
                const anulador = m.id_dni_anulacion ? tecnicos.find(t => t.id_dni_tec === m.id_dni_anulacion) : null;

                return (
                  <tr key={m.id_mant} className={`hover:bg-gray-50 ${m.estado_mant === 'Anulado' ? 'bg-red-50 opacity-70' : ''}`}>
                    <td className="px-6 py-4">
                        <div className="font-bold text-gray-800 text-base">{m.id_mant}</div>
                        <div className="text-xs text-gray-500">{m.fecha_mant}</div>
                        {m.estado_mant === 'Anulado' && <span className="text-[10px] font-bold text-red-600 border border-red-200 px-1 rounded bg-red-100">ANULADO</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{m.tipo_dispositivo_disp_e || disp?.tipo_dispositivo_disp_e || 'Equipo'}</div>
                      <div className="text-xs text-brand-600 font-mono">CP: {m.id_codigo_patrimonial_disp_e}</div>
                      <div className="text-[10px] text-gray-500">{marca} {modelo}</div>
                      <div className="text-xs text-gray-500 mt-1">{estab?.nombre_estab}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                       <div className="font-bold text-gray-700 text-xs mb-1 uppercase">{m.tipo_mant}</div>
                       <div className="text-gray-600 truncate" title={m.diagnostico}>{m.diagnostico}</div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-gray-800 font-medium">{tec?.nombre_completo_tec}</div>
                        {anulador && (
                            <div className="text-[10px] text-red-600 mt-1">
                                Anulado por: {anulador.nombre_completo_tec}
                            </div>
                        )}
                    </td>
                    <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                             {m.estado_mant !== 'Anulado' && (
                                 <>
                                    <button onClick={() => handleOpenEdit(m)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded" title="Editar"><Edit size={16}/></button>
                                    <button onClick={() => handleClickDelete(m)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Borrar"><Trash2 size={16}/></button>
                                 </>
                             )}
                             
                             <button onClick={() => handleViewGuide(m)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded" title="Ver Informe PDF"><Printer size={16}/></button>
                             
                             {m.evidencia_url ? (
                                 <button 
                                    onClick={() => handleViewEvidence(m.evidencia_url!)} 
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded" 
                                    title="Ver Cargo Firmado"
                                 >
                                    <Eye size={16}/>
                                 </button>
                             ) : (
                                 m.estado_mant !== 'Anulado' && <button onClick={() => handleOpenUpload(m.id_mant)} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded" title="Adjuntar Cargo"><Upload size={16}/></button>
                             )}

                             {m.estado_mant !== 'Anulado' && (
                                 <button onClick={() => handleOpenAnulate(m.id_mant)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded" title="Anular Mantenimiento"><Ban size={16}/></button>
                             )}
                        </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
        </table>
      </div>

      {/* --- MODAL FORMULARIO DE MANTENIMIENTO --- */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
             <div className="bg-white rounded-xl w-full max-w-5xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                 <div className="flex justify-between items-center border-b pb-4 mb-4">
                     <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                         <Wrench className="text-brand-600"/> {modalMode === 'CREATE' ? 'Nuevo Mantenimiento' : 'Editar Mantenimiento'}
                     </h3>
                     <button onClick={() => setIsModalOpen(false)}><X className="text-gray-400 hover:text-gray-600"/></button>
                 </div>

                 <form onSubmit={handleSave} className="flex-1 overflow-y-auto">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         
                         {/* COLUMNA IZQUIERDA: DATOS GENERALES Y EQUIPOS */}
                         <div className="space-y-4">
                             <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                 <h4 className="font-bold text-xs uppercase text-blue-700 mb-3 flex items-center gap-2"><Clock size={14}/> Datos de Atención</h4>
                                 
                                 <div className="grid grid-cols-2 gap-4 mb-3">
                                     <div>
                                         <label className="block text-xs font-bold text-gray-500 mb-1">Fecha *</label>
                                         <input type="date" required className="w-full border p-2 rounded text-sm" value={formData.fecha_mant} onChange={e => setFormData({...formData, fecha_mant: e.target.value})} />
                                     </div>
                                     <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Tipo *</label>
                                        <select className="w-full border p-2 rounded text-sm" value={formData.tipo_mant} onChange={e => setFormData({...formData, tipo_mant: e.target.value as any})}>
                                            <option value="Correctivo">Correctivo</option>
                                            <option value="Preventivo">Preventivo</option>
                                        </select>
                                     </div>
                                 </div>

                                 <label className="block text-xs font-bold text-gray-500 mb-1">Establecimiento (IPRESS) *</label>
                                 <select required className="w-full border p-2 rounded mb-3 text-sm" value={formData.id_codigo_ipress_estab || ''} onChange={e => setFormData({...formData, id_codigo_ipress_estab: parseInt(e.target.value)})}>
                                     <option value="">-- Seleccionar --</option>
                                     {establecimientos.map(e => <option key={e.id_codigo_ipress_estab} value={e.id_codigo_ipress_estab}>{e.nombre_estab}</option>)}
                                 </select>

                                 <h4 className="font-bold text-xs uppercase text-gray-500 mt-4 mb-2">Personal Técnico</h4>
                                 <div className="grid grid-cols-2 gap-2">
                                     {[1, 2, 3, 4].map(num => (
                                         <select 
                                             key={num}
                                             className="w-full border p-2 rounded text-xs"
                                             value={formData[`id_dni_tec_${num}` as keyof Mantenimiento] as number || ''}
                                             onChange={e => setFormData({ ...formData, [`id_dni_tec_${num}`]: e.target.value ? parseInt(e.target.value) : undefined })}
                                             required={num === 1}
                                         >
                                             <option value="">Técnico {num} {num === 1 && '*'}</option>
                                             {tecnicos.map(t => <option key={t.id_dni_tec} value={t.id_dni_tec}>{t.nombre_completo_tec}</option>)}
                                         </select>
                                     ))}
                                 </div>
                             </div>
                             
                             <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                 <h4 className="font-bold text-xs uppercase text-gray-500 mb-3 flex items-center gap-2"><Laptop size={14}/> Equipos a Intervenir ({selectedDevices.length})</h4>
                                 
                                 {/* --- SELECTOR DE MODO DE REPORTE (SOLO SI HAY MAS DE 1 EQUIPO) --- */}
                                 {selectedDevices.length > 1 && modalMode === 'CREATE' && (
                                     <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mb-4 animate-fade-in">
                                         <label className="font-bold text-xs uppercase text-yellow-700 block mb-2 flex items-center gap-1"><Layers size={14}/> ¿Cómo desea generar los reportes?</label>
                                         <div className="flex gap-4">
                                             <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                                                 <input 
                                                    type="radio" 
                                                    name="reportMode" 
                                                    checked={reportMode === 'INDIVIDUAL'} 
                                                    onChange={() => setReportMode('INDIVIDUAL')}
                                                    className="text-brand-600 focus:ring-brand-500"
                                                 />
                                                 <span className="flex items-center gap-1"><FileText size={12}/> Individuales (1 por equipo)</span>
                                             </label>
                                             <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                                                 <input 
                                                    type="radio" 
                                                    name="reportMode" 
                                                    checked={reportMode === 'CONSOLIDATED'} 
                                                    onChange={() => setReportMode('CONSOLIDATED')}
                                                    className="text-brand-600 focus:ring-brand-500"
                                                 />
                                                 <span className="flex items-center gap-1"><FileStack size={12}/> Consolidado (1 Acta General)</span>
                                             </label>
                                         </div>
                                     </div>
                                 )}
                                 
                                 {modalMode === 'CREATE' && (
                                     <div className="bg-white p-3 rounded border mb-3 shadow-sm">
                                         <label className="block text-xs font-bold text-gray-400 mb-1">Buscar o Ingresar Código *</label>
                                         <div className="relative mb-2">
                                            <input 
                                                type="number" 
                                                placeholder="Ej. 741258" 
                                                className="w-full border p-2 rounded text-sm font-mono" 
                                                value={tempDevice.id_codigo_patrimonial_disp_e || ''}
                                                onChange={e => {
                                                    const val = parseInt(e.target.value);
                                                    setTempDevice({...tempDevice, id_codigo_patrimonial_disp_e: val});
                                                    setDeviceSearch(e.target.value);
                                                }}
                                            />
                                            {deviceSearch && !selectedDevices.some(d => d.id_codigo_patrimonial_disp_e === tempDevice.id_codigo_patrimonial_disp_e) && (
                                                <div className="absolute z-10 w-full bg-white border mt-1 rounded shadow-lg max-h-40 overflow-y-auto">
                                                    {dispositivos.filter(d => d.id_codigo_patrimonial_disp_e.toString().includes(deviceSearch)).map(d => (
                                                        <div 
                                                            key={d.id_codigo_patrimonial_disp_e} 
                                                            className="p-2 hover:bg-gray-100 cursor-pointer text-xs"
                                                            onClick={() => handleSearchSelect(d)}
                                                        >
                                                            <span className="font-bold">{d.id_codigo_patrimonial_disp_e}</span> - {d.tipo_dispositivo_disp_e} ({d.marca_disp_e})
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                         </div>

                                         <div className="grid grid-cols-2 gap-2 mb-2">
                                             <input type="text" placeholder="Tipo (PC, Imp...)" className="w-full border p-2 rounded text-xs" value={tempDevice.tipo_dispositivo} onChange={e => setTempDevice({...tempDevice, tipo_dispositivo: e.target.value})} />
                                             <input type="text" placeholder="Marca" className="w-full border p-2 rounded text-xs" value={tempDevice.marca} onChange={e => setTempDevice({...tempDevice, marca: e.target.value})} />
                                         </div>
                                         <div className="grid grid-cols-2 gap-2 mb-2">
                                             <input type="text" placeholder="Modelo" className="w-full border p-2 rounded text-xs" value={tempDevice.modelo} onChange={e => setTempDevice({...tempDevice, modelo: e.target.value})} />
                                             <input type="text" placeholder="Serie" className="w-full border p-2 rounded text-xs" value={tempDevice.serie} onChange={e => setTempDevice({...tempDevice, serie: e.target.value})} />
                                         </div>
                                         
                                         <button type="button" onClick={handleAddDeviceToBatch} className="w-full bg-slate-800 text-white py-1.5 rounded text-xs hover:bg-slate-900 flex justify-center items-center gap-1">
                                             <Plus size={12}/> Agregar a la Lista
                                         </button>
                                     </div>
                                 )}

                                 <div className="max-h-48 overflow-y-auto space-y-2">
                                     {selectedDevices.map(d => (
                                         <div key={d.id_codigo_patrimonial_disp_e} className="flex justify-between items-center bg-white p-2 border rounded shadow-sm text-xs">
                                             <div>
                                                 <div className="font-bold text-brand-600">{d.id_codigo_patrimonial_disp_e}</div>
                                                 <div className="text-gray-500">{d.tipo_dispositivo} {d.marca} {d.modelo}</div>
                                             </div>
                                             {modalMode === 'CREATE' && (
                                                <button type="button" onClick={() => handleRemoveDeviceFromBatch(d.id_codigo_patrimonial_disp_e)} className="text-red-400 hover:text-red-600">
                                                    <X size={14}/>
                                                </button>
                                             )}
                                         </div>
                                     ))}
                                     {selectedDevices.length === 0 && <div className="text-center text-gray-400 text-xs italic py-2">Sin equipos agregados.</div>}
                                 </div>
                             </div>
                         </div>
                         
                         {/* COLUMNA DERECHA: INFORME TECNICO */}
                         <div className="space-y-4">
                             <div className="bg-white p-4 rounded-lg border border-gray-200 h-full flex flex-col">
                                 <h4 className="font-bold text-xs uppercase text-gray-600 mb-3">Detalle del Servicio</h4>
                                 <label className="block text-xs font-bold text-gray-500 mb-1">Motivo Visita Técnica</label>
                                 <textarea required className="w-full border p-2 rounded mb-2 text-sm h-16 bg-gray-50 focus:bg-white" value={formData.motivo_visita_tecnica} onChange={e => setFormData({...formData, motivo_visita_tecnica: e.target.value})} placeholder="Ej. Equipo lento..." />
                                 <label className="block text-xs font-bold text-gray-500 mb-1">Diagnóstico Técnico</label>
                                 <textarea required className="w-full border p-2 rounded mb-2 text-sm h-20 bg-gray-50 focus:bg-white" value={formData.diagnostico} onChange={e => setFormData({...formData, diagnostico: e.target.value})} placeholder="Ej. Falla en disco duro..." />
                                 <label className="block text-xs font-bold text-gray-500 mb-1">Actividades Realizadas</label>
                                 <textarea required className="w-full border p-2 rounded mb-2 text-sm h-24 bg-gray-50 focus:bg-white" value={formData.actividades_realizadas} onChange={e => setFormData({...formData, actividades_realizadas: e.target.value})} placeholder="Ej. Limpieza de temporales..." />
                                 <div className="grid grid-cols-2 gap-4">
                                     <div>
                                         <label className="block text-xs font-bold text-gray-500 mb-1">Materiales</label>
                                         <textarea className="w-full border p-2 rounded text-sm h-16 bg-gray-50 focus:bg-white" value={formData.materiales_utilizados} onChange={e => setFormData({...formData, materiales_utilizados: e.target.value})} placeholder="Ninguno" />
                                     </div>
                                     <div>
                                         <label className="block text-xs font-bold text-gray-500 mb-1">Recomendaciones</label>
                                         <textarea className="w-full border p-2 rounded text-sm h-16 bg-gray-50 focus:bg-white" value={formData.recomendaciones} onChange={e => setFormData({...formData, recomendaciones: e.target.value})} />
                                     </div>
                                 </div>
                                 <div className="mt-4 pt-4 border-t border-gray-100">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Conformidad Usuario (Nombre)</label>
                                    <input type="text" className="w-full border p-2 rounded text-sm bg-gray-50 focus:bg-white" placeholder="Quien recibe el servicio" value={formData.nombre_personal_conformidad || ''} onChange={e => setFormData({...formData, nombre_personal_conformidad: e.target.value})} />
                                 </div>
                             </div>
                         </div>
                     </div>
                     <div className="mt-6 flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
                         <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                         <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 flex items-center gap-2 font-medium shadow-lg">
                             <Save size={18}/> {modalMode === 'CREATE' ? 'Guardar Reportes' : 'Guardar Cambios'}
                         </button>
                     </div>
                 </form>
             </div>
          </div>
      )}

      {/* --- MODAL DE ERROR AL BORRAR (TIEMPO EXCEDIDO) --- */}
      {isDeleteErrorOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] backdrop-blur-sm">
              <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl text-center">
                  <div className="flex justify-center mb-4">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <AlertCircle className="text-red-600" size={24} />
                      </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Acción Denegada</h3>
                  <p className="text-sm text-gray-600 mb-6">
                      NO SE PUEDE BORRAR EL REGISTRO POR QUE HA SUPERO EL TIEMPO LIMITE DE MEDIA HORA DESDE LA CREACION DEL MISMO.
                  </p>
                  <button onClick={() => setIsDeleteErrorOpen(false)} className="w-full py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
                      Entendido
                  </button>
              </div>
          </div>
      )}

      {/* --- MODAL CONFIRMACION DE BORRADO (DENTRO DE TIEMPO) --- */}
      {isDeleteConfirmOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] backdrop-blur-sm">
              <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">¿Eliminar Registro?</h3>
                  <p className="text-sm text-gray-600 mb-6">Esta acción borrará el mantenimiento permanentemente. Solo permitido dentro de los primeros 30 minutos.</p>
                  <div className="flex gap-2 justify-end">
                      <button onClick={() => setIsDeleteConfirmOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">Cancelar</button>
                      <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Eliminar</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL SUBIR EVIDENCIA (CON SELECTOR DE ARCHIVO) --- */}
      {isUploadModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] backdrop-blur-sm">
              <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Upload size={20}/> Adjuntar Cargo Firmado</h3>
                  
                  {/* Hidden File Input */}
                  <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="application/pdf,image/*"
                      className="hidden"
                  />

                  {/* Custom Upload Area */}
                  <div 
                      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 hover:border-brand-400 transition-colors mb-4"
                      onClick={handleTriggerFileSelect}
                  >
                      {selectedFileName ? (
                          <div className="flex flex-col items-center text-brand-600">
                              <FileCheck size={48} className="mb-2"/>
                              <p className="font-bold text-sm break-all">{selectedFileName}</p>
                              <p className="text-xs text-gray-500 mt-1">Clic para cambiar archivo</p>
                          </div>
                      ) : (
                          <div className="flex flex-col items-center text-gray-400">
                              <FileUp size={48} className="mb-2"/>
                              <p className="font-bold text-sm">Seleccionar Documento</p>
                              <p className="text-xs mt-1">PDF o Imagen (Escaneo)</p>
                          </div>
                      )}
                  </div>

                  <div className="flex gap-2 justify-end">
                      <button onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                      <button 
                        onClick={confirmUpload} 
                        disabled={!uploadUrlInput}
                        className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Guardar Documento
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL ANULACION PASO 1: RESPONSABLE --- */}
      {isAnulateModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] backdrop-blur-sm">
              <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl">
                  <div className="flex items-center gap-3 mb-4 text-orange-600">
                      <AlertTriangle size={32} />
                      <h3 className="text-lg font-bold">Solicitud de Anulación</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Seleccione el personal que autoriza la anulación.</p>
                  <div className="mb-6">
                      <select className="w-full p-2 border rounded-lg bg-gray-50" value={anulateResponsible} onChange={(e) => setAnulateResponsible(parseInt(e.target.value))}>
                          <option value="">-- Seleccionar --</option>
                          {tecnicos.map(t => <option key={t.id_dni_tec} value={t.id_dni_tec}>{t.nombre_completo_tec}</option>)}
                      </select>
                  </div>
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setIsAnulateModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                      <button onClick={handleProceedToSecondConfirm} disabled={!anulateResponsible} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50">Continuar</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL ANULACION PASO 2: CONFIRMACION CRITICA --- */}
      {isAnulateConfirmOpen && (
          <div className="fixed inset-0 bg-red-900/80 flex items-center justify-center z-[90] backdrop-blur-md">
              <div className="bg-white rounded-xl w-full max-w-md p-8 shadow-2xl text-center border-4 border-red-600">
                  <div className="flex justify-center mb-6">
                      <Ban size={64} className="text-red-600" />
                  </div>
                  <h2 className="text-2xl font-black text-red-700 mb-4 uppercase tracking-wider">¡Advertencia!</h2>
                  <p className="text-lg font-bold text-gray-800 mb-2">¿ESTÁS SEGURO QUE DESEAS ANULAR ESTE REGISTRO?</p>
                  <p className="text-sm text-gray-500 mb-8">Esta acción quedará registrada en el historial de auditoría y no se puede deshacer.</p>
                  
                  <div className="flex gap-4 justify-center">
                      <button onClick={() => setIsAnulateConfirmOpen(false)} className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 w-1/2">CANCELAR</button>
                      <button onClick={finalConfirmAnulate} className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 w-1/2 shadow-lg transform hover:scale-105 transition-all">SÍ, ANULAR</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL VISOR DE EVIDENCIA (FIXED BLOB URL + OBJECT + FALLBACK) --- */}
      {isViewerOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
                  <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-gray-700 flex items-center gap-2"><Eye size={20}/> Visualizador de Documentos</h3>
                      <div className="flex items-center gap-2">
                           {/* Botón para abrir en nueva pestaña (Solución definitiva a bloqueos) */}
                          <a href={blobUrl} target="_blank" rel="noreferrer" className="bg-brand-600 text-white px-3 py-1.5 rounded text-sm hover:bg-brand-700 flex items-center gap-1">
                              <FileText size={16}/> Abrir en Nueva Pestaña
                          </a>
                          <a href={viewEvidenceUrl} download="evidencia.pdf" className="text-brand-600 hover:text-brand-800 p-2"><Download size={20}/></a>
                          <button onClick={() => setIsViewerOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={24}/></button>
                      </div>
                  </div>
                  <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-auto p-4">
                      {blobUrl ? (
                          viewEvidenceUrl.startsWith('data:image') ? (
                              <img src={blobUrl} alt="Evidencia" className="max-w-full max-h-full object-contain shadow-lg rounded" />
                          ) : (
                              <object data={blobUrl} type="application/pdf" className="w-full h-full border rounded shadow-lg bg-white">
                                  <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                                      <AlertCircle size={48} className="text-orange-400"/>
                                      <p>El navegador no puede mostrar este archivo aquí.</p>
                                      <a href={blobUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700">
                                          Abrir documento en ventana nueva
                                      </a>
                                  </div>
                              </object>
                          )
                      ) : (
                          <div className="text-gray-400 flex flex-col items-center"><Clock className="animate-spin mb-2"/> Cargando documento...</div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* --- PRINT PREVIEW --- */}
      {isPrintPreviewOpen && currentMant && (
          <div className="fixed inset-0 z-[60] bg-gray-900 overflow-y-auto">
             <div className="min-h-screen flex items-center justify-center p-4">
                 <div className="bg-white w-full max-w-[21cm] min-h-[29.7cm] shadow-2xl mx-auto p-12 relative print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0">
                     <div className="absolute top-4 right-4 flex gap-2 no-print">
                         <button onClick={() => setIsPrintPreviewOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Cerrar</button>
                         <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"><Printer size={16}/> Imprimir</button>
                     </div>
                     <div id="report-printable-area" className="print-content text-gray-900">
                         <div className="text-center border-b-2 border-black pb-4 mb-6">
                             <h1 className="text-2xl font-bold uppercase tracking-widest">Ficha Técnica de Mantenimiento</h1>
                             <p className="text-sm mt-1">Oficina de Gestión de TI - Soporte Técnico</p>
                             <div className="mt-2 font-mono text-sm border border-black inline-block px-2">N° REPORTE: {currentMant.id_mant}</div>
                         </div>
                         <div className="grid grid-cols-2 gap-0 border border-black mb-6">
                             <div className="p-2 border-r border-black border-b"><span className="font-bold text-xs uppercase block text-gray-500">Fecha Atención</span>{currentMant.fecha_mant}</div>
                             <div className="p-2 border-b border-black"><span className="font-bold text-xs uppercase block text-gray-500">Tipo Mantenimiento</span>{currentMant.tipo_mant.toUpperCase()}</div>
                             <div className="p-2 border-r border-black border-b col-span-2 bg-gray-50"><span className="font-bold text-xs uppercase block text-gray-500">Establecimiento / IPRESS</span>{establecimientos.find(e => e.id_codigo_ipress_estab === currentMant.id_codigo_ipress_estab)?.nombre_estab}</div>
                             <div className="p-2 border-r border-black"><span className="font-bold text-xs uppercase block text-gray-500">Código Patrimonial</span><span className="font-mono text-lg font-bold">{currentMant.id_codigo_patrimonial_disp_e}</span></div>
                             <div className="p-2"><span className="font-bold text-xs uppercase block text-gray-500">Equipo</span>{currentMant.tipo_dispositivo_disp_e || dispositivos.find(d => d.id_codigo_patrimonial_disp_e === currentMant.id_codigo_patrimonial_disp_e)?.tipo_dispositivo_disp_e}<div className="text-xs mt-1">{currentMant.marca_manual} / {currentMant.modelo_manual} / {currentMant.serie_manual}</div></div>
                         </div>
                         <div className="mb-6 space-y-4">
                             <div className="border border-black p-4 min-h-[3cm]"><h3 className="font-bold border-b border-black mb-2 uppercase text-xs">Motivo de Visita</h3><p className="text-sm whitespace-pre-wrap">{currentMant.motivo_visita_tecnica}</p></div>
                             <div className="border border-black p-4 min-h-[3cm]"><h3 className="font-bold border-b border-black mb-2 uppercase text-xs">Diagnóstico</h3><p className="text-sm whitespace-pre-wrap">{currentMant.diagnostico}</p></div>
                             <div className="border border-black p-4 min-h-[4cm]"><h3 className="font-bold border-b border-black mb-2 uppercase text-xs">Actividades Realizadas</h3><p className="text-sm whitespace-pre-wrap">{currentMant.actividades_realizadas}</p></div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="border border-black p-4"><h3 className="font-bold border-b border-black mb-2 uppercase text-xs">Materiales Utilizados</h3><p className="text-sm whitespace-pre-wrap">{currentMant.materiales_utilizados || 'Ninguno'}</p></div>
                                <div className="border border-black p-4"><h3 className="font-bold border-b border-black mb-2 uppercase text-xs">Recomendaciones</h3><p className="text-sm whitespace-pre-wrap">{currentMant.recomendaciones || 'Ninguna'}</p></div>
                             </div>
                         </div>
                         <div className="mt-12">
                             <h3 className="text-center font-bold uppercase text-xs mb-8">Personal Técnico Responsable</h3>
                             <div className="grid grid-cols-4 gap-4 text-center mb-12">
                                 <div><div className="h-16 border-b border-black mx-2"></div><p className="text-[10px] font-bold mt-1">{tecnicos.find(t => t.id_dni_tec === currentMant.id_dni_tec_1)?.nombre_completo_tec}</p><p className="text-[9px] text-gray-500">Técnico Principal</p></div>
                                 {currentMant.id_dni_tec_2 && (<div><div className="h-16 border-b border-black mx-2"></div><p className="text-[10px] font-bold mt-1">{tecnicos.find(t => t.id_dni_tec === currentMant.id_dni_tec_2)?.nombre_completo_tec}</p><p className="text-[9px] text-gray-500">Técnico 2</p></div>)}
                                 {currentMant.id_dni_tec_3 && (<div><div className="h-16 border-b border-black mx-2"></div><p className="text-[10px] font-bold mt-1">{tecnicos.find(t => t.id_dni_tec === currentMant.id_dni_tec_3)?.nombre_completo_tec}</p><p className="text-[9px] text-gray-500">Técnico 3</p></div>)}
                                 {currentMant.id_dni_tec_4 && (<div><div className="h-16 border-b border-black mx-2"></div><p className="text-[10px] font-bold mt-1">{tecnicos.find(t => t.id_dni_tec === currentMant.id_dni_tec_4)?.nombre_completo_tec}</p><p className="text-[9px] text-gray-500">Técnico 4</p></div>)}
                             </div>
                             <div className="flex justify-center mt-12"><div className="w-1/3 text-center"><div className="h-16 border-b border-black mx-8"></div><p className="text-xs font-bold mt-1 uppercase">{currentMant.nombre_personal_conformidad || 'Personal Usuario'}</p><p className="text-[10px] text-gray-500">Conformidad Usuario (Firma y Sello)</p></div></div>
                         </div>
                     </div>
                 </div>
             </div>
          </div>
      )}
    </div>
  );
};
