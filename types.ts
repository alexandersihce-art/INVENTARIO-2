



export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY', // Establecimientos, Ambientes, Dispositivos, Redes, Inmuebles
  STAFF = 'STAFF', // Personal, Tecnicos
  ACCESS = 'ACCESS', // Usuarios y Roles (Nuevo)
  OPERATIONS = 'OPERATIONS', // Mantenimientos, Software
  SCHEDULE = 'SCHEDULE', // Programacion
  TIMECLOCK = 'TIMECLOCK', // Asistencia
  REPORTS = 'REPORTS',
  DATABASE = 'DATABASE', // Exportador SQL
  SIHCE = 'SIHCE' // Nuevo Modulo SIHCE
}

// --- SIHCE MODULE TYPES ---

export const SIHCE_MODULES = [
    "VIH", "CRED", "Medicina", "Odontología", "Inmunizaciones", 
    "Triaje", "Nutrición", "Atención Prenatal", "Planificación Familiar", 
    "Parto", "Puerperio", "Salud mental", "Salud Familiar", 
    "Laboratorio", "Servicio Social", "Gestión Administrativa", 
    "TAMIZAJE", "Discapacidad", "Citas", "Atención Integral de Salud de Adolescentes",
    "Emergencia", "Farmacia", "FUA ELECTRONICO", "Referencia y Contra referencia", "Imágenes"
];

export interface SihceSolicitud {
    id_solicitud: string;
    fecha_solicitud: string;
    
    // Datos Usuario
    condicion_laboral: 'Locador' | 'Nombrado' | 'Designado' | 'Contratado' | 'SERUM' | 'Interno';
    id_dni_pers: number;
    nombres_apellidos: string;
    tipo_doc: string;
    numero_doc: string;
    celular: string;
    email: string;
    colegiatura?: string;
    rne?: string;

    // Acceso
    perfil: 'Administrador' | 'Implementador' | 'Usuario Final' | 'Soporte Técnico' | 'Otro';
    otro_perfil?: string;
    modulos: string[]; // Multi-select
    
    // Vigencia
    fecha_inicio: string;
    fecha_fin: string;
    justificacion: string;

    // Metadata (Requisitos Pág 1)
    establecimiento_id: number;
    nombre_establecimiento: string;
    tiene_internet_check: boolean; // Verificación conectividad
    tiene_certificado_digital: boolean; // Verificación RENIEC (Simulada)
    
    estado: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Accesos Entregados';
    fecha_entrega?: string;
}

export interface SihceParticipante {
    nombre: string;
    dni: string;
    cargo: string;
    // Optional fields depending on context (Training vs Meeting)
    modulo?: string; 
    hora?: string; 
    entidad?: string;
    email?: string;
    firma?: boolean;
    firmaUrl?: string; // New field for signature image (Base64)
}

export interface SihceCapacitacion {
    id_capacitacion: string;
    fecha: string;
    hora: string;
    lugar: string;
    cod_renipress: string;
    tema: string; 
    participantes: SihceParticipante[];
}

export interface SihceReunion {
    id_reunion: string;
    fecha: string;
    hora: string;
    lugar: string;
    tema: string;
    participantes: SihceParticipante[];
    objetivos: string;
    acuerdos: string;
    comentarios: string;
}

// --- ESTRUCTURA BASE DE DATOS (DBML MAPPING) ---

export const RIS_OPTIONS = [
  "RIMAC", 
  "INDEPENDENCIA", 
  "SAN MARTIN DE PORRES", 
  "LOS OLIVOS", 
  "COMAS", 
  "CARABAYLLO", 
  "PUENTE PIEDRA-ANCON SANTA ROSA", 
  "DIRIS LIMA NORTE"
];

export const SERVICE_AREAS = [
  "RR.HH",
  "ADMISION",
  "ARCHIVO",
  "CAJA RECAUDACION",
  "TRIAJE",
  "MEDICINA",
  "OBSTETRICIA",
  "CRED",
  "INMUNIZACIONES",
  "PSICOLOGIA",
  "NUTRICION",
  "ODONTOLOGIA",
  "MATERNO",
  "ESTADISTICA",
  "SEGUROS",
  "PAUS",
  "PROMSA",
  "ALMACEN LOGISTICA",
  "ALMACEN DE FARMACIA",
  "FARMACIA",
  "EMERGENCIA",
  "URGENCIA",
  "TOPICO",
  "LABORATORIO",
  "ECOGRAFIA",
  "RAYOS X",
  "ACOGIDA",
  "EVALUACION INTEGRAL",
  "PSIQUIATRIA",
  "TERAPIA DE LENGUAJE",
  "TERAPIA OCUPACIONAL",
  "ENFERMERIA PSICOEDUCACION",
  "SERVICIO SOCIAL",
  "SAMA",
  "REFERENCIAS",
  "TELESALUD",
  "TBC - TUBERCULOSIS",
  "JEFATURA MEDICA",
  "CAPACITACION",
  "SECRETARIA",
  "SERVICIOS EN SALUD",
  "SALUD SEXUAL",
  "PREVENCION DE CANCER",
  "ITS VIH SIDA",
  "SALUD MENTAL",
  "CALIDAD Y DERECHOS A LAS PERSONAS",
  "MEDICAMENTOS INSUMOS Y DROGAS",
  "SALUD AMBIENTAL",
  "ETAPA VIDA ADULTO",
  "ADULTO MAYOR",
  "VIDA ADOLESCENTE",
  "DAÑOS NO TRANSMISIBLES",
  "ETAPA VIDA NIÑO",
  "DISCAPACIDAD",
  "SALUD FAMILIAR",
  "SALUD BUCAL",
  "RIESGO Y DESASTRE",
  "EPIDEMIOLOGIA"
];

// Listas iniciales por defecto (pueden crecer dinamicamente)
export const DEFAULT_DEVICE_TYPES = ['PC', 'Laptop', 'All-in-One', 'Impresora', 'Switch', 'Mouse', 'Teclado', 'Monitor', 'Escaner', 'Proyector', 'Tablet'];
export const DEFAULT_FURNITURE_TYPES = ['Escritorio', 'Silla Giratoria', 'Silla Fija', 'Mesa de Reuniones', 'Armario', 'Estante', 'Ventilador', 'Camilla', 'Vitrina', 'Archivador'];
export const DEFAULT_ACTIVITY_TYPES = ['Mantenimiento', 'Cableado', 'Soporte', 'Guardia', 'Administrativo', 'Otro'];

// Listas para Personal
export const ACADEMIC_DEGREES = [
  'Secundaria Completa',
  'Estudiante Técnico',
  'Técnico Medio',
  'Técnico Superior',
  'Estudiante Universitario',
  'Bachiller',
  'Titulado',
  'Magister',
  'Doctorado'
];

export const COMMON_JOB_TITLES = [
  'Médico Cirujano',
  'Enfermero(a)',
  'Técnico en Enfermería',
  'Obstetra',
  'Odontólogo',
  'Psicólogo',
  'Nutricionista',
  'Tecnólogo Médico',
  'Químico Farmacéutico',
  'Trabajador Social',
  'Administrativo',
  'Soporte Técnico',
  'Analista de Sistemas',
  'Jefe de TI',
  'Coordinador',
  'Abogado',
  'Contador',
  'Logístico',
  'Director'
];

export interface Establecimiento {
  id_codigo_ipress_estab: number;
  nombre_estab: string;
  ris_estab: string;
  medico_jefe?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  coordenadas?: string;
}

export interface Ambiente {
  id_amb: number;
  id_codigo_ipress_estab: number;
  nombre_servicio_amb: string;
  nombre_area_amb: string;
  tipo_ambiente_amb: string;
  toma_electrica_amb: 'Si' | 'No';
  punto_red_amb: 'Si' | 'No';
  estado_amb: 'Operativo' | 'Inoperativo' | 'Mantenimiento';
}

export interface Insumo {
  id_insumo: number;
  nombre_insumo: string;
  tipo_insumo: 'Herramienta' | 'Material' | 'Accesorio' | 'Otro';
  cantidad: number;
  unidad_medida: string;
  estado_insumo: 'Nuevo' | 'Usado' | 'Baja' | 'Prestado';
  ubicacion_fisica?: string;
  descripcion?: string;
  fecha_registro?: string;
  
  codigo_patrimonial?: string;
  anio_patrimonial?: number;
  marca?: string;
  modelo?: string;
  serie?: string;
}

export interface MovimientoInsumo {
  id_movimiento: number;
  id_insumo: number;
  fecha_movimiento: string;
  hora_movimiento?: string;
  tipo_movimiento: 'Entrada' | 'Salida';
  cantidad: number;
  id_dni_responsable?: number;
  observacion: string;
  
  id_codigo_ipress_estab_destino?: number;
  nro_guia?: string;
  evidencia_url?: string;
  nombre_receptor?: string;
  nombre_entrega?: string;
  
  estado_movimiento?: 'Activo' | 'Anulado';
  id_dni_anulacion?: number;
}

export interface GuiaSalidaItem {
  insumo: Insumo;
  cantidad: number;
}

export interface Dispositivo {
  id_codigo_patrimonial_disp_e: number;
  codigo_margesi?: string; // Nuevo campo Margesi
  anio_patrimonial: number;
  id_amb: number;
  // Tipo ahora es string para permitir dinámicos
  tipo_dispositivo_disp_e: string; 
  serie_disp_e: string;
  marca_disp_e: string;
  modelo_disp_e: string;
  estado__disp_e: 'Bueno' | 'Regular' | 'Malo' | 'Baja';
  id_red?: number;
  
  cod_patrimonial_padre?: number;
  anio_patrimonial_padre?: number;
}

// Nueva Interfaz para Bienes Patrimoniales (Inmuebles/Muebles)
export interface Inmueble {
  id_inmueble: number; // ID interno o autogenerado
  codigo_patrimonial: string;
  codigo_margesi?: string;
  anio_patrimonial: number;
  tipo_inmueble: string; // Mesa, Silla, Ventilador...
  marca?: string;
  modelo?: string;
  color?: string;
  dimensiones?: string;
  estado: 'Bueno' | 'Regular' | 'Malo' | 'Baja';
  
  // Ubicación
  id_amb: number; // Link al ambiente -> Establecimiento
}

export interface RedInternet {
  id_red: number;
  id_codigo_ipress_estab: number;
  proveedor_red: string;
  velocidad_red: string;
}

export interface Tecnico {
  id_dni_tec: number;
  nombre_completo_tec: string;
  cargo_tec: string;
  grado_academico?: string;
  carrera?: string;
  oficina?: string; // Nuevo campo para oficina
  fecha_registro?: string;
  email_tec: string;
  telefono_tec: string;
}

export interface Personal {
  id_dni_pers: number;
  nombre_completo_pers: string;
  cargo_pers: string;
  grado_academico?: string;
  carrera?: string;
  fecha_registro?: string;
  email_pers?: string;
  telefono_pers?: string;
  id_codigo_ipress_estab: number;
  id_amb?: number;
}

export interface Usuario {
  id_usuario: number;
  id_dni_tec?: number; // Link a tecnico (Sede Central)
  id_dni_pers?: number; // Link a personal (IPRESS)
  nombre_usuario: string;
  contrasena_usuario: string;
  id_rol: number;
  estado: 'Activo' | 'Inactivo';
}

export interface PermissionNode {
    id: string;
    label: string;
    children?: PermissionNode[];
}

export const SYSTEM_PERMISSIONS: PermissionNode[] = [
    { id: 'VIEW_DASHBOARD', label: 'Panel General' },
    { 
        id: 'VIEW_INVENTORY', 
        label: 'Gestión de Activos',
        children: [
            { id: 'VIEW_INV_DEVICES', label: 'Dispositivos Electrónicos' },
            { id: 'VIEW_INV_FURNITURE', label: 'Bien Patrimonial' },
            { id: 'VIEW_INV_ESTAB', label: 'Establecimientos' },
            { id: 'VIEW_INV_NETWORKS', label: 'Proveedores (Redes)' },
            { id: 'VIEW_INV_ROOMS', label: 'Ambientes' },
            { id: 'VIEW_INV_TOOLS', label: 'Herramientas e Insumos' },
        ]
    },
    { id: 'VIEW_OPERATIONS', label: 'Operaciones' },
    { 
        id: 'VIEW_STAFF', 
        label: 'Gestión de Personal',
        children: [
            { id: 'VIEW_STAFF_CENTRAL', label: 'P. Administrativo Sede Central' },
            { id: 'VIEW_STAFF_IPRESS', label: 'P. Administrativo IPRESS' },
        ]
    },
    { id: 'VIEW_ACCESS', label: 'Seguridad y Accesos' },
    { id: 'VIEW_SCHEDULE', label: 'Programación' },
    { id: 'VIEW_TIMECLOCK', label: 'Control de Asistencia' },
    { id: 'VIEW_REPORTS', label: 'Reportes IA' },
    { id: 'VIEW_DATABASE', label: 'Exportación BD' },
    { id: 'VIEW_SIHCE', label: 'Gestión SIHCE' },
];

export interface Rol {
    id_rol: number;
    nombre_rol: string;
    permisos: string[]; // List of permission IDs
}

// Flat list helper for initialization
const ALL_PERM_IDS = SYSTEM_PERMISSIONS.reduce((acc, curr) => {
    acc.push(curr.id);
    if(curr.children) curr.children.forEach(c => acc.push(c.id));
    return acc;
}, [] as string[]);

export const ROLES_SYSTEM: Rol[] = [
    { id_rol: 1, nombre_rol: 'Administrador', permisos: ALL_PERM_IDS },
    { id_rol: 2, nombre_rol: 'Soporte', permisos: ['VIEW_DASHBOARD', 'VIEW_INVENTORY', 'VIEW_INV_DEVICES', 'VIEW_OPERATIONS'] },
    { id_rol: 3, nombre_rol: 'Coordinador', permisos: ALL_PERM_IDS.filter(p => p !== 'VIEW_ACCESS') },
    { id_rol: 4, nombre_rol: 'Invitado', permisos: ['VIEW_DASHBOARD'] }
];

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  active: boolean;
}

export const ROLES = ['Admin', 'Manager', 'Technician', 'User'];

export interface Mantenimiento {
  id_mant: string;
  fecha_mant: string;
  created_at?: number;
  id_codigo_ipress_estab: number;
  id_codigo_patrimonial_disp_e: number;
  tipo_dispositivo_disp_e?: string;
  
  marca_manual?: string;
  modelo_manual?: string;
  serie_manual?: string;
  
  motivo_visita_tecnica: string;
  diagnostico: string;
  tipo_mant: 'Preventivo' | 'Correctivo';
  
  actividades_realizadas: string;
  materiales_utilizados: string;
  recomendaciones: string;
  
  id_dni_tec_1: number; 
  id_dni_tec_2?: number;
  id_dni_tec_3?: number;
  id_dni_tec_4?: number;
  
  id_dni_pers?: number; 
  nombre_personal_conformidad?: string;

  evidencia_url?: string;
  estado_mant: 'Activo' | 'Anulado';
  id_dni_anulacion?: number;
}

export interface ProgramacionPersonal {
  id_programacion: string;
  id_dni_tec: number;
  fecha_programacion_inicio: string;
  fecha_programacion_fin?: string;
  hora_programacion_inicio: string;
  hora_programacion_fin: string;
  turno_programacion: 'Mañana' | 'Tarde' | 'Noche' | 'Guardia';
  establecimiento: string; // Puede mantenerse como string de respaldo o nombre
  id_codigo_ipress_estab?: number; // Link a tabla establecimientos
  id_amb?: number; // Link a tabla ambientes
  tarea_programacion?: string;
  tipo_actividad?: string; // Changed from enum to string to allow dynamic values
  
  // CAMPOS DE AUDITORÍA
  estado?: 'Activo' | 'Anulado' | 'Eliminado';
  id_dni_auditoria?: number; // Quien hizo el ultimo cambio (anulacion/edicion)
  nombre_auditoria?: string; // Nombre helper
  motivo_cambio?: string;
  fecha_cambio?: string;
}

export interface ControlAsistencia {
  id_asistencia: string;
  id_dni_tec: number;
  fecha_asistencia: string;
  hora_asistencia: string;
  tipo_registro_asistencia: 'Entrada' | 'Salida';
  ubicacion_asistencia: string;
  latitud?: number;
  longitud?: number;
  nota?: string;
}

// --- MOCK DATA ---

export const MOCK_TECNICOS: Tecnico[] = [
  { id_dni_tec: 45896321, nombre_completo_tec: 'Juan Perez', cargo_tec: 'Soporte N1', grado_academico: 'Técnico Superior', carrera: 'Computación e Informática', oficina: 'Oficina TI', fecha_registro: '2023-01-15', email_tec: 'juan@it.com', telefono_tec: '999888777' },
  { id_dni_tec: 12345678, nombre_completo_tec: 'Maria Lopez', cargo_tec: 'Administrador Red', grado_academico: 'Titulado', carrera: 'Ingeniería de Sistemas', oficina: 'Oficina TI', fecha_registro: '2023-02-20', email_tec: 'maria@it.com', telefono_tec: '999111222' },
];

export const MOCK_PERSONAL_SALUD: Personal[] = [
    { id_dni_pers: 77788899, nombre_completo_pers: 'Dr. Roberto Gomez', cargo_pers: 'Médico Jefe', grado_academico: 'Magister', carrera: 'Medicina Humana', fecha_registro: '2022-05-10', id_codigo_ipress_estab: 1001, email_pers: 'rgomez@minsa.gob.pe', telefono_pers: '999666333' },
    { id_dni_pers: 44455566, nombre_completo_pers: 'Lic. Ana Solis', cargo_pers: 'Enfermera Jefa', grado_academico: 'Titulado', carrera: 'Enfermería', fecha_registro: '2022-06-15', id_codigo_ipress_estab: 1002, email_pers: 'asolis@minsa.gob.pe', telefono_pers: '999222111' }
];

export const MOCK_USUARIOS: Usuario[] = [
    { id_usuario: 1, id_dni_tec: 45896321, nombre_usuario: 'jperez', contrasena_usuario: '123456', id_rol: 1, estado: 'Activo' },
    { id_usuario: 2, id_dni_tec: 12345678, nombre_usuario: 'mlopez', contrasena_usuario: '123456', id_rol: 3, estado: 'Activo' },
    { id_usuario: 3, id_dni_pers: 77788899, nombre_usuario: 'rgomez', contrasena_usuario: '123456', id_rol: 4, estado: 'Activo' }
];

export const MOCK_ESTABLECIMIENTOS: Establecimiento[] = [
  { 
    id_codigo_ipress_estab: 1001, 
    nombre_estab: 'C.S. Rímac', 
    ris_estab: 'RIMAC', 
    medico_jefe: 'Dr. Roberto Gomez',
    telefono: '01-481-2233',
    email: 'jefatura@csrimac.gob.pe',
    direccion: 'Av. Alcazar 123',
    coordenadas: '-12.029, -77.031'
  },
  { 
    id_codigo_ipress_estab: 1002, 
    nombre_estab: 'C.M.I. Los Olivos', 
    ris_estab: 'LOS OLIVOS',
    medico_jefe: 'Dra. Ana Solis',
    telefono: '01-521-4455',
    email: 'direccion@cmilosolivos.gob.pe',
    direccion: 'Av. Las Palmeras 450',
    coordenadas: '-11.980, -77.070'
  },
];

export const MOCK_AMBIENTES: Ambiente[] = [
  { id_amb: 1, id_codigo_ipress_estab: 1001, nombre_servicio_amb: 'MEDICINA', nombre_area_amb: 'Consultorio 1', tipo_ambiente_amb: 'Consultorio', toma_electrica_amb: 'Si', punto_red_amb: 'Si', estado_amb: 'Operativo' },
  { id_amb: 2, id_codigo_ipress_estab: 1001, nombre_servicio_amb: 'ADMISION', nombre_area_amb: 'Ventanilla 2', tipo_ambiente_amb: 'Oficina', toma_electrica_amb: 'Si', punto_red_amb: 'Si', estado_amb: 'Operativo' }
];

export const MOCK_INSUMOS: Insumo[] = [
  { id_insumo: 1, nombre_insumo: 'Cable UTP Cat6', tipo_insumo: 'Material', cantidad: 300, unidad_medida: 'Metros', estado_insumo: 'Nuevo', ubicacion_fisica: 'Almacén Central', marca: 'Satra', fecha_registro: '2023-10-01' },
  { id_insumo: 2, nombre_insumo: 'Crimping Tool RJ45', tipo_insumo: 'Herramienta', cantidad: 1, unidad_medida: 'Unidad', estado_insumo: 'Usado', ubicacion_fisica: 'Mochila Soporte', codigo_patrimonial: 'H-001', anio_patrimonial: 2022, marca: 'Stanley', modelo: 'Pro', serie: 'SN9988', fecha_registro: '2023-05-15' },
  { id_insumo: 3, nombre_insumo: 'Conectores RJ45', tipo_insumo: 'Accesorio', cantidad: 100, unidad_medida: 'Unidades', estado_insumo: 'Nuevo', ubicacion_fisica: 'Almacén Central', marca: 'Belden', fecha_registro: '2023-10-10' }
];

export const MOCK_MOVIMIENTOS: MovimientoInsumo[] = [
    { id_movimiento: 1, id_insumo: 1, fecha_movimiento: '2023-10-20', hora_movimiento: '14:30:00', tipo_movimiento: 'Salida', cantidad: 50, id_dni_responsable: 45896321, observacion: 'Cableado Cons. 1', id_codigo_ipress_estab_destino: 1001, nro_guia: 'G-001', estado_movimiento: 'Activo', nombre_receptor: 'Lic. Juanita' }
];

export const MOCK_DISPOSITIVOS: Dispositivo[] = [
  { 
    id_codigo_patrimonial_disp_e: 741258, 
    codigo_margesi: 'M-1001',
    anio_patrimonial: 2023,
    id_amb: 1, 
    tipo_dispositivo_disp_e: 'PC', 
    serie_disp_e: 'SN001', 
    marca_disp_e: 'Lenovo', 
    modelo_disp_e: 'ThinkCentre', 
    estado__disp_e: 'Bueno' 
  },
  { 
    id_codigo_patrimonial_disp_e: 963852, 
    codigo_margesi: 'M-1002',
    anio_patrimonial: 2024,
    id_amb: 1, 
    tipo_dispositivo_disp_e: 'Impresora', 
    serie_disp_e: 'SN002', 
    marca_disp_e: 'Epson', 
    modelo_disp_e: 'L3150', 
    estado__disp_e: 'Regular',
    cod_patrimonial_padre: 741258,
    anio_patrimonial_padre: 2023
  },
];

export const MOCK_INMUEBLES: Inmueble[] = [
  {
      id_inmueble: 1,
      codigo_patrimonial: '748596',
      codigo_margesi: 'M-5001',
      anio_patrimonial: 2022,
      tipo_inmueble: 'Escritorio',
      marca: 'Muebles SA',
      color: 'Melamine Haya',
      estado: 'Bueno',
      id_amb: 1 // Consultorio 1 en Rimac
  }
];

export const MOCK_REDES: RedInternet[] = [
  { id_red: 1, id_codigo_ipress_estab: 1001, proveedor_red: 'Movistar Negocios', velocidad_red: '200 Mbps' },
  { id_red: 2, id_codigo_ipress_estab: 1002, proveedor_red: 'Claro Fibra', velocidad_red: '100 Mbps' },
];

export const MOCK_MANTENIMIENTOS: Mantenimiento[] = [
  { 
    id_mant: '2023-0001', 
    fecha_mant: '2023-10-25', 
    created_at: 1698200000000, 
    id_codigo_ipress_estab: 1001, 
    id_codigo_patrimonial_disp_e: 741258, 
    motivo_visita_tecnica: 'Lentitud en equipo', 
    diagnostico: 'Disco duro lleno', 
    tipo_mant: 'Correctivo', 
    actividades_realizadas: 'Limpieza de temporales', 
    materiales_utilizados: 'Ninguno',
    recomendaciones: 'Comprar SSD', 
    id_dni_tec_1: 45896321,
    estado_mant: 'Activo'
  }
];