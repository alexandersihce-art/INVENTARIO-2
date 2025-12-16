
import React, { useState } from 'react';
import { 
    SihceSolicitud, SihceCapacitacion, SihceParticipante, SihceReunion,
    Personal, Establecimiento, RedInternet, SIHCE_MODULES 
} from '../types';
import { 
    FileBadge, UserPlus, Key, GraduationCap, 
    Search, Plus, Printer, CheckCircle2, 
    Wifi, WifiOff, FileCheck, Shield, Eye, X, Users, Upload, Trash2, Edit
} from 'lucide-react';

interface SihceViewProps {
    solicitudes: SihceSolicitud[];
    setSolicitudes: React.Dispatch<React.SetStateAction<SihceSolicitud[]>>;
    capacitaciones: SihceCapacitacion[];
    setCapacitaciones: React.Dispatch<React.SetStateAction<SihceCapacitacion[]>>;
    reuniones: SihceReunion[];
    setReuniones: React.Dispatch<React.SetStateAction<SihceReunion[]>>;
    personalSalud: Personal[];
    establecimientos: Establecimiento[];
    redes: RedInternet[];
}

export const SihceView: React.FC<SihceViewProps> = ({
    solicitudes, setSolicitudes,
    capacitaciones, setCapacitaciones,
    reuniones, setReuniones,
    personalSalud, establecimientos, redes
}) => {
    const [activeTab, setActiveTab] = useState<'SOLICITUD' | 'ENTREGA' | 'CAPACITACION' | 'REUNION'>('SOLICITUD');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // CRUD States
    const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
    const [editingId, setEditingId] = useState<string | null>(null);

    // --- STATES FOR SOLICITUD FORM ---
    const initialSolicitud: Partial<SihceSolicitud> = {
        fecha_solicitud: new Date().toISOString().split('T')[0],
        condicion_laboral: 'Locador',
        perfil: 'Usuario Final',
        modulos: [],
        tiene_internet_check: false,
        tiene_certificado_digital: false,
        tipo_doc: 'DNI', // Default
        nombres_apellidos: '',
        numero_doc: '',
        email: '',
        justificacion: ''
    };
    const [formSolicitud, setFormSolicitud] = useState<Partial<SihceSolicitud>>(initialSolicitud);
    const [personSearch, setPersonSearch] = useState('');
    const [showPersonSuggestions, setShowPersonSuggestions] = useState(false);

    // --- STATES FOR CAPACITACION FORM ---
    const initialCapacitacion: Partial<SihceCapacitacion> = {
        fecha: new Date().toISOString().split('T')[0],
        participantes: []
    };
    const [formCapacitacion, setFormCapacitacion] = useState<Partial<SihceCapacitacion>>(initialCapacitacion);
    
    // --- STATES FOR REUNION FORM ---
    const initialReunion: Partial<SihceReunion> = {
        fecha: new Date().toISOString().split('T')[0],
        hora: '09:00',
        participantes: []
    };
    const [formReunion, setFormReunion] = useState<Partial<SihceReunion>>(initialReunion);

    const [newPart, setNewPart] = useState<Partial<SihceParticipante>>({});

    // --- HELPERS ---
    const getInternetStatus = (idEstab: number) => {
        const red = redes.find(r => r.id_codigo_ipress_estab === idEstab);
        return !!red;
    };

    const handleSelectPerson = (p: Personal) => {
        const estab = establecimientos.find(e => e.id_codigo_ipress_estab === p.id_codigo_ipress_estab);
        const hasNet = estab ? getInternetStatus(estab.id_codigo_ipress_estab) : false;
        
        setFormSolicitud({
            ...formSolicitud,
            id_dni_pers: p.id_dni_pers,
            nombres_apellidos: p.nombre_completo_pers,
            tipo_doc: 'DNI',
            numero_doc: p.id_dni_pers.toString(),
            celular: p.telefono_pers || '',
            email: p.email_pers || '',
            establecimiento_id: p.id_codigo_ipress_estab,
            nombre_establecimiento: estab?.nombre_estab || '',
            tiene_internet_check: hasNet,
            tiene_certificado_digital: Math.random() > 0.5 // Simulación RENIEC
        });
        setPersonSearch(p.nombre_completo_pers);
        setShowPersonSuggestions(false);
    };

    const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewPart({ ...newPart, firmaUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveSignature = () => {
        setNewPart({ ...newPart, firmaUrl: undefined });
    };

    // --- OPEN MODALS FOR EDIT ---
    const handleOpenEditSolicitud = (s: SihceSolicitud) => {
        setModalMode('EDIT');
        setEditingId(s.id_solicitud);
        setFormSolicitud(s);
        setPersonSearch(s.nombres_apellidos);
        setIsModalOpen(true);
    };

    const handleOpenEditCapacitacion = (c: SihceCapacitacion) => {
        setModalMode('EDIT');
        setEditingId(c.id_capacitacion);
        setFormCapacitacion(c);
        setIsModalOpen(true);
    };

    const handleOpenEditReunion = (r: SihceReunion) => {
        setModalMode('EDIT');
        setEditingId(r.id_reunion);
        setFormReunion(r);
        setIsModalOpen(true);
    };

    // --- OPEN MODALS FOR CREATE ---
    const handleOpenCreate = () => {
        setModalMode('CREATE');
        setEditingId(null);
        if (activeTab === 'SOLICITUD') {
            setFormSolicitud(initialSolicitud);
            setPersonSearch('');
        } else if (activeTab === 'CAPACITACION') {
            setFormCapacitacion(initialCapacitacion);
            setNewPart({});
        } else if (activeTab === 'REUNION') {
            setFormReunion(initialReunion);
            setNewPart({});
        } else if (activeTab === 'ENTREGA') {
            // Entrega creates a Solicitud but defaults to 'Accesos Entregados' status logic if needed, 
            // but usually we create a solicitud first. We'll reuse the solicitud form.
            setFormSolicitud({ ...initialSolicitud, estado: 'Accesos Entregados', fecha_entrega: new Date().toISOString().split('T')[0] });
            setPersonSearch('');
        }
        setIsModalOpen(true);
    };

    // --- SAVE HANDLERS ---
    const handleSaveSolicitud = () => {
        if (modalMode === 'CREATE') {
            const newReq: SihceSolicitud = {
                ...formSolicitud,
                id_solicitud: Math.random().toString(36).substr(2, 9),
                // If created from Entrega tab, default to approved
                estado: activeTab === 'ENTREGA' ? 'Accesos Entregados' : 'Pendiente'
            } as SihceSolicitud;
            setSolicitudes([...solicitudes, newReq]);
        } else {
            setSolicitudes(solicitudes.map(s => s.id_solicitud === editingId ? { ...formSolicitud, id_solicitud: editingId } as SihceSolicitud : s));
        }
        setIsModalOpen(false);
    };

    const handleSaveCapacitacion = () => {
        if (modalMode === 'CREATE') {
            const newCap: SihceCapacitacion = {
                ...formCapacitacion,
                id_capacitacion: Math.random().toString(36).substr(2, 9),
                tema: 'DESPLIEGUE DEL SIHCE DEL MINSA'
            } as SihceCapacitacion;
            setCapacitaciones([...capacitaciones, newCap]);
        } else {
            setCapacitaciones(capacitaciones.map(c => c.id_capacitacion === editingId ? { ...formCapacitacion, id_capacitacion: editingId } as SihceCapacitacion : c));
        }
        setIsModalOpen(false);
    };

    const handleSaveReunion = () => {
        if (modalMode === 'CREATE') {
            const newMeet: SihceReunion = {
                ...formReunion,
                id_reunion: Math.random().toString(36).substr(2, 9)
            } as SihceReunion;
            setReuniones([...reuniones, newMeet]);
        } else {
            setReuniones(reuniones.map(r => r.id_reunion === editingId ? { ...formReunion, id_reunion: editingId } as SihceReunion : r));
        }
        setIsModalOpen(false);
    };

    // --- DELETE HANDLERS ---
    const handleDeleteSolicitud = (id: string) => {
        if (confirm('¿Está seguro de eliminar este registro?')) {
            setSolicitudes(solicitudes.filter(s => s.id_solicitud !== id));
        }
    };

    const handleDeleteCapacitacion = (id: string) => {
        if (confirm('¿Está seguro de eliminar esta capacitación?')) {
            setCapacitaciones(capacitaciones.filter(c => c.id_capacitacion !== id));
        }
    };

    const handleDeleteReunion = (id: string) => {
        if (confirm('¿Está seguro de eliminar esta reunión?')) {
            setReuniones(reuniones.filter(r => r.id_reunion !== id));
        }
    };

    const handleEntregaAcceso = (req: SihceSolicitud) => {
        const updated = solicitudes.map(s => s.id_solicitud === req.id_solicitud ? { ...s, estado: 'Accesos Entregados' as const, fecha_entrega: new Date().toISOString().split('T')[0] } : s);
        setSolicitudes(updated);
    };

    const toggleModulo = (mod: string) => {
        const current = formSolicitud.modulos || [];
        if (current.includes(mod)) {
            setFormSolicitud({ ...formSolicitud, modulos: current.filter(m => m !== mod) });
        } else {
            setFormSolicitud({ ...formSolicitud, modulos: [...current, mod] });
        }
    };

    // =================================================================================
    // PRINTING FUNCTIONS (5 SPECIFIC ACTAS)
    // =================================================================================

    // 1. ACTA DE SOLICITUD
    const printSolicitud = (req: SihceSolicitud) => {
        const win = window.open('', '_blank');
        if(!win) return;
        
        const checked = (val: boolean) => val ? '&#9745;' : '&#9744;';
        
        // Modules grid
        const modulesHtml = SIHCE_MODULES.map(m => 
            `<div style="display:inline-block; width:32%; font-size:10px; margin-bottom:2px;">
                ${req.modulos.includes(m) ? '&#9745;' : '&#9744;'} ${m}
             </div>`
        ).join('');

        win.document.write(`
            <html><head><title>Acta Solicitud</title></head><body style="font-family: Arial, serif; padding: 40px; max-width: 800px; margin: auto;">
                <h2 style="text-align: center; margin-bottom: 5px;">Acta de SOLICITUD creación de usuario SIHCE</h2>
                <h3 style="text-align: center; margin-bottom: 20px; border-bottom: 1px solid #000;">FORMATO DE SOLICITUD</h3>
                
                <div style="margin-bottom: 15px; font-size: 12px;">
                    <strong>Tipo de Solicitud:</strong> ${checked(true)} Creación ${checked(false)} Baja ${checked(false)} Modificación ${checked(false)} Renovación
                </div>

                <fieldset style="border: 1px solid #000; padding: 10px; margin-bottom: 15px;">
                    <legend style="font-weight: bold; font-size: 13px;">Datos del Usuario Solicitado</legend>
                    <div style="font-size: 12px; line-height: 1.6;">
                        <div><strong>Condición laboral:</strong> 
                            ${checked(req.condicion_laboral === 'Locador')} Locador 
                            ${checked(req.condicion_laboral === 'Nombrado')} Nombrado 
                            ${checked(req.condicion_laboral === 'Designado')} Designado 
                            ${checked(req.condicion_laboral === 'Contratado')} Contratado 
                            ${checked(req.condicion_laboral === 'SERUM')} SERUM
                        </div>
                        <div><strong>Nombres y Apellidos:</strong> ${req.nombres_apellidos}</div>
                        <div><strong>Tipo de Documento:</strong> ${req.tipo_doc} <strong>Número:</strong> ${req.numero_doc}</div>
                        <div><strong>N° Celular:</strong> ${req.celular}</div>
                        <div><strong>Correo Electrónico:</strong> ${req.email}</div>
                        <div><strong>N° de Colegiatura:</strong> ${req.colegiatura || ''} <strong>RNE:</strong> ${req.rne || ''}</div>
                    </div>
                </fieldset>

                <fieldset style="border: 1px solid #000; padding: 10px; margin-bottom: 15px;">
                    <legend style="font-weight: bold; font-size: 13px;">Detalle del Acceso Solicitado</legend>
                    <div style="font-size: 12px; line-height: 1.6;">
                        <div style="margin-bottom: 5px;"><strong>Perfil Solicitado:</strong> 
                            ${checked(req.perfil === 'Administrador')} Administrador 
                            ${checked(req.perfil === 'Implementador')} Implementador 
                            ${checked(req.perfil === 'Usuario Final')} Usuario Final 
                            ${checked(req.perfil === 'Soporte Técnico')} Soporte Técnico
                        </div>
                        <div style="margin-bottom: 5px;"><strong>Sistema Solicitado:</strong> SIHCE</div>
                        <div style="margin-bottom: 5px;"><strong>Módulo / Sub módulo Solicitado:</strong></div>
                        <div style="border: 1px solid #ccc; padding: 5px;">${modulesHtml}</div>
                        <div style="margin-top: 10px;">
                            <strong>Vigencia:</strong> Fecha de inicio: ${req.fecha_solicitud} &nbsp;&nbsp; Fecha fin: ____________
                        </div>
                    </div>
                </fieldset>

                <div style="font-size: 12px; margin-bottom: 40px;">
                    <strong>Justificación de la Solicitud:</strong> ${req.justificacion}
                </div>

                <div style="display: flex; justify-content: space-between; text-align: center; font-size: 12px; margin-top: 60px;">
                    <div style="width: 45%;">
                        <div style="border-top: 1px solid #000; padding-top: 5px;">Firma del Solicitante</div>
                        <div>DNI: ${req.numero_doc}</div>
                    </div>
                    <div style="width: 45%;">
                        <div style="border-top: 1px solid #000; padding-top: 5px;">Firma del Funcionario que autoriza</div>
                        <div>(Medico Jefe o RRHH)</div>
                    </div>
                </div>
                <div style="text-align: right; font-size: 12px; margin-top: 20px;">Fecha: ${req.fecha_solicitud}</div>
                <script>setTimeout(()=>window.print(),500)</script>
            </body></html>
        `);
    };

    // 2. ACTA DE CONFIDENCIALIDAD
    const printConfidencialidad = (req: SihceSolicitud) => {
        const win = window.open('', '_blank');
        if(!win) return;
        
        const date = new Date();
        const checked = (val: boolean) => val ? '&#9745;' : '&#9744;';

        win.document.write(`
            <html><head><title>Compromiso Confidencialidad</title></head><body style="font-family: Times New Roman, serif; padding: 50px; max-width: 800px; margin: auto; font-size: 14px;">
                <h3 style="text-align: center; font-weight: bold;">Acta de compromiso de confidencialidad de datos personales al usar el sistema SIHCE</h3>
                <h2 style="text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 30px;">COMPROMISO DE CONFIDENCIALIDAD</h2>
                
                <div style="margin-bottom: 20px;">
                    Ciudad: Lima, ___ de ________ del ______.
                </div>

                <div style="margin-bottom: 10px;">
                    El (La) suscrito(a): <strong>${req.nombres_apellidos}</strong>
                </div>
                <div style="margin-bottom: 10px;">
                    Cargo: _________________________________________________________________
                </div>
                <div style="margin-bottom: 20px;">
                    Dependencia: <strong>DIRIS LIMA NORTE</strong><br/>
                    Condición laboral: 
                    ${checked(req.condicion_laboral === 'Locador')} Locador 
                    ${checked(req.condicion_laboral === 'Nombrado')} Nombrado 
                    ${checked(req.condicion_laboral === 'Contratado')} Contratado 
                    ${checked(req.condicion_laboral === 'SERUM')} SERUM
                </div>

                <p><strong>Se obliga a lo siguiente:</strong></p>

                <p style="text-align: justify;">
                    Por mi vínculo laboral con el IPRESS N° <strong>${req.establecimiento_id}</strong> con nombre del E.E.S.S. <strong>${req.nombre_establecimiento}</strong>, 
                    y en atención a las funciones que desempeño, se me otorga acceso al sistema solicitado, bajo el perfil asignado. Este acceso comprende el uso de tecnologías, documentos, datos, especificaciones, métodos, procesos e información a los que tenga acceso, de forma directa e indirecta, como consecuencia del acceso brindado. Me comprometo a mantener absoluta confidencialidad sobre toda esta información.
                </p>

                <p style="text-align: justify;">
                    En tal sentido, me comprometo a utilizar dicha información exclusivamente en el marco de mis funciones, y a no divulgar, revelar, comunicar, transmitir, grabar, duplicar, copiar ni reproducir, por ningún medio, sin la autorización expresa y por escrito del titular de la información. Así mismo asumiré la responsabilidad de impedir que documentos e información que contengan datos personales sensibles sean visualizados, reproducidos o manipulados por personas no autorizadas por el titular o usuario de salud correspondiente.
                </p>

                <p style="text-align: justify;">
                    En caso de tratamiento de datos personales, me obligo a almacenarlos y gestionarlos exclusivamente en los medios y formatos autorizados por la Entidad.
                </p>

                <p style="text-align: justify;">
                    Reconozco que el incumplimiento de este compromiso podrá conllevar responsabilidades administrativas, civiles y penales, conforme a lo establecido en la Ley N° 29733 - Ley de Protección de Datos Personales y su normativa complementaria.
                </p>

                <div style="margin-top: 80px; width: 300px;">
                    <div style="border-top: 1px solid #000; text-align: center; padding-top: 5px;">
                        <strong>${req.nombres_apellidos}</strong><br/>
                        DNI: ${req.numero_doc}
                    </div>
                </div>
                <script>setTimeout(()=>window.print(),500)</script>
            </body></html>
        `);
    };

    // 3. ACTA DE ENTREGA DE ACCESOS
    const printEntrega = (req: SihceSolicitud) => {
        const win = window.open('', '_blank');
        if(!win) return;
        
        const checked = (val: boolean) => val ? '&#9745;' : '&#9744;';
        const modulesHtml = SIHCE_MODULES.map(m => 
            `<div style="display:inline-block; width:32%; font-size:10px; margin-bottom:2px;">
                ${req.modulos.includes(m) ? '&#9745;' : '&#9744;'} ${m}
             </div>`
        ).join('');

        win.document.write(`
            <html><head><title>Acta Entrega</title></head><body style="font-family: Arial, serif; padding: 40px; max-width: 800px; margin: auto;">
                <h2 style="text-align: center; margin-bottom: 5px;">Acta de entrega de accesos de usuario.</h2>
                <h3 style="text-align: center; margin-bottom: 20px; border-bottom: 1px solid #000;">FORMATO DE ENTREGA DE ACCESOS</h3>
                
                <fieldset style="border: 1px solid #000; padding: 10px; margin-bottom: 15px;">
                    <legend style="font-weight: bold; font-size: 13px;">Datos del Usuario Solicitado</legend>
                    <div style="font-size: 12px; line-height: 1.6;">
                        <div><strong>Nombres y Apellidos:</strong> ${req.nombres_apellidos}</div>
                        <div><strong>Tipo de Documento:</strong> ${req.tipo_doc} <strong>Número:</strong> ${req.numero_doc}</div>
                        <div><strong>Correo Electrónico:</strong> ${req.email}</div>
                    </div>
                </fieldset>

                <fieldset style="border: 1px solid #000; padding: 10px; margin-bottom: 15px;">
                    <legend style="font-weight: bold; font-size: 13px;">Detalle del Acceso Entregado</legend>
                    <div style="font-size: 12px; line-height: 1.6;">
                        <div style="margin-bottom: 5px;"><strong>Perfil:</strong> ${req.perfil}</div>
                        <div style="margin-bottom: 5px;"><strong>Sistema:</strong> SIHCE</div>
                        <div style="margin-bottom: 5px;"><strong>Módulos Activados:</strong></div>
                        <div style="border: 1px solid #ccc; padding: 5px;">${modulesHtml}</div>
                    </div>
                </fieldset>

                <div style="font-size: 12px; margin-bottom: 40px;">
                    <strong>Entrega de accesos de la Solicitud:</strong> (Indica el motivo de la solicitud)<br/>
                    <div style="border-bottom: 1px solid #000; min-height: 20px; margin-top: 5px;">${req.justificacion || ''}</div>
                </div>

                <div style="display: flex; justify-content: space-between; text-align: center; font-size: 12px; margin-top: 60px;">
                    <div style="width: 45%;">
                        <div style="border-top: 1px solid #000; padding-top: 5px;">Firma del Solicitante</div>
                        <div>Documento de identificación: ${req.numero_doc}</div>
                    </div>
                    <div style="width: 45%;">
                        <div style="border-top: 1px solid #000; padding-top: 5px;">Firma del Funcionario que autoriza</div>
                        <div>(Implementador SIHCE)</div>
                    </div>
                </div>
                <div style="text-align: right; font-size: 12px; margin-top: 20px;">Fecha: ${req.fecha_entrega || new Date().toLocaleDateString()}</div>
                <script>setTimeout(()=>window.print(),500)</script>
            </body></html>
        `);
    };

    // 4. ACTA DE REUNION
    const printReunion = (reu: SihceReunion) => {
        const win = window.open('', '_blank');
        if(!win) return;
        
        // 10 empty rows min
        const rows = reu.participantes.map((p, i) => `<tr>
            <td style="border:1px solid #000; padding:5px; text-align:center;">${i+1}</td>
            <td style="border:1px solid #000; padding:5px;">${p.nombre}</td>
            <td style="border:1px solid #000; padding:5px;">${p.entidad || ''}</td>
            <td style="border:1px solid #000; padding:5px;">${p.dni}</td>
            <td style="border:1px solid #000; padding:5px;">${p.cargo}</td>
            <td style="border:1px solid #000; padding:5px;">${p.email || ''}</td>
            <td style="border:1px solid #000; padding:2px; text-align:center; vertical-align: middle;">
                ${p.firmaUrl ? `<img src="${p.firmaUrl}" style="max-height:40px; max-width:100px; display:block; margin:0 auto;" />` : ''}
            </td>
        </tr>`).join('');
        
        const emptyRows = Array(Math.max(0, 10 - reu.participantes.length)).fill(0).map((_, i) => `<tr><td style="border:1px solid #000; padding:15px; text-align:center;">${reu.participantes.length + i + 1}</td><td style="border:1px solid #000;"></td><td style="border:1px solid #000;"></td><td style="border:1px solid #000;"></td><td style="border:1px solid #000;"></td><td style="border:1px solid #000;"></td><td style="border:1px solid #000;"></td></tr>`).join('');

        win.document.write(`
            <html><head><title>Acta Reunion</title>
            <style>
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            </style>
            </head><body style="font-family: Arial, serif; padding: 20px; max-width: 900px; margin: auto;">
                
                <!-- HEADER CON LOGOS (SIMULADO) -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom: 2px solid #ccc; padding-bottom:10px;">
                    <div style="font-size:10px; font-weight:bold; color:#555;">PERÚ - Ministerio de Salud</div>
                    <div style="font-size:10px; font-weight:bold; color:#555;">Dirección de Redes Integradas de Salud Lima Norte</div>
                </div>

                <div style="text-align: center; margin-bottom: 10px; font-size: 14px; font-weight:bold;">
                    Acta de reunión con los establecimientos de DIRIS LIMA NORTE
                </div>
                
                <h2 style="text-align: center; margin-bottom: 20px; color: #b91c1c; text-decoration:underline;">ACTA DE REUNIÓN SIHCE DEL MINSA</h2>
                
                <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px;">
                    <tr>
                        <td style="border: 1px solid #000; padding: 10px; font-weight: bold; background: #e5e7eb; width: 100px;">TEMA</td>
                        <td colspan="3" style="border: 1px solid #000; padding: 10px;">${reu.tema}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #000; padding: 10px; font-weight: bold; background: #e5e7eb;">LUGAR</td>
                        <td style="border: 1px solid #000; padding: 10px;">${reu.lugar}</td>
                        <td style="border: 1px solid #000; padding: 10px; font-weight: bold; background: #e5e7eb; width: 100px;">FECHA Y HORA</td>
                        <td style="border: 1px solid #000; padding: 10px;">${reu.fecha} ${reu.hora}</td>
                    </tr>
                </table>

                <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
                    <thead>
                        <tr style="background: #991b1b; color: white;">
                            <th style="border: 1px solid #000; padding: 8px;">N°</th>
                            <th style="border: 1px solid #000; padding: 8px;">PARTICIPANTE</th>
                            <th style="border: 1px solid #000; padding: 8px;">ENTIDAD</th>
                            <th style="border: 1px solid #000; padding: 8px;">DNI</th>
                            <th style="border: 1px solid #000; padding: 8px;">CARGO</th>
                            <th style="border: 1px solid #000; padding: 8px;">EMAIL</th>
                            <th style="border: 1px solid #000; padding: 8px; width: 120px;">FIRMA</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                        ${emptyRows}
                    </tbody>
                </table>

                <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 10px;">
                    <tr><td style="border: 1px solid #000; padding: 5px; background: #991b1b; color: white; text-align: center; font-weight:bold;">OBJETIVO(S) DE LA REUNIÓN</td></tr>
                    <tr><td style="border: 1px solid #000; padding: 10px; height: 80px; vertical-align: top;">${reu.objetivos}</td></tr>
                </table>

                <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 10px;">
                    <tr><td style="border: 1px solid #000; padding: 5px; background: #991b1b; color: white; text-align: center; font-weight:bold;">ACUERDOS</td></tr>
                    <tr><td style="border: 1px solid #000; padding: 10px; height: 80px; vertical-align: top;">${reu.acuerdos}</td></tr>
                </table>

                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <tr><td style="border: 1px solid #000; padding: 5px; background: #991b1b; color: white; text-align: center; font-weight:bold;">COMENTARIOS</td></tr>
                    <tr><td style="border: 1px solid #000; padding: 10px; height: 80px; vertical-align: top;">${reu.comentarios}</td></tr>
                </table>

                <script>setTimeout(()=>window.print(),500)</script>
            </body></html>
        `);
    };

    // 5. ACTA DE CAPACITACION
    const printCapacitacion = (cap: SihceCapacitacion) => {
        const win = window.open('', '_blank');
        if(!win) return;
        const rows = cap.participantes.map((p, i) => `<tr><td style="border:1px solid #000; padding:5px; text-align:center;">${i+1}</td><td style="border:1px solid #000; padding:5px;">${p.nombre}</td><td style="border:1px solid #000; padding:5px;">${p.dni}</td><td style="border:1px solid #000; padding:5px;">${p.modulo || ''}</td><td style="border:1px solid #000; padding:5px;">${p.cargo}</td><td style="border:1px solid #000; padding:5px;">${p.hora || ''}</td><td style="border:1px solid #000; padding:5px;"></td></tr>`).join('');
        const emptyRows = Array(Math.max(0, 15 - cap.participantes.length)).fill(0).map((_, i) => `<tr><td style="border:1px solid #000; padding:12px; text-align:center;">${cap.participantes.length + i + 1}</td><td style="border:1px solid #000;"></td><td style="border:1px solid #000;"></td><td style="border:1px solid #000;"></td><td style="border:1px solid #000;"></td><td style="border:1px solid #000;"></td><td style="border:1px solid #000;"></td></tr>`).join('');

        win.document.write(`
            <html><head><title>Acta Capacitación</title></head><body style="font-family: Arial, serif; padding: 20px; max-width: 900px; margin: auto;">
                <h2 style="text-align: center; margin-bottom: 5px;">ACTA DE CAPACITACIÓN</h2>
                <h3 style="text-align: center; margin-bottom: 20px;">DESPLIEGUE DEL SIHCE DEL MINSA</h3>
                
                <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; border: 1px solid #000;">
                    <tr style="background: #333366; color: white;">
                        <td style="padding: 5px; border: 1px solid #fff;">COD. RENIPRESS</td>
                        <td style="padding: 5px; border: 1px solid #fff; background: white; color: black;">${cap.cod_renipress}</td>
                        <td style="padding: 5px; border: 1px solid #fff; text-align: right;">FECHA</td>
                        <td style="padding: 5px; border: 1px solid #fff; background: white; color: black; width: 100px;">${cap.fecha}</td>
                    </tr>
                    <tr style="background: #333366; color: white;">
                        <td style="padding: 5px; border: 1px solid #fff;">LUGAR</td>
                        <td colspan="3" style="padding: 5px; border: 1px solid #fff; background: white; color: black;">${cap.lugar}</td>
                    </tr>
                </table>

                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background: #333366; color: white;">
                            <th style="border: 1px solid #000; padding: 5px;">N°</th>
                            <th style="border: 1px solid #000; padding: 5px;">NOMBRES Y APELLIDOS</th>
                            <th style="border: 1px solid #000; padding: 5px;">DNI</th>
                            <th style="border: 1px solid #000; padding: 5px;">MODULO</th>
                            <th style="border: 1px solid #000; padding: 5px;">CARGO</th>
                            <th style="border: 1px solid #000; padding: 5px;">HORA</th>
                            <th style="border: 1px solid #000; padding: 5px;">FIRMA</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                        ${emptyRows}
                    </tbody>
                </table>

                <div style="margin-top: 20px; font-size: 12px;">Firma/Sello:</div>

                <div style="display: flex; justify-content: space-around; text-align: center; font-size: 11px; margin-top: 80px;">
                     <div style="width: 30%;">
                        <div style="border-top: 1px solid #000; padding-top: 5px;">Médico Jefe del Establecimiento de Salud</div>
                     </div>
                     <div style="width: 30%;">
                        <div style="border-top: 1px solid #000; padding-top: 5px;">Representante de DIRESA/GERESA/DIRIS</div>
                     </div>
                     <div style="width: 30%;">
                        <div style="border-top: 1px solid #000; padding-top: 5px;">Representante de OGTI MINSA</div>
                     </div>
                </div>
                <script>setTimeout(()=>window.print(),500)</script>
            </body></html>
        `);
    };

    return (
        <div className="p-8 h-full overflow-y-auto bg-slate-50">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FileBadge className="text-brand-600"/> Gestión SIHCE
                </h2>
                <p className="text-gray-500">Administración de usuarios, accesos y capacitaciones del Sistema Integrado.</p>
            </div>

            <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button onClick={() => setActiveTab('SOLICITUD')} className={`px-4 py-2 flex items-center gap-2 font-medium rounded-t-lg transition-colors ${activeTab === 'SOLICITUD' ? 'bg-white text-brand-600 border-t border-x border-gray-200 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
                    <UserPlus size={16}/> Solicitudes
                </button>
                <button onClick={() => setActiveTab('ENTREGA')} className={`px-4 py-2 flex items-center gap-2 font-medium rounded-t-lg transition-colors ${activeTab === 'ENTREGA' ? 'bg-white text-green-600 border-t border-x border-gray-200 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
                    <Key size={16}/> Accesos
                </button>
                <button onClick={() => setActiveTab('REUNION')} className={`px-4 py-2 flex items-center gap-2 font-medium rounded-t-lg transition-colors ${activeTab === 'REUNION' ? 'bg-white text-red-600 border-t border-x border-gray-200 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
                    <Users size={16}/> Reuniones
                </button>
                <button onClick={() => setActiveTab('CAPACITACION')} className={`px-4 py-2 flex items-center gap-2 font-medium rounded-t-lg transition-colors ${activeTab === 'CAPACITACION' ? 'bg-white text-purple-600 border-t border-x border-gray-200 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
                    <GraduationCap size={16}/> Capacitaciones
                </button>
            </div>

            {/* --- CONTENIDO SOLICITUDES --- */}
            {activeTab === 'SOLICITUD' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input type="text" placeholder="Buscar solicitud..." className="w-full pl-8 py-2 border rounded-lg text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <button onClick={handleOpenCreate} className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-brand-700">
                            <Plus size={16}/> Nueva Solicitud
                        </button>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 border-b">
                            <tr><th>Fecha</th><th>Personal</th><th>Perfil</th><th>Verificaciones</th><th>Estado</th><th className="text-right">Acciones</th></tr>
                        </thead>
                        <tbody className="divide-y">
                            {solicitudes.filter(s => s.nombres_apellidos.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                                <tr key={s.id_solicitud} className="hover:bg-gray-50">
                                    <td className="py-3 px-2">{s.fecha_solicitud}</td>
                                    <td className="py-3 px-2">
                                        <div className="font-bold">{s.nombres_apellidos}</div>
                                        <div className="text-xs text-gray-500">{s.nombre_establecimiento}</div>
                                    </td>
                                    <td className="py-3 px-2"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{s.perfil}</span></td>
                                    <td className="py-3 px-2">
                                        <div className="flex gap-2">
                                            {s.tiene_internet_check ? <Wifi size={14} className="text-green-500" title="Internet OK"/> : <WifiOff size={14} className="text-red-500" title="Sin Internet"/>}
                                            {s.tiene_certificado_digital ? <FileCheck size={14} className="text-green-500" title="Cert. Digital OK"/> : <FileCheck size={14} className="text-gray-300" title="Sin Certificado"/>}
                                        </div>
                                    </td>
                                    <td className="py-3 px-2"><span className={`px-2 py-1 rounded-full text-xs font-bold ${s.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{s.estado}</span></td>
                                    <td className="py-3 px-2 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenEditSolicitud(s)} className="p-1.5 text-gray-400 hover:text-brand-600 rounded hover:bg-gray-100" title="Editar"><Edit size={14}/></button>
                                            <button onClick={() => handleDeleteSolicitud(s.id_solicitud)} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50" title="Eliminar"><Trash2 size={14}/></button>
                                            <div className="w-px bg-gray-300 mx-1"></div>
                                            <button onClick={() => printSolicitud(s)} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" title="Imprimir Acta de Solicitud (1)"><Printer size={14}/></button>
                                            <button onClick={() => printConfidencialidad(s)} className="p-1.5 bg-gray-50 text-gray-600 rounded hover:bg-gray-100" title="Imprimir Acta de Confidencialidad (2)"><Shield size={14}/></button>
                                            {s.estado === 'Pendiente' && <button onClick={() => handleEntregaAcceso(s)} className="p-1.5 text-green-600 rounded hover:bg-green-50" title="Entregar Accesos"><CheckCircle2 size={14}/></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- CONTENIDO ENTREGAS (ACCESOS) --- */}
            {activeTab === 'ENTREGA' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700">Registro de Accesos Entregados</h3>
                        <button onClick={handleOpenCreate} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-green-700">
                            <Plus size={16}/> Registrar Entrega
                        </button>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-green-50 text-green-800 border-b border-green-100">
                            <tr><th>Fecha Entrega</th><th>Usuario</th><th>Perfil</th><th>Módulos</th><th className="text-right">Acciones</th></tr>
                        </thead>
                        <tbody className="divide-y">
                            {solicitudes.filter(s => s.estado === 'Accesos Entregados').map(s => (
                                <tr key={s.id_solicitud} className="hover:bg-gray-50">
                                    <td className="py-3 px-2">{s.fecha_entrega}</td>
                                    <td className="py-3 px-2 font-bold">{s.nombres_apellidos}</td>
                                    <td className="py-3 px-2">{s.perfil}</td>
                                    <td className="py-3 px-2"><div className="flex flex-wrap gap-1">{s.modulos.map(m => <span key={m} className="px-1 bg-gray-100 text-[10px] rounded border">{m}</span>)}</div></td>
                                    <td className="py-3 px-2 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenEditSolicitud(s)} className="p-1.5 text-gray-400 hover:text-green-600 rounded hover:bg-green-50" title="Editar"><Edit size={14}/></button>
                                            <button onClick={() => handleDeleteSolicitud(s.id_solicitud)} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50" title="Eliminar"><Trash2 size={14}/></button>
                                            <div className="w-px bg-gray-300 mx-1"></div>
                                            
                                            {/* ADDED CONFIDENTIALITY ACT BUTTON HERE */}
                                            <button onClick={() => printConfidencialidad(s)} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 border border-gray-300" title="Imprimir Acta Confidencialidad"><Shield size={14}/> Confidenc.</button>
                                            
                                            <button onClick={() => printEntrega(s)} className="flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 ml-auto"><Key size={14}/> Acta Entrega (3)</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- CONTENIDO REUNIONES --- */}
            {activeTab === 'REUNION' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700">Reuniones con Establecimientos</h3>
                        <button onClick={handleOpenCreate} className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-red-700">
                            <Plus size={16}/> Nueva Reunión
                        </button>
                    </div>
                    <div className="space-y-4">
                        {reuniones.map(reu => (
                            <div key={reu.id_reunion} className="border rounded-lg p-4 hover:shadow-md transition-shadow flex justify-between items-center bg-gray-50">
                                <div>
                                    <div className="font-bold text-lg text-gray-800">{reu.tema}</div>
                                    <div className="text-sm text-gray-500">{reu.lugar} - {reu.fecha} {reu.hora}</div>
                                    <div className="text-xs text-gray-400 mt-1">{reu.participantes.length} Participantes</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleOpenEditReunion(reu)} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded" title="Editar"><Edit size={16}/></button>
                                    <button onClick={() => handleDeleteReunion(reu.id_reunion)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Eliminar"><Trash2 size={16}/></button>
                                    <div className="w-px bg-gray-300 h-6 mx-1"></div>
                                    <button onClick={() => printReunion(reu)} className="flex items-center gap-2 bg-white border border-gray-300 px-3 py-2 rounded text-gray-700 hover:bg-gray-100 text-sm font-bold">
                                        <Users size={16}/> Acta Reunión (4)
                                    </button>
                                </div>
                            </div>
                        ))}
                        {reuniones.length === 0 && <div className="text-center text-gray-400 py-8">No hay reuniones registradas.</div>}
                    </div>
                </div>
            )}

            {/* --- CONTENIDO CAPACITACIONES --- */}
            {activeTab === 'CAPACITACION' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700">Sesiones de Capacitación</h3>
                        <button onClick={handleOpenCreate} className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-purple-700">
                            <Plus size={16}/> Nueva Sesión
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {capacitaciones.map(cap => (
                            <div key={cap.id_capacitacion} className="border rounded-xl p-4 hover:shadow-md transition-shadow relative">
                                <div className="absolute top-4 right-4 flex gap-1">
                                    <button onClick={() => handleOpenEditCapacitacion(cap)} className="p-1 text-gray-400 hover:text-brand-600" title="Editar"><Edit size={14}/></button>
                                    <button onClick={() => handleDeleteCapacitacion(cap.id_capacitacion)} className="p-1 text-gray-400 hover:text-red-600" title="Eliminar"><Trash2 size={14}/></button>
                                </div>
                                <div className="font-bold text-lg text-gray-800 mb-1 pr-12">{cap.tema}</div>
                                <div className="text-xs text-gray-500 mb-3 flex gap-4">
                                    <span>{cap.fecha} {cap.hora}</span>
                                    <span>{cap.lugar}</span>
                                </div>
                                <div className="bg-purple-50 p-2 rounded text-xs text-purple-700 mb-3">
                                    <strong>Participantes:</strong> {cap.participantes.length} inscritos
                                </div>
                                <button onClick={() => printCapacitacion(cap)} className="w-full py-2 border border-purple-200 text-purple-700 rounded hover:bg-purple-50 flex justify-center items-center gap-2 text-sm font-bold">
                                    <GraduationCap size={16}/> Acta Capacitación (5)
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- MODAL FORMS --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b">
                            <h3 className="font-bold text-lg">
                                {modalMode === 'CREATE' ? 'Nueva' : 'Editar'} {
                                    activeTab === 'SOLICITUD' ? 'Solicitud' : 
                                    activeTab === 'ENTREGA' ? 'Entrega de Acceso' :
                                    activeTab === 'REUNION' ? 'Reunión' : 'Capacitación'
                                }
                            </h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400"/></button>
                        </div>

                        {/* FORM SOLICITUD (USED FOR BOTH SOLICITUD AND ENTREGA TABS) */}
                        {(activeTab === 'SOLICITUD' || activeTab === 'ENTREGA') && (
                            <div className="space-y-4">
                                <div className="relative">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Buscar Personal (Autocompletar)</label>
                                    <input type="text" className="w-full border p-2 rounded text-sm" placeholder="Nombre..." value={personSearch} onChange={e => { setPersonSearch(e.target.value); setShowPersonSuggestions(true); }} />
                                    {showPersonSuggestions && (
                                        <div className="absolute z-10 w-full bg-white border mt-1 max-h-40 overflow-y-auto shadow-lg">
                                            {personalSalud.filter(p => p.nombre_completo_pers.toLowerCase().includes(personSearch.toLowerCase())).map(p => (
                                                <div key={p.id_dni_pers} className="p-2 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => handleSelectPerson(p)}>
                                                    {p.nombre_completo_pers}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* ADDED MANUAL FIELDS TO FILL UNDEFINED DATA */}
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Tipo Documento</label>
                                        <select className="w-full border p-2 rounded text-sm" value={formSolicitud.tipo_doc || 'DNI'} onChange={e => setFormSolicitud({...formSolicitud, tipo_doc: e.target.value})}>
                                            <option value="DNI">DNI</option>
                                            <option value="CE">CE</option>
                                            <option value="PASAPORTE">PASAPORTE</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Número Documento</label>
                                        <input type="text" className="w-full border p-2 rounded text-sm" value={formSolicitud.numero_doc || ''} onChange={e => setFormSolicitud({...formSolicitud, numero_doc: e.target.value})}/>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Nombres y Apellidos</label>
                                        <input type="text" className="w-full border p-2 rounded text-sm" value={formSolicitud.nombres_apellidos || ''} onChange={e => setFormSolicitud({...formSolicitud, nombres_apellidos: e.target.value})}/>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Correo Electrónico</label>
                                        <input type="email" className="w-full border p-2 rounded text-sm" value={formSolicitud.email || ''} onChange={e => setFormSolicitud({...formSolicitud, email: e.target.value})}/>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Condición Laboral</label><select className="w-full border p-2 rounded text-sm" value={formSolicitud.condicion_laboral} onChange={e => setFormSolicitud({...formSolicitud, condicion_laboral: e.target.value as any})}> <option value="Locador">Locador</option> <option value="Nombrado">Nombrado</option> <option value="Contratado">Contratado</option> </select></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Perfil</label><select className="w-full border p-2 rounded text-sm" value={formSolicitud.perfil} onChange={e => setFormSolicitud({...formSolicitud, perfil: e.target.value as any})}> <option value="Usuario Final">Usuario Final</option> <option value="Administrador">Administrador</option> <option value="Soporte Técnico">Soporte Técnico</option> </select></div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2">Módulos Requeridos</label>
                                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border p-2 rounded">
                                        {SIHCE_MODULES.map(m => (
                                            <label key={m} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded">
                                                <input type="checkbox" checked={formSolicitud.modulos?.includes(m)} onChange={() => toggleModulo(m)} className="rounded text-brand-600"/>
                                                {m}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">Justificación / Motivo de Solicitud</label><input type="text" className="w-full border p-2 rounded text-sm" value={formSolicitud.justificacion || ''} onChange={e => setFormSolicitud({...formSolicitud, justificacion: e.target.value})} placeholder="Ej. Nuevo personal de admisión"/></div>
                                
                                {activeTab === 'ENTREGA' && (
                                    <div className="bg-green-50 p-3 rounded border border-green-200">
                                        <label className="block text-xs font-bold text-green-700 mb-1">Fecha de Entrega</label>
                                        <input type="date" className="w-full border p-2 rounded text-sm" value={formSolicitud.fecha_entrega || ''} onChange={e => setFormSolicitud({...formSolicitud, fecha_entrega: e.target.value})} />
                                    </div>
                                )}

                                <button onClick={handleSaveSolicitud} className="w-full bg-brand-600 text-white py-2 rounded font-bold hover:bg-brand-700 mt-4">
                                    {modalMode === 'CREATE' ? (activeTab === 'ENTREGA' ? 'Registrar Entrega' : 'Guardar Solicitud') : 'Actualizar Registro'}
                                </button>
                            </div>
                        )}

                        {/* FORM CAPACITACION */}
                        {activeTab === 'CAPACITACION' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Fecha</label><input type="date" className="w-full border p-2 rounded text-sm" value={formCapacitacion.fecha} onChange={e => setFormCapacitacion({...formCapacitacion, fecha: e.target.value})} /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Hora</label><input type="time" className="w-full border p-2 rounded text-sm" value={formCapacitacion.hora || ''} onChange={e => setFormCapacitacion({...formCapacitacion, hora: e.target.value})} /></div>
                                </div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">Lugar</label><input type="text" className="w-full border p-2 rounded text-sm" value={formCapacitacion.lugar || ''} onChange={e => setFormCapacitacion({...formCapacitacion, lugar: e.target.value})} /></div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">Cod. Renipress</label><input type="text" className="w-full border p-2 rounded text-sm" value={formCapacitacion.cod_renipress || ''} onChange={e => setFormCapacitacion({...formCapacitacion, cod_renipress: e.target.value})} /></div>
                                
                                <div className="border-t pt-4">
                                    <h4 className="font-bold text-sm mb-2">Agregar Participante</h4>
                                    <div className="flex gap-2 mb-2">
                                        <input type="text" placeholder="Nombre" className="border p-1 rounded text-xs flex-1" value={newPart.nombre || ''} onChange={e => setNewPart({...newPart, nombre: e.target.value})}/>
                                        <input type="text" placeholder="DNI" className="border p-1 rounded text-xs w-20" value={newPart.dni || ''} onChange={e => setNewPart({...newPart, dni: e.target.value})}/>
                                        <input type="text" placeholder="Módulo" className="border p-1 rounded text-xs w-20" value={newPart.modulo || ''} onChange={e => setNewPart({...newPart, modulo: e.target.value})}/>
                                        <button onClick={() => { if(newPart.nombre){ setFormCapacitacion({...formCapacitacion, participantes: [...(formCapacitacion.participantes||[]), newPart as SihceParticipante]}); setNewPart({}); } }} className="bg-green-600 text-white px-2 rounded text-xs"><Plus size={14}/></button>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                                        {formCapacitacion.participantes?.map((p, i) => (
                                            <div key={i} className="text-xs border-b py-1 flex justify-between items-center">
                                                <span>{p.nombre} ({p.modulo})</span>
                                                <button onClick={() => {
                                                    const updated = formCapacitacion.participantes?.filter((_, idx) => idx !== i);
                                                    setFormCapacitacion({...formCapacitacion, participantes: updated});
                                                }} className="text-red-500 hover:text-red-700"><Trash2 size={12}/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={handleSaveCapacitacion} className="w-full bg-purple-600 text-white py-2 rounded font-bold hover:bg-purple-700 mt-4">
                                    {modalMode === 'CREATE' ? 'Guardar Sesión' : 'Actualizar Sesión'}
                                </button>
                            </div>
                        )}

                        {/* FORM REUNION */}
                        {activeTab === 'REUNION' && (
                            <div className="space-y-4">
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">Tema</label><input type="text" className="w-full border p-2 rounded text-sm" value={formReunion.tema || ''} onChange={e => setFormReunion({...formReunion, tema: e.target.value})} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Fecha</label><input type="date" className="w-full border p-2 rounded text-sm" value={formReunion.fecha} onChange={e => setFormReunion({...formReunion, fecha: e.target.value})} /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Hora</label><input type="time" className="w-full border p-2 rounded text-sm" value={formReunion.hora || ''} onChange={e => setFormReunion({...formReunion, hora: e.target.value})} /></div>
                                </div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">Lugar</label><input type="text" className="w-full border p-2 rounded text-sm" value={formReunion.lugar || ''} onChange={e => setFormReunion({...formReunion, lugar: e.target.value})} /></div>
                                
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">Objetivos</label><textarea className="w-full border p-2 rounded text-sm h-16" value={formReunion.objetivos || ''} onChange={e => setFormReunion({...formReunion, objetivos: e.target.value})}></textarea></div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">Acuerdos</label><textarea className="w-full border p-2 rounded text-sm h-16" value={formReunion.acuerdos || ''} onChange={e => setFormReunion({...formReunion, acuerdos: e.target.value})}></textarea></div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">Comentarios</label><textarea className="w-full border p-2 rounded text-sm h-16" value={formReunion.comentarios || ''} onChange={e => setFormReunion({...formReunion, comentarios: e.target.value})}></textarea></div>

                                <div className="border-t pt-4">
                                    <h4 className="font-bold text-sm mb-2">Agregar Participante</h4>
                                    <div className="flex gap-2 items-center mb-2 flex-wrap">
                                        <input type="text" placeholder="Nombre" className="border p-1 rounded text-xs flex-1" value={newPart.nombre || ''} onChange={e => setNewPart({...newPart, nombre: e.target.value})}/>
                                        <input type="text" placeholder="Entidad" className="border p-1 rounded text-xs w-20" value={newPart.entidad || ''} onChange={e => setNewPart({...newPart, entidad: e.target.value})}/>
                                        <input type="text" placeholder="DNI" className="border p-1 rounded text-xs w-16" value={newPart.dni || ''} onChange={e => setNewPart({...newPart, dni: e.target.value})}/>
                                        <input type="text" placeholder="Cargo" className="border p-1 rounded text-xs w-20" value={newPart.cargo || ''} onChange={e => setNewPart({...newPart, cargo: e.target.value})}/>
                                        <label className={`cursor-pointer border p-1 rounded flex items-center justify-center ${newPart.firmaUrl ? 'bg-green-100 border-green-300 text-green-700' : 'bg-gray-100 hover:bg-gray-200'}`} title="Adjuntar Firma (Imagen)">
                                            {newPart.firmaUrl ? <CheckCircle2 size={14}/> : <Upload size={14}/>}
                                            <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload}/>
                                        </label>
                                        {newPart.firmaUrl && (
                                            <button onClick={handleRemoveSignature} className="bg-red-100 text-red-600 p-1 rounded hover:bg-red-200" title="Borrar firma">
                                                <Trash2 size={14}/>
                                            </button>
                                        )}
                                        <button onClick={() => { if(newPart.nombre){ setFormReunion({...formReunion, participantes: [...(formReunion.participantes||[]), newPart as SihceParticipante]}); setNewPart({}); } }} className="bg-red-600 text-white px-2 py-1 rounded text-xs"><Plus size={14}/></button>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                                        {formReunion.participantes?.map((p, i) => (
                                            <div key={i} className="text-xs border-b py-1 flex justify-between items-center">
                                                <span>{p.nombre} ({p.entidad})</span>
                                                <div className="flex items-center gap-2">
                                                    {p.firmaUrl && <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1 rounded border border-green-200">Firma OK</span>}
                                                    <button onClick={() => {
                                                        const updated = formReunion.participantes?.filter((_, idx) => idx !== i);
                                                        setFormReunion({...formReunion, participantes: updated});
                                                    }} className="text-red-500 hover:text-red-700"><Trash2 size={12}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={handleSaveReunion} className="w-full bg-red-600 text-white py-2 rounded font-bold hover:bg-red-700 mt-4">
                                    {modalMode === 'CREATE' ? 'Guardar Reunión' : 'Actualizar Reunión'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
