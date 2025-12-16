

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Establecimiento, Dispositivo, RedInternet, Ambiente, Insumo, MovimientoInsumo, Tecnico, GuiaSalidaItem, RIS_OPTIONS, Inmueble } from '../types';
import { Building2, Laptop, Network, Plus, Link as LinkIcon, AlertTriangle, Search, X, Edit, Trash2, Save, ShoppingCart, FileText, Printer, Upload, FileCheck, Ban, Calendar, Eye, Download, FileUp, AlertCircle, Clock, Layers, FileStack, RotateCcw, ArrowRightLeft, LayoutGrid, Hammer, History, User, Phone, Mail, CheckSquare, Armchair, ChevronDown } from 'lucide-react';

interface InventoryViewProps {
  establecimientos: Establecimiento[];
  setEstablecimientos: React.Dispatch<React.SetStateAction<Establecimiento[]>>;
  dispositivos: Dispositivo[];
  redes: RedInternet[];
  ambientes: Ambiente[];
  insumos: Insumo[];
  inmuebles: Inmueble[];
  movimientos: MovimientoInsumo[];
  setDispositivos: React.Dispatch<React.SetStateAction<Dispositivo[]>>;
  setRedes: React.Dispatch<React.SetStateAction<RedInternet[]>>;
  setAmbientes: React.Dispatch<React.SetStateAction<Ambiente[]>>;
  setInsumos: React.Dispatch<React.SetStateAction<Insumo[]>>;
  setInmuebles: React.Dispatch<React.SetStateAction<Inmueble[]>>;
  setMovimientos: React.Dispatch<React.SetStateAction<MovimientoInsumo[]>>;
  tecnicos: Tecnico[];
  
  availableServices: string[];
  onAddService: (newService: string) => void;
  
  availableDeviceTypes: string[];
  onAddDeviceType: (newType: string) => void;

  availableFurnitureTypes: string[];
  onAddFurnitureType: (newType: string) => void;
}

const STANDALONE_TYPES = ['PC', 'Laptop', 'All-in-One'];

interface ReturnCandidate {
    movimientoOriginal: MovimientoInsumo;
    insumo: Insumo;
    cantidadOriginal: number;
    cantidadADevolver: number;
    seleccionado: boolean;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ 
  establecimientos, 
  setEstablecimientos,
  dispositivos, 
  redes,
  ambientes,
  insumos,
  inmuebles,
  movimientos,
  setDispositivos,
  setRedes,
  setAmbientes,
  setInsumos,
  setInmuebles,
  setMovimientos,
  tecnicos,
  availableServices,
  onAddService,
  availableDeviceTypes,
  onAddDeviceType,
  availableFurnitureTypes,
  onAddFurnitureType
}) => {
  const [activeTab, setActiveTab] = useState<'ESTAB' | 'DISP' | 'RED' | 'AMB' | 'TOOL' | 'FURN'>('DISP');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  
  // --- DELETE CONFIRMATION STATE ---
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{id: number, type: 'DISP'|'ESTAB'|'RED'|'AMB'|'TOOL'|'FURN'} | null>(null);

  // --- GUIDE / CART STATE ---
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [guideCart, setGuideCart] = useState<GuiaSalidaItem[]>([]);
  const [guideDestination, setGuideDestination] = useState<number | ''>('');
  const [guideTech, setGuideTech] = useState<number | ''>('');
  const [guideReceiver, setGuideReceiver] = useState('');
  const [guideSearchTerm, setGuideSearchTerm] = useState('');
  const [currentGuideNumber, setCurrentGuideNumber] = useState('');
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(false);
  const [isReturnMode, setIsReturnMode] = useState(false); 
  const [guideReportMode, setGuideReportMode] = useState<'INDIVIDUAL' | 'CONSOLIDATED'>('CONSOLIDATED');

  // --- RETURN SELECTION STATE ---
  const [isReturnSelectModalOpen, setIsReturnSelectModalOpen] = useState(false);
  const [returnCandidates, setReturnCandidates] = useState<ReturnCandidate[]>([]);
  const [returnOriginGuide, setReturnOriginGuide] = useState('');
  const [returnDeliveredBy, setReturnDeliveredBy] = useState(''); 
  const [returnReceivedBy, setReturnReceivedBy] = useState('');

  // --- ANULATE / UPLOAD / VIEWER STATE ---
  const [isAnulateModalOpen, setIsAnulateModalOpen] = useState(false);
  const [guideToAnulate, setGuideToAnulate] = useState<string>('');
  const [anulateResponsible, setAnulateResponsible] = useState<number | ''>('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTargetGuide, setUploadTargetGuide] = useState<string | null>(null); 
  const [uploadUrlInput, setUploadUrlInput] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewEvidenceUrl, setViewEvidenceUrl] = useState('');
  const [blobUrl, setBlobUrl] = useState('');

  // --- SEARCH STATES ---
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [movementsSearchTerm, setMovementsSearchTerm] = useState('');
  
  const [parentSearchTerm, setParentSearchTerm] = useState('');
  const [showParentSuggestions, setShowParentSuggestions] = useState(false);

  const [estabSearchTerm, setEstabSearchTerm] = useState('');
  const [showEstabSuggestions, setShowEstabSuggestions] = useState(false);

  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);

  // --- DYNAMIC TYPE SEARCH STATES ---
  const [deviceTypeSearch, setDeviceTypeSearch] = useState('');
  const [showDeviceTypeSuggestions, setShowDeviceTypeSuggestions] = useState(false);
  const deviceTypeRef = useRef<HTMLDivElement>(null);

  const [furnitureTypeSearch, setFurnitureTypeSearch] = useState('');
  const [showFurnitureTypeSuggestions, setShowFurnitureTypeSuggestions] = useState(false);
  const furnitureTypeRef = useRef<HTMLDivElement>(null);

  // --- LOCATION FILTER STATE (FOR FORMS) ---
  const [selectedEstabId, setSelectedEstabId] = useState<number | ''>('');
  // Ambientes filter based on selectedEstabId

  useEffect(() => {
    if (isViewerOpen && viewEvidenceUrl) {
        if (viewEvidenceUrl.startsWith('data:image')) {
            setBlobUrl(viewEvidenceUrl);
        } else {
            try {
                const arr = viewEvidenceUrl.split(',');
                const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
                const bstr = atob(arr[1]);
                let n = (bstr as string).length;
                const u8arr = new Uint8Array(n);
                while(n--){
                    u8arr[n] = bstr.charCodeAt(n);
                }
                const blob = new Blob([u8arr], {type: mime});
                const url = URL.createObjectURL(blob);
                setBlobUrl(url);
                return () => URL.revokeObjectURL(url);
            } catch (e) {
                setBlobUrl(viewEvidenceUrl);
            }
        }
    } else {
        setBlobUrl('');
    }
  }, [viewEvidenceUrl, isViewerOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target as Node)) {
        setShowServiceSuggestions(false);
      }
      if (deviceTypeRef.current && !deviceTypeRef.current.contains(event.target as Node)) {
        setShowDeviceTypeSuggestions(false);
      }
      if (furnitureTypeRef.current && !furnitureTypeRef.current.contains(event.target as Node)) {
        setShowFurnitureTypeSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- FORM STATES ---
  const initialDeviceState: Partial<Dispositivo> = {
    tipo_dispositivo_disp_e: 'PC',
    estado__disp_e: 'Bueno',
    id_amb: undefined,
    anio_patrimonial: new Date().getFullYear(),
    id_codigo_patrimonial_disp_e: undefined,
    codigo_margesi: '',
    marca_disp_e: '',
    modelo_disp_e: '',
    serie_disp_e: ''
  };

  const initialFurnitureState: Partial<Inmueble> = {
      tipo_inmueble: 'Escritorio',
      estado: 'Bueno',
      anio_patrimonial: new Date().getFullYear(),
      codigo_patrimonial: '',
      codigo_margesi: '',
      marca: '',
      modelo: '',
      color: '',
      dimensiones: '',
      id_amb: undefined
  };

  const initialNetworkState: Partial<RedInternet> = {
    proveedor_red: '',
    velocidad_red: '',
    id_codigo_ipress_estab: undefined
  };

  const initialEstabState: Partial<Establecimiento> = {
    nombre_estab: '',
    ris_estab: RIS_OPTIONS[0],
    id_codigo_ipress_estab: undefined,
    medico_jefe: '',
    telefono: '',
    email: '',
    direccion: '',
    coordenadas: ''
  };

  const initialAmbienteState: Partial<Ambiente> = {
    nombre_servicio_amb: '',
    nombre_area_amb: '',
    tipo_ambiente_amb: 'Consultorio',
    toma_electrica_amb: 'Si',
    punto_red_amb: 'Si',
    estado_amb: 'Operativo',
    id_codigo_ipress_estab: undefined
  };

  const initialInsumoState: Partial<Insumo> = {
    nombre_insumo: '',
    tipo_insumo: 'Herramienta',
    cantidad: 1,
    unidad_medida: 'Unidades',
    estado_insumo: 'Nuevo',
    ubicacion_fisica: '',
    marca: '',
    modelo: '',
    serie: '',
    codigo_patrimonial: '',
    anio_patrimonial: new Date().getFullYear(),
    fecha_registro: new Date().toISOString().split('T')[0]
  };

  const [formDevice, setFormDevice] = useState<Partial<Dispositivo>>(initialDeviceState);
  const [formFurniture, setFormFurniture] = useState<Partial<Inmueble>>(initialFurnitureState);
  const [formNetwork, setFormNetwork] = useState<Partial<RedInternet>>(initialNetworkState);
  const [formEstab, setFormEstab] = useState<Partial<Establecimiento>>(initialEstabState);
  const [formAmbiente, setFormAmbiente] = useState<Partial<Ambiente>>(initialAmbienteState);
  const [formInsumo, setFormInsumo] = useState<Partial<Insumo>>(initialInsumoState);

  const [editingId, setEditingId] = useState<string | number | null>(null);

  // --- FILTERS ---
  const filterByTerm = (item: any, term: string) => {
    if (!term) return true;
    const searchStr = term.toLowerCase();
    return Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchStr)
    );
  };

  const filteredDispositivos = useMemo(() => dispositivos.filter(d => filterByTerm(d, globalSearchTerm)), [dispositivos, globalSearchTerm]);
  const filteredInmuebles = useMemo(() => inmuebles.filter(i => filterByTerm(i, globalSearchTerm)), [inmuebles, globalSearchTerm]);
  const filteredEstablecimientos = useMemo(() => establecimientos.filter(e => filterByTerm(e, globalSearchTerm)), [establecimientos, globalSearchTerm]);
  const filteredRedes = useMemo(() => redes.filter(r => filterByTerm(r, globalSearchTerm)), [redes, globalSearchTerm]);
  const filteredAmbientes = useMemo(() => ambientes.filter(a => filterByTerm(a, globalSearchTerm)), [ambientes, globalSearchTerm]);
  const filteredInsumos = useMemo(() => insumos.filter(i => filterByTerm(i, globalSearchTerm)), [insumos, globalSearchTerm]);

  // Filter Movements
  const filteredMovements = useMemo(() => {
    return movimientos.filter(m => {
        if (!movementsSearchTerm) return true;
        const term = movementsSearchTerm.toLowerCase();
        const ins = insumos.find(i => i.id_insumo === m.id_insumo);
        const dest = establecimientos.find(e => e.id_codigo_ipress_estab === m.id_codigo_ipress_estab_destino);
        const emisor = tecnicos.find(t => t.id_dni_tec === m.id_dni_responsable);
        return (
            m.nro_guia?.toLowerCase().includes(term) ||
            m.fecha_movimiento.includes(term) ||
            m.tipo_movimiento.toLowerCase().includes(term) ||
            ins?.nombre_insumo.toLowerCase().includes(term) ||
            dest?.nombre_estab.toLowerCase().includes(term) ||
            emisor?.nombre_completo_tec.toLowerCase().includes(term)
        );
    });
  }, [movimientos, movementsSearchTerm, insumos, establecimientos, tecnicos]);

  const groupedMovements = useMemo(() => {
    const groups: Record<string, MovimientoInsumo[]> = {};
    filteredMovements.forEach(m => {
        const key = m.nro_guia ? m.nro_guia : `single-${m.id_movimiento}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(m);
    });
    return groups;
  }, [filteredMovements]);

  // For Device Parent Affiliation
  const availableParents = useMemo(() => dispositivos.filter(d => STANDALONE_TYPES.includes(d.tipo_dispositivo_disp_e)), [dispositivos]);
  
  // Filter parents by Code, Type, Brand AND MODEL
  const filteredParents = useMemo(() => {
    if (!parentSearchTerm) return availableParents;
    const term = parentSearchTerm.toLowerCase();
    return availableParents.filter(p => 
      p.id_codigo_patrimonial_disp_e.toString().includes(term) ||
      p.tipo_dispositivo_disp_e.toLowerCase().includes(term) ||
      p.marca_disp_e.toLowerCase().includes(term) ||
      p.modelo_disp_e.toLowerCase().includes(term) // Added model search
    );
  }, [availableParents, parentSearchTerm]);

  // Dropdown Lists filtering
  const filteredServices = useMemo(() => {
    if (!serviceSearchTerm) return availableServices;
    return availableServices.filter(s => s.toLowerCase().includes(serviceSearchTerm.toLowerCase()));
  }, [serviceSearchTerm, availableServices]);

  const filteredDeviceTypes = useMemo(() => {
      if (!deviceTypeSearch) return availableDeviceTypes;
      return availableDeviceTypes.filter(t => t.toLowerCase().includes(deviceTypeSearch.toLowerCase()));
  }, [deviceTypeSearch, availableDeviceTypes]);

  const filteredFurnitureTypes = useMemo(() => {
      if (!furnitureTypeSearch) return availableFurnitureTypes;
      return availableFurnitureTypes.filter(t => t.toLowerCase().includes(furnitureTypeSearch.toLowerCase()));
  }, [furnitureTypeSearch, availableFurnitureTypes]);

  const filteredEstabForSearch = useMemo(() => {
      if (!estabSearchTerm) return establecimientos;
      return establecimientos.filter(e => e.nombre_estab.toLowerCase().includes(estabSearchTerm.toLowerCase()) || e.id_codigo_ipress_estab.toString().includes(estabSearchTerm));
  }, [establecimientos, estabSearchTerm]);

  // Ambientes for current selected Establishment in Form
  const formAmbientesList = useMemo(() => {
      if (!selectedEstabId) return [];
      return ambientes.filter(a => a.id_codigo_ipress_estab === selectedEstabId);
  }, [selectedEstabId, ambientes]);


  // Determine if device is peripheral dynamically based on INPUT SEARCH
  const isPeripheral = useMemo(() => {
      const type = deviceTypeSearch || 'PC'; // Check against what user is typing/selecting
      // If NOT in the standalone list, it IS a peripheral (needs parent)
      return !STANDALONE_TYPES.includes(type);
  }, [deviceTypeSearch]);


  // --- ACTIONS ---

  const openCreateModal = () => {
    setModalMode('CREATE');
    setEditingId(null);
    setFormDevice(initialDeviceState);
    setFormFurniture(initialFurnitureState);
    setFormNetwork(initialNetworkState);
    setFormEstab(initialEstabState);
    setFormAmbiente(initialAmbienteState);
    setFormInsumo(initialInsumoState);
    
    setParentSearchTerm('');
    setServiceSearchTerm('');
    setEstabSearchTerm('');
    setDeviceTypeSearch('');
    setFurnitureTypeSearch('');
    
    setSelectedEstabId('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: any, type: typeof activeTab) => {
    setModalMode('EDIT');
    setActiveTab(type);
    
    if (type === 'DISP') {
        setEditingId(item.id_codigo_patrimonial_disp_e);
        setFormDevice({ ...item });
        setDeviceTypeSearch(item.tipo_dispositivo_disp_e);
        // Set location logic
        const amb = ambientes.find(a => a.id_amb === item.id_amb);
        if (amb) {
            setSelectedEstabId(amb.id_codigo_ipress_estab);
        }
        // Set Parent logic
        if (item.cod_patrimonial_padre) {
             const parent = dispositivos.find(d => d.id_codigo_patrimonial_disp_e === item.cod_patrimonial_padre);
             if (parent) setParentSearchTerm(`${parent.tipo_dispositivo_disp_e} - ${parent.marca_disp_e} ${parent.modelo_disp_e} (CP: ${parent.id_codigo_patrimonial_disp_e})`);
        }
    }
    else if (type === 'FURN') {
        setEditingId(item.id_inmueble);
        setFormFurniture({ ...item });
        setFurnitureTypeSearch(item.tipo_inmueble);
        const amb = ambientes.find(a => a.id_amb === item.id_amb);
        if (amb) {
            setSelectedEstabId(amb.id_codigo_ipress_estab);
        }
    }
    else if (type === 'ESTAB') {
        setEditingId(item.id_codigo_ipress_estab);
        setFormEstab({ ...item });
    }
    else if (type === 'RED') {
        setEditingId(item.id_red);
        setFormNetwork({ ...item });
        const estab = establecimientos.find(e => e.id_codigo_ipress_estab === item.id_codigo_ipress_estab);
        setEstabSearchTerm(estab?.nombre_estab || '');
    }
    else if (type === 'AMB') {
        setEditingId(item.id_amb);
        setFormAmbiente({ ...item });
        setServiceSearchTerm(item.nombre_servicio_amb || '');
        const estab = establecimientos.find(e => e.id_codigo_ipress_estab === item.id_codigo_ipress_estab);
        setEstabSearchTerm(estab?.nombre_estab || '');
    }
    else if (type === 'TOOL') {
        setEditingId(item.id_insumo);
        setFormInsumo({ ...item });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id: number, type: typeof activeTab) => {
    setDeleteTarget({ id, type });
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
      if (!deleteTarget) return;
      const { id, type } = deleteTarget;

      if (type === 'DISP') setDispositivos(prev => prev.filter(d => d.id_codigo_patrimonial_disp_e !== id));
      else if (type === 'FURN') setInmuebles(prev => prev.filter(i => i.id_inmueble !== id));
      else if (type === 'ESTAB') setEstablecimientos(prev => prev.filter(e => e.id_codigo_ipress_estab !== id));
      else if (type === 'RED') setRedes(prev => prev.filter(r => r.id_red !== id));
      else if (type === 'AMB') setAmbientes(prev => prev.filter(a => a.id_amb !== id));
      else if (type === 'TOOL') setInsumos(prev => prev.filter(i => i.id_insumo !== id));

      setIsDeleteConfirmOpen(false);
      setDeleteTarget(null);
  };

  // --- SAVE LOGIC ---
  const handleSaveAny = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (activeTab === 'ESTAB') {
          const payload = formEstab as Establecimiento;
          setEstablecimientos(prev => modalMode === 'EDIT' ? prev.map(x => x.id_codigo_ipress_estab === editingId ? payload : x) : [...prev, payload]);
      } else if (activeTab === 'DISP') {
          // CHECK PARENT AFFILIATION REQUIREMENT
          const currentType = deviceTypeSearch;
          const isPeri = !STANDALONE_TYPES.includes(currentType);

          if (isPeri && !formDevice.cod_patrimonial_padre) {
              alert("Error: Este dispositivo es un periférico. Debe afiliarlo obligatoriamente a un equipo principal (PC, Laptop, All-in-One).");
              return;
          }

          const payload = {
              ...formDevice, 
              tipo_dispositivo_disp_e: deviceTypeSearch, // Use dynamic input
              cod_patrimonial_padre: isPeri ? formDevice.cod_patrimonial_padre : undefined,
              anio_patrimonial_padre: isPeri ? formDevice.anio_patrimonial_padre : undefined
          } as Dispositivo;
          setDispositivos(prev => modalMode === 'EDIT' ? prev.map(x => x.id_codigo_patrimonial_disp_e === editingId ? payload : x) : [...prev, payload]);
      } else if (activeTab === 'FURN') {
          const payload = {
              ...formFurniture,
              id_inmueble: modalMode === 'EDIT' ? (editingId as number) : Math.floor(Math.random()*100000),
              tipo_inmueble: furnitureTypeSearch
          } as Inmueble;
          setInmuebles(prev => modalMode === 'EDIT' ? prev.map(x => x.id_inmueble === editingId ? payload : x) : [...prev, payload]);
      } else if (activeTab === 'RED') {
          const payload = { ...formNetwork, id_red: modalMode === 'EDIT' ? editingId : Date.now() } as RedInternet;
          setRedes(prev => modalMode === 'EDIT' ? prev.map(x => x.id_red === editingId ? payload : x) : [...prev, payload]);
      } else if (activeTab === 'AMB') {
          const payload = { ...formAmbiente, id_amb: modalMode === 'EDIT' ? editingId : Date.now() } as Ambiente;
          setAmbientes(prev => modalMode === 'EDIT' ? prev.map(x => x.id_amb === editingId ? payload : x) : [...prev, payload]);
      } else if (activeTab === 'TOOL') {
           const payload = { 
               ...formInsumo, 
               id_insumo: modalMode === 'EDIT' ? editingId : Date.now(),
               fecha_registro: modalMode === 'CREATE' ? new Date().toISOString().split('T')[0] : (formInsumo.fecha_registro || new Date().toISOString().split('T')[0])
            } as Insumo;
           setInsumos(prev => modalMode === 'EDIT' ? prev.map(x => x.id_insumo === editingId ? payload : x) : [...prev, payload]);
      }
      setIsModalOpen(false);
  };

  const handleSelectParent = (parent: Dispositivo) => {
    setFormDevice({
      ...formDevice,
      cod_patrimonial_padre: parent.id_codigo_patrimonial_disp_e,
      anio_patrimonial_padre: parent.anio_patrimonial
    });
    setParentSearchTerm(`${parent.tipo_dispositivo_disp_e} - ${parent.marca_disp_e} ${parent.modelo_disp_e} (CP: ${parent.id_codigo_patrimonial_disp_e})`);
    setShowParentSuggestions(false);
  };

  const handleSelectEstab = (estab: Establecimiento) => {
      setEstabSearchTerm(estab.nombre_estab);
      if (activeTab === 'RED') setFormNetwork({...formNetwork, id_codigo_ipress_estab: estab.id_codigo_ipress_estab});
      if (activeTab === 'AMB') setFormAmbiente({...formAmbiente, id_codigo_ipress_estab: estab.id_codigo_ipress_estab});
      setShowEstabSuggestions(false);
  };
  
  const handleManualAddService = () => {
      if (serviceSearchTerm) {
          onAddService(serviceSearchTerm);
          setFormAmbiente({...formAmbiente, nombre_servicio_amb: serviceSearchTerm});
          setShowServiceSuggestions(false);
      }
  };

  const handleManualAddDeviceType = () => {
      if (deviceTypeSearch) {
          onAddDeviceType(deviceTypeSearch);
          setFormDevice({...formDevice, tipo_dispositivo_disp_e: deviceTypeSearch});
          setShowDeviceTypeSuggestions(false);
      }
  };

  const handleManualAddFurnitureType = () => {
      if (furnitureTypeSearch) {
          onAddFurnitureType(furnitureTypeSearch);
          setFormFurniture({...formFurniture, tipo_inmueble: furnitureTypeSearch});
          setShowFurnitureTypeSuggestions(false);
      }
  };

  // --- GUIDE & RETURN LOGIC (unchanged from previous version mostly) ---
  const handleAddToGuide = (insumo: Insumo) => {
      if (insumo.cantidad <= 0) {
          if (insumo.tipo_insumo === 'Herramienta') {
              alert(`⚠️ No disponible: La herramienta "${insumo.nombre_insumo}" figura como prestada o no devuelta.`);
          } else {
              alert(`⚠️ Stock Agotado: No hay unidades disponibles de "${insumo.nombre_insumo}".`);
          }
          return;
      }
      const exists = guideCart.find(item => item.insumo.id_insumo === insumo.id_insumo);
      if (!exists) setGuideCart([...guideCart, { insumo, cantidad: 1 }]);
  };

  const removeFromGuide = (id: number) => {
      setGuideCart(guideCart.filter(item => item.insumo.id_insumo !== id));
  };
  
  const handleUpdateCartQuantity = (id: number, newQty: number) => {
      const item = guideCart.find(x => x.insumo.id_insumo === id);
      if (!item) return;
      if (newQty > item.insumo.cantidad) {
          alert(`Error: Stock insuficiente.`);
          return;
      }
      if (newQty < 1) newQty = 1;
      setGuideCart(guideCart.map(x => x.insumo.id_insumo === id ? { ...x, cantidad: newQty } : x));
  };

  const handleGenerateNewGuide = () => {
    setIsViewOnlyMode(false);
    setIsReturnMode(false);
    setCurrentGuideNumber(`G-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`);
    setGuideCart([]);
    setGuideDestination('');
    setGuideTech('');
    setGuideReceiver('');
    setGuideReportMode('CONSOLIDATED');
    setIsGuideModalOpen(true);
  };

  const handleOpenReturnModal = (guideNum: string) => {
      const relatedMovements = movimientos.filter(m => m.nro_guia === guideNum && m.tipo_movimiento === 'Salida' && m.estado_movimiento !== 'Anulado');
      if (relatedMovements.length === 0) {
          alert("No se encontraron ítems activos para devolver de esta guía.");
          return;
      }
      const candidates: ReturnCandidate[] = relatedMovements.map(m => {
          const ins = insumos.find(i => i.id_insumo === m.id_insumo)!;
          return {
              movimientoOriginal: m,
              insumo: ins,
              cantidadOriginal: m.cantidad,
              cantidadADevolver: m.cantidad,
              seleccionado: true
          };
      });
      setReturnCandidates(candidates);
      setReturnOriginGuide(guideNum);
      setReturnDeliveredBy('');
      setReturnReceivedBy('');
      setIsReturnSelectModalOpen(true);
  };

  const handleToggleCandidate = (index: number) => {
      const updated = [...returnCandidates];
      updated[index].seleccionado = !updated[index].seleccionado;
      setReturnCandidates(updated);
  };

  const handleUpdateCandidateQty = (index: number, val: number) => {
      const updated = [...returnCandidates];
      if (val > updated[index].cantidadOriginal) val = updated[index].cantidadOriginal;
      if (val < 1) val = 1;
      updated[index].cantidadADevolver = val;
      setReturnCandidates(updated);
  };

  const handleProceedToReturnPreview = () => {
      const selected = returnCandidates.filter(c => c.seleccionado);
      if (selected.length === 0) { alert("Seleccione al menos un ítem."); return; }
      if (!returnDeliveredBy) { alert("Indique quién devuelve."); return; }
      if (!returnReceivedBy) { alert("Indique quién recepciona."); return; }

      const cart: GuiaSalidaItem[] = selected.map(c => ({ insumo: c.insumo, cantidad: c.cantidadADevolver }));
      setGuideCart(cart);

      const firstMov = selected[0].movimientoOriginal;
      setGuideDestination(firstMov.id_codigo_ipress_estab_destino || '');
      setGuideTech(firstMov.id_dni_responsable || '');
      setGuideReceiver(returnReceivedBy); 
      setCurrentGuideNumber(`DEV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`);
      setIsReturnMode(true);
      setIsViewOnlyMode(false);
      setIsReturnSelectModalOpen(false); 
      setIsPrintPreviewOpen(true);
  };

  const handleConfirmGuide = () => {
      const date = new Date().toISOString().split('T')[0];
      const time = new Date().toLocaleTimeString('es-ES', { hour12: false });
      let newMovements: MovimientoInsumo[] = [];
      const isReturn = isReturnMode;

      if (guideReportMode === 'CONSOLIDATED' || isReturn) {
          newMovements = guideCart.map(item => ({
              id_movimiento: Math.floor(Math.random() * 1000000) + Math.random(),
              id_insumo: item.insumo.id_insumo,
              fecha_movimiento: date,
              hora_movimiento: time,
              tipo_movimiento: isReturn ? 'Entrada' : 'Salida',
              cantidad: item.cantidad,
              id_dni_responsable: Number(guideTech),
              id_codigo_ipress_estab_destino: Number(guideDestination),
              nro_guia: currentGuideNumber,
              observacion: isReturn ? `Devolución ${returnOriginGuide}` : 'Guía Salida Consolidado',
              evidencia_url: '',
              nombre_receptor: guideReceiver,
              nombre_entrega: isReturn ? returnDeliveredBy : undefined,
              estado_movimiento: 'Activo'
          }));
      } else {
          newMovements = guideCart.map((item, index) => ({
              id_movimiento: Math.floor(Math.random() * 1000000) + index,
              id_insumo: item.insumo.id_insumo,
              fecha_movimiento: date,
              hora_movimiento: time,
              tipo_movimiento: 'Salida',
              cantidad: item.cantidad,
              id_dni_responsable: Number(guideTech),
              id_codigo_ipress_estab_destino: Number(guideDestination),
              nro_guia: `${currentGuideNumber}-${index + 1}`,
              observacion: 'Guía Salida Individual',
              evidencia_url: '',
              nombre_receptor: guideReceiver,
              estado_movimiento: 'Activo'
          }));
      }

      const updatedInsumos = insumos.map(ins => {
          const cartItem = guideCart.find(c => c.insumo.id_insumo === ins.id_insumo);
          if (cartItem) {
              if (isReturn) {
                  return { ...ins, cantidad: ins.cantidad + cartItem.cantidad, estado_insumo: 'Nuevo' as const };
              } else {
                  return { ...ins, cantidad: ins.cantidad - cartItem.cantidad, estado_insumo: 'Prestado' as const };
              }
          }
          return ins;
      });

      setInsumos(updatedInsumos);
      setMovimientos([...newMovements, ...movimientos]);
      
      setIsPrintPreviewOpen(false);
      setIsGuideModalOpen(false);
      setGuideCart([]);
      setIsReturnMode(false);
      alert('Operación exitosa.');
  };
  
  const handleReprintGuide = (nroGuia: string) => {
    const related = movimientos.filter(m => m.nro_guia === nroGuia);
    if (related.length === 0) return;
    const first = related[0];
    const cart: GuiaSalidaItem[] = related.map(m => {
        const item = insumos.find(i => i.id_insumo === m.id_insumo);
        if (!item) return null; 
        return { insumo: item, cantidad: m.cantidad };
    }).filter(x => x !== null) as GuiaSalidaItem[];

    setGuideDestination(first.id_codigo_ipress_estab_destino || '');
    setGuideTech(first.id_dni_responsable || '');
    setGuideCart(cart);
    setCurrentGuideNumber(nroGuia);
    setGuideReceiver(first.nombre_receptor || '');
    setReturnDeliveredBy(first.nombre_entrega || '');
    setIsReturnMode(first.tipo_movimiento === 'Entrada');
    setIsViewOnlyMode(true);
    setIsPrintPreviewOpen(true);
  };

  // --- UPLOAD HANDLERS ---
  const handleOpenUpload = (guideNum: string) => {
      setUploadTargetGuide(guideNum);
      setUploadUrlInput("");
      setSelectedFileName("");
      setIsUploadModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setSelectedFileName(file.name);
        const reader = new FileReader();
        reader.onloadend = () => setUploadUrlInput(reader.result as string);
        reader.readAsDataURL(file);
    }
  };

  const confirmUpload = () => {
      if (uploadTargetGuide && uploadUrlInput) {
          setMovimientos(prev => prev.map(m => m.nro_guia === uploadTargetGuide ? { ...m, evidencia_url: uploadUrlInput } : m));
          setIsUploadModalOpen(false);
      }
  };

  const handleViewEvidence = (url: string) => {
      setViewEvidenceUrl(url);
      setIsViewerOpen(true);
  };

  // --- ANULATE LOGIC ---
  const openAnulateModal = (nroGuia: string) => {
      setGuideToAnulate(nroGuia);
      setAnulateResponsible('');
      setIsAnulateModalOpen(true);
  };

  const handleConfirmAnulate = () => {
      if (!anulateResponsible) return;
      const toAnnul = movimientos.filter(m => m.nro_guia === guideToAnulate && m.estado_movimiento !== 'Anulado');
      if (toAnnul.length === 0) return;

      const updatedInsumos = [...insumos];
      toAnnul.forEach(mov => {
          const idx = updatedInsumos.findIndex(i => i.id_insumo === mov.id_insumo);
          if (idx >= 0) {
              if (mov.tipo_movimiento === 'Salida') updatedInsumos[idx].cantidad += mov.cantidad;
              else updatedInsumos[idx].cantidad = Math.max(0, updatedInsumos[idx].cantidad - mov.cantidad);
          }
      });
      setInsumos(updatedInsumos);
      setMovimientos(prev => prev.map(m => m.nro_guia === guideToAnulate ? { ...m, estado_movimiento: 'Anulado', id_dni_anulacion: Number(anulateResponsible) } : m));
      setIsAnulateModalOpen(false);
  };

  const isAnulatingReturn = useMemo(() => {
      const sample = movimientos.find(m => m.nro_guia === guideToAnulate);
      return sample?.tipo_movimiento === 'Entrada';
  }, [guideToAnulate, movimientos]);

  const handlePrint = () => {
      const content = document.getElementById('inventory-printable-area');
      if (content) {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
              printWindow.document.write(`<html><head><title>Doc</title><script src="https://cdn.tailwindcss.com"></script><style>body{font-family:sans-serif;} @media print{.no-print{display:none;}}</style></head><body class="p-8">${content.innerHTML}<script>setTimeout(()=>window.print(),800)</script></body></html>`);
              printWindow.document.close();
          }
      } else { window.print(); }
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Activos</h2>
          <p className="text-gray-500">Administración de infraestructura, bienes y equipamiento</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-80">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <input 
                  type="text" 
                  placeholder="Buscar en todo..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                  value={globalSearchTerm}
                  onChange={(e) => setGlobalSearchTerm(e.target.value)}
               />
               {globalSearchTerm && <button onClick={() => setGlobalSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14}/></button>}
             </div>
             <button onClick={openCreateModal} className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-brand-700 shadow-sm whitespace-nowrap transition-colors">
               <Plus size={18}/> <span className="hidden sm:inline">Nuevo Registro</span>
             </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
        {['DISP', 'FURN', 'ESTAB', 'RED', 'AMB', 'TOOL'].map(t => (
            <button 
                key={t}
                onClick={() => setActiveTab(t as any)}
                className={`px-4 py-2 font-medium flex items-center gap-2 whitespace-nowrap transition-colors text-sm ${activeTab === t ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50 rounded-t-lg' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg'}`}
            >
                {t === 'DISP' ? <Laptop size={16}/> : t === 'FURN' ? <Armchair size={16}/> : t === 'ESTAB' ? <Building2 size={16}/> : t === 'RED' ? <Network size={16}/> : t === 'AMB' ? <LayoutGrid size={16}/> : <Hammer size={16}/>}
                {t === 'DISP' ? 'Dispositivos' : t === 'FURN' ? 'Bien Patrimonial' : t === 'ESTAB' ? 'Establecimientos' : t === 'RED' ? 'Proveedores' : t === 'AMB' ? 'Ambientes' : 'Herramientas'}
            </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-0 overflow-hidden">
        
        {/* TAB HERRAMIENTAS (Existing) */}
        {activeTab === 'TOOL' && (
          <div>
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <div className="text-sm text-gray-500">Gestión de Stock, Préstamos y Salidas</div>
                <button onClick={handleGenerateNewGuide} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 text-sm font-medium shadow-md transition-all">
                    <ShoppingCart size={16} /> Nueva Guía de Salida
                </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
                <div className="lg:col-span-2 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white text-gray-500 font-semibold border-b">
                            <tr>
                                <th className="px-6 py-3 text-left">Ítem / Activo</th>
                                <th className="px-6 py-3 text-left">Detalle</th>
                                <th className="px-6 py-3 text-left">Stock</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredInsumos.map(i => (
                                <tr key={i.id_insumo} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-800">{i.nombre_insumo}</div>
                                        <div className="text-xs text-gray-500 mb-1">{i.ubicacion_fisica}</div>
                                        {i.marca && <div className="text-xs text-gray-600 font-medium">Marca: {i.marca}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        <span className={`px-2 py-1 rounded-full border ${i.tipo_insumo === 'Herramienta' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{i.tipo_insumo}</span>
                                        {i.tipo_insumo === 'Herramienta' ? (
                                            <div className="mt-2 space-y-1">
                                                <div className="text-gray-600">CP: <span className="font-mono">{i.codigo_patrimonial || '-'}</span> | Año: {i.anio_patrimonial || '-'}</div>
                                            </div>
                                        ) : <div className="mt-2 text-gray-400 italic">No contiene modelo o CP</div>}
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold">{i.cantidad} {i.unidad_medida}</td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => openEditModal(i, 'TOOL')} className="p-1 text-gray-400 hover:text-brand-600"><Edit size={16}/></button>
                                        <button onClick={() => handleDelete(i.id_insumo, 'TOOL')} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* MOVEMENT HISTORY */}
                <div className="bg-gray-50 p-0 overflow-hidden flex flex-col h-[500px]">
                     <div className="p-3 border-b border-gray-200 bg-gray-100 space-y-2">
                        <div className="font-bold text-gray-700 flex items-center gap-2"><History size={16}/> Últimos Movimientos</div>
                        <input type="text" placeholder="Buscar guía..." className="w-full pl-2 pr-2 py-1 text-xs border rounded" value={movementsSearchTerm} onChange={(e) => setMovementsSearchTerm(e.target.value)} />
                     </div>
                     <div className="overflow-y-auto flex-1 p-0">
                         {Object.keys(groupedMovements).length === 0 ? <div className="p-8 text-center text-gray-400 text-sm">No movimientos.</div> : 
                             <table className="w-full text-xs text-left">
                                 <thead className="bg-gray-100 text-gray-500 border-b"><tr><th className="px-3 py-2 w-1/3">Guía / Fecha</th><th className="px-3 py-2 w-1/3">Detalle</th><th className="px-3 py-2 text-center">Acciones</th></tr></thead>
                                 <tbody className="divide-y divide-gray-200">
                                     {Object.entries(groupedMovements).sort(([,a], [,b]) => new Date(b[0].fecha_movimiento).getTime() - new Date(a[0].fecha_movimiento).getTime()).map(([key, groupValue]) => {
                                            const group = groupValue as MovimientoInsumo[];
                                            const m = group[0];
                                            const isGroup = group.length > 1;
                                            const dest = establecimientos.find(e => e.id_codigo_ipress_estab === m.id_codigo_ipress_estab_destino);
                                         return (
                                             <tr key={key} className={`bg-white ${m.estado_movimiento === 'Anulado' ? 'opacity-60 bg-red-50' : ''}`}>
                                                 <td className="px-3 py-2 align-top">
                                                     <div className="font-bold text-brand-700">{m.nro_guia || 'S/N'}</div>
                                                     <div>{m.fecha_movimiento} <span className="text-gray-400">{m.hora_movimiento}</span></div>
                                                     <div className="text-gray-500">{dest?.nombre_estab}</div>
                                                 </td>
                                                 <td className="px-3 py-2 align-top">
                                                     {isGroup ? <div className="font-bold">{group.length} Ítems (Consolidado)</div> : <div className="font-medium">{insumos.find(i=>i.id_insumo===m.id_insumo)?.nombre_insumo}</div>}
                                                     <div className={`text-[10px] font-bold ${m.tipo_movimiento === 'Salida' ? 'text-red-600' : 'text-green-600'}`}>{m.tipo_movimiento.toUpperCase()}</div>
                                                 </td>
                                                 <td className="px-3 py-2 text-center align-top flex flex-col items-center gap-1">
                                                    {m.nro_guia && (
                                                        <>
                                                            <button onClick={() => handleReprintGuide(m.nro_guia!)} className="p-1 bg-blue-100 text-blue-700 rounded"><FileText size={14}/></button>
                                                            {m.tipo_movimiento === 'Salida' && m.estado_movimiento !== 'Anulado' && <button onClick={() => handleOpenReturnModal(m.nro_guia!)} className="p-1 bg-orange-100 text-orange-700 rounded"><RotateCcw size={14}/></button>}
                                                            {m.estado_movimiento !== 'Anulado' && <button onClick={() => openAnulateModal(m.nro_guia!)} className="p-1 bg-red-100 text-red-700 rounded"><Trash2 size={14}/></button>}
                                                        </>
                                                    )}
                                                 </td>
                                             </tr>
                                         );
                                     })}
                                 </tbody>
                             </table>
                         }
                     </div>
                </div>
            </div>
          </div>
        )}

        {/* TAB DISPOSITIVOS */}
        {activeTab === 'DISP' && (
            <div className="overflow-x-auto text-left">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 border-b">
                        <tr>
                            <th className="px-6 py-4 text-left">Código / Margesí</th>
                            <th className="px-6 py-4 text-left">Nombre / Tipo</th>
                            <th className="px-6 py-4 text-left">Ubicación</th>
                            <th className="px-6 py-4 text-left">Detalle</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredDispositivos.map(d => {
                            const amb = ambientes.find(a => a.id_amb === d.id_amb);
                            const estab = establecimientos.find(e => e.id_codigo_ipress_estab === amb?.id_codigo_ipress_estab);
                            return (
                                <tr key={d.id_codigo_patrimonial_disp_e} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono">
                                        <div className="font-bold text-gray-700">CP: {d.id_codigo_patrimonial_disp_e}</div>
                                        {d.codigo_margesi && <div className="text-xs text-brand-600">M: {d.codigo_margesi}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold">{d.tipo_dispositivo_disp_e}</div>
                                        <div className="text-xs text-gray-500">Marca: {d.marca_disp_e}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-800">{estab?.nombre_estab || 'Sin Establecimiento'}</div>
                                        <div className="text-xs text-gray-500">{amb?.nombre_servicio_amb} - {amb?.nombre_area_amb}</div>
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        <span className={`px-2 py-1 rounded border ${d.estado__disp_e === 'Bueno' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>{d.estado__disp_e}</span>
                                        {d.cod_patrimonial_padre && <div className="mt-1 text-gray-400">Padre: {d.cod_patrimonial_padre}</div>}
                                        <div className="text-gray-400">Año: {d.anio_patrimonial}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => openEditModal(d, 'DISP')} className="text-gray-400 hover:text-brand-600 mx-1"><Edit size={16}/></button>
                                        <button onClick={() => handleDelete(d.id_codigo_patrimonial_disp_e, 'DISP')} className="text-gray-400 hover:text-red-600 mx-1"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )}

        {/* TAB INMUEBLES (FURNITURE) */}
        {activeTab === 'FURN' && (
            <div className="overflow-x-auto text-left">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 border-b">
                        <tr>
                            <th className="px-6 py-4 text-left">Código / Margesí</th>
                            <th className="px-6 py-4 text-left">Bien / Descripción</th>
                            <th className="px-6 py-4 text-left">Ubicación</th>
                            <th className="px-6 py-4 text-left">Detalles</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredInmuebles.map(i => {
                            const amb = ambientes.find(a => a.id_amb === i.id_amb);
                            const estab = establecimientos.find(e => e.id_codigo_ipress_estab === amb?.id_codigo_ipress_estab);
                            return (
                                <tr key={i.id_inmueble} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono">
                                        <div className="font-bold text-gray-700">CP: {i.codigo_patrimonial}</div>
                                        {i.codigo_margesi && <div className="text-xs text-brand-600">M: {i.codigo_margesi}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold">{i.tipo_inmueble}</div>
                                        <div className="text-xs text-gray-500">{i.marca} {i.modelo}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-800">{estab?.nombre_estab || 'Sin Asignar'}</div>
                                        <div className="text-xs text-gray-500">{amb?.nombre_servicio_amb} - {amb?.nombre_area_amb}</div>
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        <span className={`px-2 py-1 rounded border ${i.estado === 'Bueno' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>{i.estado}</span>
                                        <div className="text-gray-400 mt-1">Color: {i.color || '-'}</div>
                                        <div className="text-gray-400">Año: {i.anio_patrimonial}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => openEditModal(i, 'FURN')} className="text-gray-400 hover:text-brand-600 mx-1"><Edit size={16}/></button>
                                        <button onClick={() => handleDelete(i.id_inmueble, 'FURN')} className="text-gray-400 hover:text-red-600 mx-1"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )}

        {/* ... (Existing Tabs: ESTAB, RED, AMB) ... */}
        {activeTab === 'ESTAB' && (
             <div className="overflow-x-auto text-left">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 border-b"><tr><th className="px-6 py-4 text-left">Código</th><th className="px-6 py-4 text-left">Nombre</th><th className="px-6 py-4 text-left">RIS</th><th className="px-6 py-4 text-right">Acciones</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredEstablecimientos.map(e => (
                            <tr key={e.id_codigo_ipress_estab}>
                                <td className="px-6 py-4 font-mono">{e.id_codigo_ipress_estab}</td>
                                <td className="px-6 py-4 font-bold">{e.nombre_estab}</td>
                                <td className="px-6 py-4">{e.ris_estab}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => openEditModal(e, 'ESTAB')} className="text-gray-400 hover:text-brand-600 mx-1"><Edit size={16}/></button>
                                    <button onClick={() => handleDelete(e.id_codigo_ipress_estab, 'ESTAB')} className="text-gray-400 hover:text-red-600 mx-1"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        )}
        {activeTab === 'RED' && (
             <div className="overflow-x-auto text-left">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 border-b"><tr><th className="px-6 py-4 text-left">Sede</th><th className="px-6 py-4 text-left">Proveedor</th><th className="px-6 py-4 text-left">Velocidad</th><th className="px-6 py-4 text-right">Acciones</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredRedes.map(r => (
                            <tr key={r.id_red}>
                                <td className="px-6 py-4">{establecimientos.find(e=>e.id_codigo_ipress_estab===r.id_codigo_ipress_estab)?.nombre_estab}</td>
                                <td className="px-6 py-4 font-bold">{r.proveedor_red}</td>
                                <td className="px-6 py-4">{r.velocidad_red}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => openEditModal(r, 'RED')} className="text-gray-400 hover:text-brand-600 mx-1"><Edit size={16}/></button>
                                    <button onClick={() => handleDelete(r.id_red, 'RED')} className="text-gray-400 hover:text-red-600 mx-1"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        )}
        {activeTab === 'AMB' && (
             <div className="overflow-x-auto text-left">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 border-b"><tr><th className="px-6 py-4 text-left">Sede</th><th className="px-6 py-4 text-left">Servicio</th><th className="px-6 py-4 text-left">Tipo</th><th className="px-6 py-4 text-right">Acciones</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredAmbientes.map(a => (
                            <tr key={a.id_amb}>
                                <td className="px-6 py-4">{establecimientos.find(e=>e.id_codigo_ipress_estab===a.id_codigo_ipress_estab)?.nombre_estab}</td>
                                <td className="px-6 py-4 font-bold">{a.nombre_servicio_amb} <span className="text-xs font-normal text-gray-500">({a.nombre_area_amb})</span></td>
                                <td className="px-6 py-4">{a.tipo_ambiente_amb}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => openEditModal(a, 'AMB')} className="text-gray-400 hover:text-brand-600 mx-1"><Edit size={16}/></button>
                                    <button onClick={() => handleDelete(a.id_amb, 'AMB')} className="text-gray-400 hover:text-red-600 mx-1"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        )}
      </div>

      {/* --- MODAL CREAR/EDITAR (GENERICO) --- */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                 <h3 className="text-xl font-bold mb-4">Registro / Edición</h3>
                 <form onSubmit={handleSaveAny}>
                     <div className="space-y-4">
                         
                         {/* FORMULARIO DISPOSITIVOS */}
                         {activeTab === 'DISP' && (
                             <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Código Patrimonial <span className="text-red-500">*</span></label>
                                        <input type="number" required className="w-full border p-2 rounded" value={formDevice.id_codigo_patrimonial_disp_e || ''} onChange={e => setFormDevice({...formDevice, id_codigo_patrimonial_disp_e: parseInt(e.target.value)})} disabled={modalMode === 'EDIT'} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Código Margesí</label>
                                        <input type="text" className="w-full border p-2 rounded" value={formDevice.codigo_margesi || ''} onChange={e => setFormDevice({...formDevice, codigo_margesi: e.target.value})} placeholder="Opcional" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Año <span className="text-red-500">*</span></label>
                                        <input type="number" required className="w-full border p-2 rounded" value={formDevice.anio_patrimonial || ''} onChange={e => setFormDevice({...formDevice, anio_patrimonial: parseInt(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Estado</label>
                                        <select className="w-full border p-2 rounded" value={formDevice.estado__disp_e} onChange={e => setFormDevice({...formDevice, estado__disp_e: e.target.value as any})}>
                                            {['Bueno', 'Regular', 'Malo', 'Baja'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* DYNAMIC DEVICE TYPE */}
                                <div className="relative" ref={deviceTypeRef}>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Tipo de Dispositivo <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="Seleccionar o escribir..."
                                        className="w-full border p-2 rounded"
                                        value={deviceTypeSearch}
                                        onChange={(e) => {
                                            setDeviceTypeSearch(e.target.value);
                                            setShowDeviceTypeSuggestions(true);
                                        }}
                                        onFocus={() => setShowDeviceTypeSuggestions(true)}
                                    />
                                    {showDeviceTypeSuggestions && (
                                        <div className="absolute z-10 w-full bg-white border mt-1 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                            {filteredDeviceTypes.map(t => (
                                                <div key={t} className="p-2 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => { setDeviceTypeSearch(t); setShowDeviceTypeSuggestions(false); }}>
                                                    {t}
                                                </div>
                                            ))}
                                            {!availableDeviceTypes.some(t => t.toLowerCase() === deviceTypeSearch.toLowerCase()) && deviceTypeSearch && (
                                                <div className="p-2 bg-blue-50 text-blue-700 cursor-pointer text-sm font-bold flex items-center gap-2 border-t" onClick={handleManualAddDeviceType}>
                                                    <Plus size={14}/> Agregar "{deviceTypeSearch}"
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                <input type="text" placeholder="Marca *" required className="w-full border p-2 rounded" value={formDevice.marca_disp_e || ''} onChange={e => setFormDevice({...formDevice, marca_disp_e: e.target.value})} />
                                <input type="text" placeholder="Modelo *" required className="w-full border p-2 rounded" value={formDevice.modelo_disp_e || ''} onChange={e => setFormDevice({...formDevice, modelo_disp_e: e.target.value})} />
                                <input type="text" placeholder="Serie" className="w-full border p-2 rounded" value={formDevice.serie_disp_e || ''} onChange={e => setFormDevice({...formDevice, serie_disp_e: e.target.value})} />

                                {/* UBICACIÓN (ESTABLECIMIENTO -> AMBIENTE) */}
                                <div className="bg-gray-50 p-3 rounded border">
                                    <label className="block text-xs font-bold text-gray-500 mb-2">Ubicación Actual</label>
                                    <select 
                                        className="w-full border p-2 rounded mb-2 text-sm"
                                        value={selectedEstabId}
                                        onChange={(e) => {
                                            setSelectedEstabId(parseInt(e.target.value));
                                            setFormDevice({...formDevice, id_amb: undefined}); // Reset ambiente
                                        }}
                                    >
                                        <option value="">-- Seleccionar Establecimiento --</option>
                                        {establecimientos.map(e => <option key={e.id_codigo_ipress_estab} value={e.id_codigo_ipress_estab}>{e.nombre_estab}</option>)}
                                    </select>
                                    
                                    <select 
                                        className="w-full border p-2 rounded text-sm disabled:bg-gray-100"
                                        disabled={!selectedEstabId}
                                        value={formDevice.id_amb || ''}
                                        onChange={(e) => setFormDevice({...formDevice, id_amb: parseInt(e.target.value)})}
                                    >
                                        <option value="">-- Seleccionar Ambiente --</option>
                                        {formAmbientesList.map(a => <option key={a.id_amb} value={a.id_amb}>{a.nombre_servicio_amb} - {a.nombre_area_amb}</option>)}
                                    </select>
                                </div>
                                
                                {/* AFILIACIÓN PADRE (CONDITIONAL) */}
                                {isPeripheral && (
                                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                        <label className="block text-xs font-bold text-red-800 mb-1 flex items-center gap-2"><LinkIcon size={14}/> Afiliación a Equipo Principal <span className="text-red-600">* (Obligatorio)</span></label>
                                        <div className="relative">
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    className="w-full p-2 border border-red-200 rounded text-sm" 
                                                    placeholder="Buscar por tipo, marca, modelo o código..."
                                                    value={parentSearchTerm}
                                                    onChange={(e) => { setParentSearchTerm(e.target.value); setShowParentSuggestions(true); }}
                                                    onFocus={() => setShowParentSuggestions(true)}
                                                />
                                                {formDevice.cod_patrimonial_padre && (
                                                    <button type="button" onClick={() => { setFormDevice({ ...formDevice, cod_patrimonial_padre: undefined, anio_patrimonial_padre: undefined }); setParentSearchTerm(''); }} className="text-red-500 hover:bg-red-100 p-2 rounded"><X size={16}/></button>
                                                )}
                                            </div>
                                            {showParentSuggestions && parentSearchTerm && !formDevice.cod_patrimonial_padre && (
                                                <div className="absolute z-10 w-full bg-white border mt-1 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                                    {filteredParents.map(p => (
                                                        <div key={p.id_codigo_patrimonial_disp_e} className="p-2 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => handleSelectParent(p)}>
                                                            <div className="font-bold text-gray-700">{p.tipo_dispositivo_disp_e} - {p.marca_disp_e} {p.modelo_disp_e}</div>
                                                            <div className="text-xs text-gray-500">CP: {p.id_codigo_patrimonial_disp_e}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {!formDevice.cod_patrimonial_padre && (
                                            <p className="text-[10px] text-red-600 mt-1 font-bold">Debe seleccionar un equipo padre para este periférico.</p>
                                        )}
                                    </div>
                                )}
                             </>
                         )}

                         {/* FORMULARIO INMUEBLES (FURNITURE) */}
                         {activeTab === 'FURN' && (
                             <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Código Patrimonial <span className="text-red-500">*</span></label>
                                        <input type="text" required className="w-full border p-2 rounded" value={formFurniture.codigo_patrimonial || ''} onChange={e => setFormFurniture({...formFurniture, codigo_patrimonial: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Código Margesí</label>
                                        <input type="text" className="w-full border p-2 rounded" value={formFurniture.codigo_margesi || ''} onChange={e => setFormFurniture({...formFurniture, codigo_margesi: e.target.value})} placeholder="Opcional" />
                                    </div>
                                </div>
                                
                                {/* DYNAMIC FURNITURE TYPE */}
                                <div className="relative" ref={furnitureTypeRef}>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Tipo de Bien <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="Ej. Silla, Mesa, Ventilador..."
                                        className="w-full border p-2 rounded"
                                        value={furnitureTypeSearch}
                                        onChange={(e) => {
                                            setFurnitureTypeSearch(e.target.value);
                                            setShowFurnitureTypeSuggestions(true);
                                        }}
                                        onFocus={() => setShowFurnitureTypeSuggestions(true)}
                                    />
                                    {showFurnitureTypeSuggestions && (
                                        <div className="absolute z-10 w-full bg-white border mt-1 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                            {filteredFurnitureTypes.map(t => (
                                                <div key={t} className="p-2 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => { setFurnitureTypeSearch(t); setShowFurnitureTypeSuggestions(false); }}>
                                                    {t}
                                                </div>
                                            ))}
                                            {!availableFurnitureTypes.some(t => t.toLowerCase() === furnitureTypeSearch.toLowerCase()) && furnitureTypeSearch && (
                                                <div className="p-2 bg-blue-50 text-blue-700 cursor-pointer text-sm font-bold flex items-center gap-2 border-t" onClick={handleManualAddFurnitureType}>
                                                    <Plus size={14}/> Agregar "{furnitureTypeSearch}"
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="Marca" className="w-full border p-2 rounded" value={formFurniture.marca || ''} onChange={e => setFormFurniture({...formFurniture, marca: e.target.value})} />
                                    <input type="text" placeholder="Modelo" className="w-full border p-2 rounded" value={formFurniture.modelo || ''} onChange={e => setFormFurniture({...formFurniture, modelo: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="Color" className="w-full border p-2 rounded" value={formFurniture.color || ''} onChange={e => setFormFurniture({...formFurniture, color: e.target.value})} />
                                    <input type="text" placeholder="Dimensiones" className="w-full border p-2 rounded" value={formFurniture.dimensiones || ''} onChange={e => setFormFurniture({...formFurniture, dimensiones: e.target.value})} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Año <span className="text-red-500">*</span></label>
                                        <input type="number" required className="w-full border p-2 rounded" value={formFurniture.anio_patrimonial || ''} onChange={e => setFormFurniture({...formFurniture, anio_patrimonial: parseInt(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Estado</label>
                                        <select className="w-full border p-2 rounded" value={formFurniture.estado} onChange={e => setFormFurniture({...formFurniture, estado: e.target.value as any})}>
                                            {['Bueno', 'Regular', 'Malo', 'Baja'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* UBICACIÓN (ESTABLECIMIENTO -> AMBIENTE) */}
                                <div className="bg-gray-50 p-3 rounded border">
                                    <label className="block text-xs font-bold text-gray-500 mb-2">Ubicación Actual *</label>
                                    <select 
                                        className="w-full border p-2 rounded mb-2 text-sm"
                                        value={selectedEstabId}
                                        onChange={(e) => {
                                            setSelectedEstabId(parseInt(e.target.value));
                                            setFormFurniture({...formFurniture, id_amb: undefined});
                                        }}
                                    >
                                        <option value="">-- Seleccionar Establecimiento --</option>
                                        {establecimientos.map(e => <option key={e.id_codigo_ipress_estab} value={e.id_codigo_ipress_estab}>{e.nombre_estab}</option>)}
                                    </select>
                                    
                                    <select 
                                        required
                                        className="w-full border p-2 rounded text-sm disabled:bg-gray-100"
                                        disabled={!selectedEstabId}
                                        value={formFurniture.id_amb || ''}
                                        onChange={(e) => setFormFurniture({...formFurniture, id_amb: parseInt(e.target.value)})}
                                    >
                                        <option value="">-- Seleccionar Ambiente --</option>
                                        {formAmbientesList.map(a => <option key={a.id_amb} value={a.id_amb}>{a.nombre_servicio_amb} - {a.nombre_area_amb}</option>)}
                                    </select>
                                </div>
                             </>
                         )}

                         {/* ... (Existing Forms for ESTAB, RED, AMB, TOOL - Unchanged) ... */}
                         {activeTab === 'ESTAB' && (
                             <>
                                <input type="number" placeholder="Código IPRESS *" required className="w-full border p-2 rounded" value={formEstab.id_codigo_ipress_estab || ''} onChange={e => setFormEstab({...formEstab, id_codigo_ipress_estab: parseInt(e.target.value)})} disabled={modalMode === 'EDIT'} />
                                <input type="text" placeholder="Nombre Establecimiento *" required className="w-full border p-2 rounded" value={formEstab.nombre_estab || ''} onChange={e => setFormEstab({...formEstab, nombre_estab: e.target.value})} />
                                <label className="block text-xs font-bold text-gray-500 mb-1">RIS *</label>
                                <select required className="w-full border p-2 rounded" value={formEstab.ris_estab} onChange={e => setFormEstab({...formEstab, ris_estab: e.target.value})}>
                                    {RIS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                                <div className="border-t border-gray-100 pt-4 mt-2">
                                  <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Datos de Contacto</p>
                                  <input type="text" placeholder="Médico Jefe" className="w-full border p-2 rounded mb-2" value={formEstab.medico_jefe || ''} onChange={e => setFormEstab({...formEstab, medico_jefe: e.target.value})} />
                                  <div className="grid grid-cols-2 gap-2 mb-2">
                                      <input type="text" placeholder="Teléfono" className="w-full border p-2 rounded" value={formEstab.telefono || ''} onChange={e => setFormEstab({...formEstab, telefono: e.target.value})} />
                                      <input type="email" placeholder="Email" className="w-full border p-2 rounded" value={formEstab.email || ''} onChange={e => setFormEstab({...formEstab, email: e.target.value})} />
                                  </div>
                                  <input type="text" placeholder="Dirección" className="w-full border p-2 rounded mb-2" value={formEstab.direccion || ''} onChange={e => setFormEstab({...formEstab, direccion: e.target.value})} />
                                  <input type="text" placeholder="Coordenadas (Lat, Lon)" className="w-full border p-2 rounded" value={formEstab.coordenadas || ''} onChange={e => setFormEstab({...formEstab, coordenadas: e.target.value})} />
                                </div>
                             </>
                         )}
                         {activeTab === 'RED' && (
                             <>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Establecimiento *</label>
                                <div className="relative mb-2">
                                    <input type="text" required placeholder="Buscar Establecimiento..." className="w-full border p-2 rounded" value={estabSearchTerm} onChange={(e) => { setEstabSearchTerm(e.target.value); setShowEstabSuggestions(true); if (formNetwork.id_codigo_ipress_estab && !e.target.value) setFormNetwork({...formNetwork, id_codigo_ipress_estab: undefined}); }} onFocus={() => setShowEstabSuggestions(true)} />
                                    {showEstabSuggestions && (
                                        <div className="absolute z-10 w-full bg-white border mt-1 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                            {filteredEstabForSearch.map(e => <div key={e.id_codigo_ipress_estab} className="p-2 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => handleSelectEstab(e)}><span className="font-bold">{e.nombre_estab}</span></div>)}
                                        </div>
                                    )}
                                </div>
                                <input type="text" placeholder="Proveedor *" required className="w-full border p-2 rounded" value={formNetwork.proveedor_red || ''} onChange={e => setFormNetwork({...formNetwork, proveedor_red: e.target.value})} />
                                <input type="text" placeholder="Velocidad (ej. 100 Mbps) *" required className="w-full border p-2 rounded" value={formNetwork.velocidad_red || ''} onChange={e => setFormNetwork({...formNetwork, velocidad_red: e.target.value})} />
                             </>
                         )}
                         {activeTab === 'AMB' && (
                             <>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Establecimiento *</label>
                                <div className="relative mb-2">
                                    <input type="text" required placeholder="Buscar Establecimiento..." className="w-full border p-2 rounded" value={estabSearchTerm} onChange={(e) => { setEstabSearchTerm(e.target.value); setShowEstabSuggestions(true); if (formAmbiente.id_codigo_ipress_estab && !e.target.value) setFormAmbiente({...formAmbiente, id_codigo_ipress_estab: undefined}); }} onFocus={() => setShowEstabSuggestions(true)} />
                                    {showEstabSuggestions && (
                                        <div className="absolute z-10 w-full bg-white border mt-1 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                            {filteredEstabForSearch.map(e => <div key={e.id_codigo_ipress_estab} className="p-2 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => handleSelectEstab(e)}><span className="font-bold">{e.nombre_estab}</span></div>)}
                                        </div>
                                    )}
                                </div>
                                <div className="relative mb-2" ref={serviceDropdownRef}>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Nombre Servicio *</label>
                                    <input type="text" placeholder="Buscar o agregar Servicio..." required className="w-full border p-2 rounded" value={serviceSearchTerm} onChange={e => { setServiceSearchTerm(e.target.value); setFormAmbiente({...formAmbiente, nombre_servicio_amb: e.target.value}); setShowServiceSuggestions(true); }} onFocus={() => setShowServiceSuggestions(true)} />
                                    {showServiceSuggestions && (
                                        <div className="absolute z-50 w-full bg-white border mt-1 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                            {filteredServices.map(s => <div key={s} className="p-2 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => { setFormAmbiente({...formAmbiente, nombre_servicio_amb: s}); setServiceSearchTerm(s); setShowServiceSuggestions(false); }}>{s}</div>)}
                                            {!availableServices.some(s => s.toLowerCase() === serviceSearchTerm.toLowerCase()) && serviceSearchTerm && <div className="p-2 bg-blue-50 text-blue-700 cursor-pointer text-sm font-bold flex items-center gap-2 border-t" onClick={handleManualAddService}><Plus size={14}/> Agregar "{serviceSearchTerm}"</div>}
                                        </div>
                                    )}
                                </div>
                                <input type="text" placeholder="Área / Detalle (Ej. Consultorio 1) *" required className="w-full border p-2 rounded" value={formAmbiente.nombre_area_amb || ''} onChange={e => setFormAmbiente({...formAmbiente, nombre_area_amb: e.target.value})} />
                                <div className="grid grid-cols-2 gap-4">
                                     <select className="w-full border p-2 rounded" value={formAmbiente.toma_electrica_amb} onChange={e => setFormAmbiente({...formAmbiente, toma_electrica_amb: e.target.value as any})}><option value="Si">Con Luz</option><option value="No">Sin Luz</option></select>
                                     <select className="w-full border p-2 rounded" value={formAmbiente.punto_red_amb} onChange={e => setFormAmbiente({...formAmbiente, punto_red_amb: e.target.value as any})}><option value="Si">Con Red</option><option value="No">Sin Red</option></select>
                                </div>
                             </>
                         )}
                         {activeTab === 'TOOL' && (
                             <>
                                <input type="text" placeholder="Nombre Ítem" required className="w-full border p-2 rounded" value={formInsumo.nombre_insumo || ''} onChange={e => setFormInsumo({...formInsumo, nombre_insumo: e.target.value})} />
                                <div className="grid grid-cols-2 gap-4">
                                    <select className="w-full border p-2 rounded" value={formInsumo.tipo_insumo} onChange={e => setFormInsumo({...formInsumo, tipo_insumo: e.target.value as any})}><option value="Herramienta">Herramienta</option><option value="Material">Material</option><option value="Accesorio">Accesorio</option><option value="Otro">Otro</option></select>
                                    <input type="text" placeholder="Marca (Opcional)" className="w-full border p-2 rounded" value={formInsumo.marca || ''} onChange={e => setFormInsumo({...formInsumo, marca: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Cantidad *</label><input type="number" required className="w-full border p-2 rounded" value={formInsumo.cantidad || ''} onChange={e => setFormInsumo({...formInsumo, cantidad: parseInt(e.target.value)})} /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Unidad Medida *</label><input type="text" placeholder="Ej. Unidad, Metros, Cajas" required className="w-full border p-2 rounded" value={formInsumo.unidad_medida || ''} onChange={e => setFormInsumo({...formInsumo, unidad_medida: e.target.value})} /></div>
                                </div>
                                <input type="text" placeholder="Ubicación Física" className="w-full border p-2 rounded" value={formInsumo.ubicacion_fisica || ''} onChange={e => setFormInsumo({...formInsumo, ubicacion_fisica: e.target.value})} />
                                {formInsumo.tipo_insumo === 'Herramienta' && (
                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mt-2">
                                        <p className="text-xs font-bold text-purple-700 mb-2 uppercase">Datos de Activo Fijo</p>
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-2 gap-2"><input type="text" placeholder="Código Patrimonial" className="w-full border p-2 rounded text-sm" value={formInsumo.codigo_patrimonial || ''} onChange={e => setFormInsumo({...formInsumo, codigo_patrimonial: e.target.value})} /><input type="number" placeholder="Año Patrimonial" className="w-full border p-2 rounded text-sm" value={formInsumo.anio_patrimonial || ''} onChange={e => setFormInsumo({...formInsumo, anio_patrimonial: parseInt(e.target.value)})} /></div>
                                            <div className="grid grid-cols-2 gap-2"><input type="text" placeholder="Modelo" className="w-full border p-2 rounded text-sm" value={formInsumo.modelo || ''} onChange={e => setFormInsumo({...formInsumo, modelo: e.target.value})} /><input type="text" placeholder="Serie" className="w-full border p-2 rounded text-sm" value={formInsumo.serie || ''} onChange={e => setFormInsumo({...formInsumo, serie: e.target.value})} /></div>
                                        </div>
                                    </div>
                                )}
                             </>
                         )}

                     </div>
                     <div className="mt-6 flex justify-end gap-2">
                         <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                         <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700">Guardar</button>
                     </div>
                 </form>
              </div>
          </div>
      )}
      
      {/* --- GUIDE MODAL (Existing logic retained) --- */}
      {isGuideModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl w-full max-w-2xl p-0 shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-gray-100">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><ShoppingCart className="text-brand-600"/> Generar Guía de Salida</h3>
                      <p className="text-sm text-gray-500">Seleccione destino y agregue los ítems a trasladar.</p>
                  </div>
                  <div className="p-6 flex-1 overflow-y-auto space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Destino</label><select className="w-full p-2 border rounded-lg" value={guideDestination} onChange={e => setGuideDestination(parseInt(e.target.value))}><option value="">-- Seleccionar --</option>{establecimientos.map(e => <option key={e.id_codigo_ipress_estab} value={e.id_codigo_ipress_estab}>{e.nombre_estab}</option>)}</select></div>
                          <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Técnico Responsable</label><select className="w-full p-2 border rounded-lg" value={guideTech} onChange={e => setGuideTech(parseInt(e.target.value))}><option value="">-- Seleccionar --</option>{tecnicos.map(t => <option key={t.id_dni_tec} value={t.id_dni_tec}>{t.nombre_completo_tec}</option>)}</select></div>
                          <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Receptor (Destino)</label><input type="text" placeholder="Nombre completo" className="w-full p-2 border rounded-lg" value={guideReceiver} onChange={e => setGuideReceiver(e.target.value)}/></div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                          <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type="text" placeholder="Buscar insumo..." className="w-full pl-9 p-2 border rounded-lg" value={guideSearchTerm} onChange={e => setGuideSearchTerm(e.target.value)}/>{guideSearchTerm && <div className="absolute z-10 w-full bg-white border mt-1 rounded-lg shadow-lg max-h-40 overflow-y-auto">{insumos.filter(i => filterByTerm(i, guideSearchTerm)).map(i => <div key={i.id_insumo} onClick={() => { handleAddToGuide(i); setGuideSearchTerm(''); }} className="p-2 hover:bg-gray-50 cursor-pointer text-sm border-b"><span className="font-bold">{i.nombre_insumo}</span> <span className="text-xs text-gray-500">({i.cantidad} {i.unidad_medida})</span></div>)}</div>}</div>
                          <div className="space-y-2">{guideCart.length === 0 ? <div className="text-center text-gray-400 py-4 text-sm italic">Carrito vacío.</div> : guideCart.map(item => <div key={item.insumo.id_insumo} className="flex justify-between items-center bg-white p-2 rounded border shadow-sm"><div><div className="font-medium text-sm">{item.insumo.nombre_insumo}</div><div className="text-xs text-gray-500">{item.insumo.codigo_patrimonial || 'Consumible'}</div></div><div className="flex items-center gap-2"><input type="number" min="1" max={item.insumo.cantidad} value={item.cantidad} onChange={(e) => handleUpdateCartQuantity(item.insumo.id_insumo, parseInt(e.target.value))} className="w-16 p-1 bg-gray-100 text-right font-bold rounded" /><span className="text-xs text-gray-500">{item.insumo.unidad_medida}</span><button onClick={() => removeFromGuide(item.insumo.id_insumo)} className="text-red-400 hover:text-red-600 p-1"><X size={16}/></button></div></div>)}</div>
                      </div>
                      {guideCart.length > 0 && <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-2"><label className="font-bold text-xs uppercase text-yellow-700 block mb-3 flex items-center gap-2"><Layers size={14}/> Configuración</label><div className="flex flex-col sm:flex-row gap-4"><label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer flex-1"><input type="radio" name="guideReportMode" checked={guideReportMode === 'CONSOLIDATED'} onChange={() => setGuideReportMode('CONSOLIDATED')} className="text-brand-600"/><span>Consolidado</span></label><label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer flex-1"><input type="radio" name="guideReportMode" checked={guideReportMode === 'INDIVIDUAL'} onChange={() => setGuideReportMode('INDIVIDUAL')} className="text-brand-600"/><span>Individuales</span></label></div></div>}
                  </div>
                  <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-xl">
                      <button onClick={() => setIsGuideModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">Cancelar</button>
                      <button onClick={() => { if (guideReportMode === 'CONSOLIDATED') { setIsPrintPreviewOpen(true); } else { if(confirm(`¿Generar guías?`)) handleConfirmGuide(); } }} disabled={!guideDestination || !guideTech || guideCart.length === 0} className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50">{guideReportMode === 'CONSOLIDATED' ? 'Generar Documento' : 'Guardar Registros'}</button>
                  </div>
              </div>
          </div>
      )}
      
      {/* --- RETURN SELECTION MODAL --- */}
      {isReturnSelectModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] backdrop-blur-sm">
              <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4 border-b pb-4">
                      <div><h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><RotateCcw className="text-orange-600"/> Devolución de Bienes</h3><p className="text-sm text-gray-500">Guía Origen: {returnOriginGuide}</p></div>
                      <button onClick={() => setIsReturnSelectModalOpen(false)}><X className="text-gray-400"/></button>
                  </div>
                  <div className="mb-4 space-y-3">
                      <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">¿Quién devuelve? (Origen)</label><select className="w-full p-2 border border-orange-200 rounded-lg bg-orange-50" value={returnDeliveredBy} onChange={(e) => setReturnDeliveredBy(e.target.value)}><option value="">-- Seleccionar --</option>{tecnicos.map(t => <option key={t.id_dni_tec} value={t.nombre_completo_tec}>{t.nombre_completo_tec}</option>)}</select></div>
                      <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">¿Quién recepciona? (Destino)</label><select className="w-full p-2 border border-orange-200 rounded-lg bg-orange-50" value={returnReceivedBy} onChange={(e) => setReturnReceivedBy(e.target.value)}><option value="">-- Seleccionar --</option>{tecnicos.map(t => <option key={t.id_dni_tec} value={t.nombre_completo_tec}>{t.nombre_completo_tec}</option>)}</select></div>
                  </div>
                  <div className="mb-6 max-h-[40vh] overflow-y-auto">
                      <table className="w-full text-sm"><thead><tr className="bg-orange-50 text-orange-800 text-xs uppercase"><th className="p-2 text-left">Sel</th><th className="p-2 text-left">Ítem</th><th className="p-2 text-center">Cant. Original</th><th className="p-2 text-center">Devolver</th></tr></thead><tbody className="divide-y">{returnCandidates.map((cand, idx) => <tr key={idx} className={cand.seleccionado ? 'bg-orange-50/30' : ''}><td className="p-2 text-center"><input type="checkbox" checked={cand.seleccionado} onChange={() => handleToggleCandidate(idx)}/></td><td className="p-2">{cand.insumo.nombre_insumo}</td><td className="p-2 text-center">{cand.cantidadOriginal}</td><td className="p-2 text-center"><input type="number" min="1" max={cand.cantidadOriginal} value={cand.cantidadADevolver} disabled={!cand.seleccionado} onChange={(e) => handleUpdateCandidateQty(idx, parseInt(e.target.value))} className="w-16 p-1 border rounded text-center"/></td></tr>)}</tbody></table>
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t">
                      <button onClick={() => setIsReturnSelectModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                      <button onClick={handleProceedToReturnPreview} disabled={!returnDeliveredBy || !returnReceivedBy} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50">Generar Acta</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- ANULATE MODAL --- */}
      {isAnulateModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] backdrop-blur-sm">
              <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl">
                  <div className="flex items-center gap-3 mb-4 text-red-600"><AlertTriangle size={32} /><h3 className="text-lg font-bold">Anular {isAnulatingReturn ? 'Devolución' : 'Guía'}</h3></div>
                  <p className="text-sm text-gray-600 mb-4">Se anulará la guía {guideToAnulate} y se revertirá el stock.</p>
                  <select className="w-full p-2 border rounded-lg bg-red-50 mb-6" value={anulateResponsible} onChange={(e) => setAnulateResponsible(parseInt(e.target.value))}><option value="">-- Responsable --</option>{tecnicos.map(t => <option key={t.id_dni_tec} value={t.id_dni_tec}>{t.nombre_completo_tec}</option>)}</select>
                  <div className="flex justify-end gap-2"><button onClick={() => setIsAnulateModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button><button onClick={handleConfirmAnulate} disabled={!anulateResponsible} className="px-4 py-2 bg-red-600 text-white rounded-lg">Confirmar</button></div>
              </div>
          </div>
      )}

      {/* --- DELETE MODAL --- */}
      {isDeleteConfirmOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] backdrop-blur-sm">
              <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">¿Eliminar Registro?</h3>
                  <div className="flex gap-2 justify-end mt-6"><button onClick={() => setIsDeleteConfirmOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">Cancelar</button><button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg">Eliminar</button></div>
              </div>
          </div>
      )}

      {/* --- UPLOAD MODAL --- */}
      {isUploadModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] backdrop-blur-sm">
              <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Upload size={20}/> Adjuntar Cargo</h3>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf,image/*" className="hidden"/>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 mb-4" onClick={() => fileInputRef.current?.click()}>
                      {selectedFileName ? <div className="text-brand-600"><FileCheck size={48} className="mx-auto mb-2"/><p className="font-bold text-sm">{selectedFileName}</p></div> : <div className="text-gray-400"><FileUp size={48} className="mx-auto mb-2"/><p>Seleccionar Documento</p></div>}
                  </div>
                  <div className="flex gap-2 justify-end"><button onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button><button onClick={confirmUpload} disabled={!uploadUrlInput} className="px-4 py-2 bg-brand-600 text-white rounded-lg disabled:opacity-50">Guardar</button></div>
              </div>
          </div>
      )}

      {/* --- VIEWER MODAL --- */}
      {isViewerOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                  <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-gray-700 flex items-center gap-2"><Eye size={20}/> Visor</h3>
                      <div className="flex items-center gap-2">
                          <a href={blobUrl} target="_blank" rel="noreferrer" className="bg-brand-600 text-white px-3 py-1.5 rounded text-sm">Abrir en Pestaña</a>
                          <button onClick={() => setIsViewerOpen(false)}><X size={24}/></button>
                      </div>
                  </div>
                  <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-auto p-4">
                      {blobUrl ? (viewEvidenceUrl.startsWith('data:image') ? <img src={blobUrl} className="max-w-full max-h-full object-contain"/> : <object data={blobUrl} type="application/pdf" className="w-full h-full border bg-white"><div className="flex flex-col items-center justify-center h-full gap-4"><AlertCircle size={48}/><p>Navegador bloqueó la vista previa.</p></div></object>) : <div>Cargando...</div>}
                  </div>
              </div>
          </div>
      )}

      {/* --- PRINT PREVIEW --- */}
      {isPrintPreviewOpen && (
          <div className="fixed inset-0 z-[60] bg-gray-900 overflow-y-auto">
             <div className="min-h-screen flex items-center justify-center p-4">
                 <div className="bg-white w-full max-w-[21cm] min-h-[29.7cm] shadow-2xl mx-auto p-12 relative print:w-full print:p-0">
                     <div className="absolute top-4 right-4 flex gap-2 no-print">
                         <button onClick={() => setIsPrintPreviewOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded">Cerrar</button>
                         <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2"><Printer size={16}/> Imprimir</button>
                         {!isViewOnlyMode && <button onClick={handleConfirmGuide} className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2 font-bold"><Save size={16}/> Confirmar</button>}
                     </div>
                     <div id="inventory-printable-area" className="print-content text-gray-900">
                         <div className="text-center border-b-2 border-black pb-4 mb-6">
                             <h1 className="text-2xl font-bold uppercase tracking-widest">{isReturnMode ? 'Acta de Devolución' : 'Acta de Entrega'}</h1>
                             <p className="text-sm mt-1">Oficina de Gestión de TI</p>
                             <div className="mt-2 font-mono text-sm">N° GUÍA: {currentGuideNumber}</div>
                             <div className={`mt-2 font-bold uppercase text-sm border-2 inline-block px-4 py-1 rounded ${isReturnMode ? 'text-green-800 border-green-800' : 'text-red-700 border-red-700'}`}>{isReturnMode ? 'ENTRADA / DEVOLUCIÓN' : 'SALIDA / ASIGNACIÓN'}</div>
                         </div>
                         <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
                             <div className="border p-4">
                                 <h3 className="font-bold border-b mb-2 pb-1 uppercase text-xs text-gray-500">Origen</h3>
                                 {isReturnMode ? <><p><strong>Establecimiento:</strong> {establecimientos.find(e => e.id_codigo_ipress_estab === Number(guideDestination))?.nombre_estab}</p><p className="mt-1"><strong>Responsable Devolución:</strong> {returnDeliveredBy}</p></> : <p><strong>Entidad:</strong> Oficina General de TI</p>}
                                 {!isReturnMode && <p><strong>Responsable:</strong> {tecnicos.find(t => t.id_dni_tec === Number(guideTech))?.nombre_completo_tec}</p>}
                                 <p><strong>Fecha:</strong> {new Date().toLocaleDateString()}</p>
                             </div>
                             <div className="border p-4">
                                 <h3 className="font-bold border-b mb-2 pb-1 uppercase text-xs text-gray-500">Destino</h3>
                                 {isReturnMode ? <><p><strong>Entidad:</strong> Diris Lima Norte</p><p className="mt-1"><strong>Recepción:</strong> OGTI</p><p className="mt-1"><strong>Recepcionado por:</strong> {guideReceiver}</p></> : <><p><strong>Establecimiento:</strong> {establecimientos.find(e => e.id_codigo_ipress_estab === Number(guideDestination))?.nombre_estab}</p>{guideReceiver && <p className="mt-1"><strong>Recepción:</strong> {guideReceiver}</p>}</>}
                             </div>
                         </div>
                         <table className="w-full text-sm mb-12 border-collapse border border-black">
                             <thead><tr className="bg-gray-100"><th className="border border-black p-2 text-left">Ítem</th><th className="border border-black p-2 text-left">Marca/Modelo</th><th className="border border-black p-2 text-center">Cod. Patrimonial</th><th className="border border-black p-2 text-center">Serie</th><th className="border border-black p-2 text-center">Cant.</th></tr></thead>
                             <tbody>{guideCart.map((item, idx) => <tr key={idx}><td className="border border-black p-2">{item.insumo.nombre_insumo}</td><td className="border border-black p-2">{item.insumo.marca} {item.insumo.modelo}</td><td className="border border-black p-2 text-center font-mono">{item.insumo.codigo_patrimonial || '-'}</td><td className="border border-black p-2 text-center font-mono">{item.insumo.serie || '-'}</td><td className="border border-black p-2 text-center font-bold">{item.cantidad} {item.insumo.unidad_medida}</td></tr>)}</tbody>
                         </table>
                         <div className="mt-48 grid grid-cols-2 gap-12 text-center"><div><div className="border-t border-black w-3/4 mx-auto pt-2"></div><p className="font-bold uppercase text-xs">Entregué Conforme</p></div><div><div className="border-t border-black w-3/4 mx-auto pt-2"></div><p className="font-bold uppercase text-xs">Recibí Conforme</p></div></div>
                     </div>
                 </div>
             </div>
          </div>
      )}
    </div>
  );
};

