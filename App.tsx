






import React, { useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { InventoryView } from './components/InventoryView';
import { OperationsView } from './components/OperationsView';
import { StaffView } from './components/StaffView';
import { AccessView } from './components/AccessView';
import { Scheduler } from './components/Scheduler';
import { TimeClock } from './components/TimeClock';
import { ReportGenerator } from './components/ReportGenerator';
import { DatabaseExport } from './components/DatabaseExport';
import { SihceView } from './components/SihceView'; // IMPORTED
import { 
  ViewState, 
  Tecnico, 
  Establecimiento, 
  Dispositivo, 
  Mantenimiento, 
  ProgramacionPersonal,
  ControlAsistencia,
  RedInternet,
  Ambiente,
  Insumo,
  MovimientoInsumo,
  Inmueble,
  Personal,
  Usuario,
  Rol,
  SihceSolicitud,    
  SihceCapacitacion, 
  SihceReunion, // IMPORTED
  MOCK_TECNICOS,
  MOCK_ESTABLECIMIENTOS,
  MOCK_DISPOSITIVOS,
  MOCK_MANTENIMIENTOS,
  MOCK_REDES,
  MOCK_AMBIENTES,
  MOCK_INSUMOS,
  MOCK_MOVIMIENTOS,
  MOCK_INMUEBLES,
  MOCK_PERSONAL_SALUD,
  MOCK_USUARIOS,
  ROLES_SYSTEM,
  SERVICE_AREAS,
  DEFAULT_DEVICE_TYPES,
  DEFAULT_FURNITURE_TYPES,
  DEFAULT_ACTIVITY_TYPES
} from './types';
import { LayoutDashboard, Monitor, Wrench, Users, User, AlertTriangle, TrendingUp, Activity, Bell, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  
  // Estado Centralizado (Simulando Base de Datos)
  const [tecnicos, setTecnicos] = useState<Tecnico[]>(MOCK_TECNICOS);
  const [personalSalud, setPersonalSalud] = useState<Personal[]>(MOCK_PERSONAL_SALUD);
  const [usuarios, setUsuarios] = useState<Usuario[]>(MOCK_USUARIOS);
  const [roles, setRoles] = useState<Rol[]>(ROLES_SYSTEM); 
  const [establecimientos, setEstablecimientos] = useState<Establecimiento[]>(MOCK_ESTABLECIMIENTOS);
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>(MOCK_DISPOSITIVOS);
  const [redes, setRedes] = useState<RedInternet[]>(MOCK_REDES);
  const [ambientes, setAmbientes] = useState<Ambiente[]>(MOCK_AMBIENTES);
  const [insumos, setInsumos] = useState<Insumo[]>(MOCK_INSUMOS);
  const [inmuebles, setInmuebles] = useState<Inmueble[]>(MOCK_INMUEBLES);
  const [movimientosInsumos, setMovimientosInsumos] = useState<MovimientoInsumo[]>(MOCK_MOVIMIENTOS);
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>(MOCK_MANTENIMIENTOS);
  const [programacion, setProgramacion] = useState<ProgramacionPersonal[]>([]);
  const [asistencia, setAsistencia] = useState<ControlAsistencia[]>([]);
  
  // NEW SIHCE STATES
  const [sihceSolicitudes, setSihceSolicitudes] = useState<SihceSolicitud[]>([]);
  const [sihceCapacitaciones, setSihceCapacitaciones] = useState<SihceCapacitacion[]>([]);
  const [sihceReuniones, setSihceReuniones] = useState<SihceReunion[]>([]);

  // Estados para listas dinámicas
  const [availableServices, setAvailableServices] = useState<string[]>(SERVICE_AREAS);
  const [availableDeviceTypes, setAvailableDeviceTypes] = useState<string[]>(DEFAULT_DEVICE_TYPES);
  const [availableFurnitureTypes, setAvailableFurnitureTypes] = useState<string[]>(DEFAULT_FURNITURE_TYPES);
  const [availableActivities, setAvailableActivities] = useState<string[]>(DEFAULT_ACTIVITY_TYPES);

  const handleAddService = (newService: string) => { if (!availableServices.includes(newService)) setAvailableServices([...availableServices, newService]); };
  const handleAddDeviceType = (newType: string) => { if (!availableDeviceTypes.includes(newType)) setAvailableDeviceTypes([...availableDeviceTypes, newType]); };
  const handleAddFurnitureType = (newType: string) => { if (!availableFurnitureTypes.includes(newType)) setAvailableFurnitureTypes([...availableFurnitureTypes, newType]); };
  const handleAddActivity = (newAct: string) => { if (!availableActivities.includes(newAct)) setAvailableActivities([...availableActivities, newAct]); };

  const Dashboard = () => {
    // --- DASHBOARD ANALYTICS ---
    const totalEquipos = dispositivos.length;
    const equiposOperativos = dispositivos.filter(d => d.estado__disp_e === 'Bueno').length;
    const equiposMalos = dispositivos.filter(d => d.estado__disp_e === 'Malo' || d.estado__disp_e === 'Baja').length;
    const healthPercent = totalEquipos > 0 ? (equiposOperativos / totalEquipos) * 100 : 0;

    const lowStockItems = insumos.filter(i => i.tipo_insumo === 'Material' && i.cantidad < 10);
    const recentMant = mantenimientos.slice(0, 5).sort((a,b) => new Date(b.fecha_mant).getTime() - new Date(a.fecha_mant).getTime());
    
    // Unified Activity Feed
    const feed = [
        ...mantenimientos.map(m => ({ type: 'MANT', date: m.created_at || new Date(m.fecha_mant).getTime(), desc: `Mantenimiento ${m.tipo_mant} a equipo ${m.id_codigo_patrimonial_disp_e}`, user: m.id_dni_tec_1 })),
        ...asistencia.map(a => ({ type: 'ASIST', date: new Date(a.hora_asistencia).getTime(), desc: `Marcación ${a.tipo_registro_asistencia}`, user: a.id_dni_tec })),
        ...movimientosInsumos.map(mo => ({ type: 'MOV', date: new Date(mo.fecha_movimiento + 'T' + (mo.hora_movimiento || '00:00')).getTime(), desc: `${mo.tipo_movimiento} de insumos (Guía: ${mo.nro_guia})`, user: mo.id_dni_responsable }))
    ].sort((a,b) => b.date - a.date).slice(0, 6);

    return (
      <div className="p-8 h-full overflow-y-auto bg-slate-50">
        <header className="mb-8 flex justify-between items-end">
            <div>
                <h2 className="text-3xl font-black text-gray-800 tracking-tight">Centro de Comando</h2>
                <p className="text-gray-500 mt-1">Resumen operativo en tiempo real</p>
            </div>
            <div className="text-right">
                <div className="text-sm font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full inline-block">
                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>
        </header>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Monitor size={20} /></div>
                    <span className="text-sm font-bold text-gray-500 uppercase">Inventario IT</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-800">{totalEquipos}</span>
                    <span className="text-xs text-green-500 font-bold bg-green-50 px-1.5 py-0.5 rounded">+2 este mes</span>
                </div>
                <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{width: `${healthPercent}%`}}></div>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{Math.round(healthPercent)}% Operativos</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute right-0 top-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Wrench size={20} /></div>
                    <span className="text-sm font-bold text-gray-500 uppercase">Soporte</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-800">{mantenimientos.length}</span>
                    <span className="text-xs text-gray-400">Total atenciones</span>
                </div>
                <p className="text-xs text-orange-600 mt-2 font-medium">
                    {mantenimientos.filter(m => m.tipo_mant === 'Correctivo').length} Correctivos vs {mantenimientos.filter(m => m.tipo_mant === 'Preventivo').length} Preventivos
                </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Users size={20} /></div>
                    <span className="text-sm font-bold text-gray-500 uppercase">Personal</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-800">{tecnicos.length}</span>
                    <span className="text-xs text-gray-500">Activos</span>
                </div>
                <div className="mt-2 flex -space-x-2">
                    {tecnicos.slice(0,4).map(t => (
                        <div key={t.id_dni_tec} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-600" title={t.nombre_completo_tec}>{t.nombre_completo_tec.charAt(0)}</div>
                    ))}
                    {tecnicos.length > 4 && <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] text-gray-500">+{tecnicos.length-4}</div>}
                </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute right-0 top-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-100 text-red-600 rounded-lg"><AlertTriangle size={20} /></div>
                    <span className="text-sm font-bold text-gray-500 uppercase">Alertas</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-800">{lowStockItems.length + equiposMalos}</span>
                    <span className="text-xs text-red-500 font-bold">Requieren atención</span>
                </div>
                <p className="text-xs text-gray-500 mt-2 truncate">
                    {lowStockItems.length > 0 ? `${lowStockItems.length} insumos bajos` : 'Stock OK'} • {equiposMalos > 0 ? `${equiposMalos} equipos malos` : 'Equipos OK'}
                </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* MAIN ACTIVITY FEED */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Activity size={20} className="text-brand-600"/> Actividad Reciente</h3>
                    <button className="text-xs text-brand-600 font-bold hover:underline">Ver todo</button>
                </div>
                <div className="space-y-6">
                    {feed.length === 0 ? (
                        <div className="text-center text-gray-400 py-10 italic">No hay actividad reciente.</div>
                    ) : (
                        feed.map((item, idx) => {
                            const userName = tecnicos.find(t => t.id_dni_tec === item.user)?.nombre_completo_tec || 'Sistema';
                            return (
                                <div key={idx} className="flex gap-4 relative group">
                                    <div className={`w-2 h-2 rounded-full mt-2 ring-4 ring-white ${item.type === 'MANT' ? 'bg-orange-500' : item.type === 'ASIST' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                    <div className="flex-1 border-b border-gray-50 pb-4 group-last:border-none">
                                        <div className="flex justify-between items-start">
                                            <p className="font-medium text-gray-800 text-sm">{item.desc}</p>
                                            <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                            <User size={10}/> {userName}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ALERTS & STATUS */}
            <div className="space-y-6">
                {/* LOW STOCK ALERT */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><Bell size={20} className="text-red-500"/> Alertas de Stock</h3>
                    {lowStockItems.length === 0 ? (
                        <div className="flex flex-col items-center py-6 text-gray-400">
                            <CheckCircle2 size={32} className="text-green-200 mb-2"/>
                            <span className="text-sm">Niveles de stock óptimos</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {lowStockItems.slice(0, 4).map(item => (
                                <div key={item.id_insumo} className="flex justify-between items-center bg-red-50 p-3 rounded-lg border border-red-100">
                                    <span className="text-sm font-medium text-red-800">{item.nombre_insumo}</span>
                                    <span className="text-xs font-bold bg-white text-red-600 px-2 py-1 rounded border border-red-200">{item.cantidad} {item.unidad_medida}</span>
                                </div>
                            ))}
                            {lowStockItems.length > 4 && <div className="text-center text-xs text-red-500 font-bold mt-2">+{lowStockItems.length - 4} más...</div>}
                        </div>
                    )}
                </div>

                {/* QUICK LINKS */}
                <div className="bg-slate-800 rounded-2xl shadow-lg p-6 text-white">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp size={20}/> Accesos Rápidos</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setCurrentView(ViewState.INVENTORY)} className="bg-slate-700 hover:bg-slate-600 p-3 rounded-lg text-left transition-colors">
                            <Monitor size={18} className="mb-2 text-brand-400"/>
                            <span className="text-xs font-bold block">Inventario</span>
                        </button>
                        <button onClick={() => setCurrentView(ViewState.SCHEDULE)} className="bg-slate-700 hover:bg-slate-600 p-3 rounded-lg text-left transition-colors">
                            <Users size={18} className="mb-2 text-green-400"/>
                            <span className="text-xs font-bold block">Programación</span>
                        </button>
                        <button onClick={() => setCurrentView(ViewState.OPERATIONS)} className="bg-slate-700 hover:bg-slate-600 p-3 rounded-lg text-left transition-colors">
                            <Wrench size={18} className="mb-2 text-orange-400"/>
                            <span className="text-xs font-bold block">Nuevo Mant.</span>
                        </button>
                        <button onClick={() => setCurrentView(ViewState.REPORTS)} className="bg-brand-600 hover:bg-brand-500 p-3 rounded-lg text-left transition-colors">
                            <TrendingUp size={18} className="mb-2 text-white"/>
                            <span className="text-xs font-bold block">Reportes IA</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.INVENTORY:
        return (
          <InventoryView 
            establecimientos={establecimientos} 
            setEstablecimientos={setEstablecimientos}
            dispositivos={dispositivos} 
            redes={redes}
            ambientes={ambientes}
            insumos={insumos}
            inmuebles={inmuebles}
            movimientos={movimientosInsumos}
            setDispositivos={setDispositivos}
            setRedes={setRedes}
            setAmbientes={setAmbientes}
            setInsumos={setInsumos}
            setInmuebles={setInmuebles}
            setMovimientos={setMovimientosInsumos}
            tecnicos={tecnicos}
            availableServices={availableServices}
            onAddService={handleAddService}
            availableDeviceTypes={availableDeviceTypes}
            onAddDeviceType={handleAddDeviceType}
            availableFurnitureTypes={availableFurnitureTypes}
            onAddFurnitureType={handleAddFurnitureType}
          />
        );
      case ViewState.OPERATIONS:
        return (
          <OperationsView 
            mantenimientos={mantenimientos} 
            setMantenimientos={setMantenimientos}
            dispositivos={dispositivos} 
            tecnicos={tecnicos} 
            establecimientos={establecimientos}
          />
        );
      case ViewState.STAFF:
        return (
          <StaffView 
            tecnicos={tecnicos} 
            setTecnicos={setTecnicos}
            personalSalud={personalSalud}
            setPersonalSalud={setPersonalSalud}
            establecimientos={establecimientos}
          />
        );
      case ViewState.ACCESS:
        return (
          <AccessView 
            usuarios={usuarios}
            setUsuarios={setUsuarios}
            tecnicos={tecnicos}
            personalSalud={personalSalud}
            roles={roles}
            setRoles={setRoles}
          />
        );
      case ViewState.SCHEDULE:
        return <Scheduler 
          tecnicos={tecnicos} 
          programacion={programacion} 
          setProgramacion={setProgramacion}
          establecimientos={establecimientos}
          ambientes={ambientes}
          availableActivities={availableActivities}
          onAddActivity={handleAddActivity}
        />;
      case ViewState.TIMECLOCK:
        return <TimeClock tecnicos={tecnicos} asistencia={asistencia} setAsistencia={setAsistencia} />;
      case ViewState.REPORTS:
        return <ReportGenerator tecnicos={tecnicos} mantenimientos={mantenimientos} asistencia={asistencia} dispositivos={dispositivos} />;
      case ViewState.DATABASE:
        return (
          <DatabaseExport 
            establecimientos={establecimientos}
            ambientes={ambientes}
            tecnicos={tecnicos}
            personalSalud={personalSalud}
            dispositivos={dispositivos}
            inmuebles={inmuebles}
            redes={redes}
            insumos={insumos}
            usuarios={usuarios}
            roles={roles}
            mantenimientos={mantenimientos}
            programacion={programacion}
            asistencia={asistencia}
            movimientos={movimientosInsumos}
          />
        );
      case ViewState.SIHCE:
        return (
          <SihceView 
            solicitudes={sihceSolicitudes}
            setSolicitudes={setSihceSolicitudes}
            capacitaciones={sihceCapacitaciones}
            setCapacitaciones={setSihceCapacitaciones}
            reuniones={sihceReuniones}
            setReuniones={setSihceReuniones}
            personalSalud={personalSalud}
            establecimientos={establecimientos}
            redes={redes}
          />
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      <main className="flex-1 overflow-auto relative">
        {renderContent()}
      </main>
    </div>
  );
}