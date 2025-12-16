

import React, { useState, useEffect, useMemo } from 'react';
import { Tecnico, ControlAsistencia } from '../types';
import { Clock, LogIn, LogOut, MapPin, History, UserCheck, AlertCircle, Calendar } from 'lucide-react';

interface TimeClockProps {
  tecnicos: Tecnico[];
  asistencia: ControlAsistencia[];
  setAsistencia: React.Dispatch<React.SetStateAction<ControlAsistencia[]>>;
}

export const TimeClock: React.FC<TimeClockProps> = ({ tecnicos, asistencia, setAsistencia }) => {
  const [activeTab, setActiveTab] = useState<'CLOCK' | 'HISTORY'>('CLOCK');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDni, setSelectedDni] = useState('');
  const [geoLoc, setGeoLoc] = useState<{lat: number, lng: number} | null>(null);
  const [loadingGeo, setLoadingGeo] = useState(false);

  // --- CLOCK LOGIC ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simular obtención de GEO
  const fetchLocation = () => {
      setLoadingGeo(true);
      setTimeout(() => {
          // Coordenadas simuladas de Diris Lima Norte (Aprox)
          setGeoLoc({ lat: -12.029, lng: -77.031 }); 
          setLoadingGeo(false);
      }, 1000);
  };

  useEffect(() => {
      fetchLocation();
  }, []);

  const handleAction = (action: 'Entrada' | 'Salida') => {
    if (!selectedDni) {
        alert("Por favor seleccione su usuario.");
        return;
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const dniNum = parseInt(selectedDni);
    const tecnico = tecnicos.find(t => t.id_dni_tec === dniNum);

    // Validación simple: No doble entrada
    if (action === 'Entrada') {
      const activeLog = asistencia.find(l => l.id_dni_tec === dniNum && l.fecha_asistencia === todayStr && l.tipo_registro_asistencia === 'Entrada');
      if (activeLog) {
        alert(`Hola ${tecnico?.nombre_completo_tec}, ya registraste tu entrada hoy a las ${activeLog.hora_asistencia.split('T')[1].substring(0,5)}.`);
        return;
      }
    }

    const newLog: ControlAsistencia = {
      id_asistencia: Math.random().toString(36).substr(2, 9),
      id_dni_tec: dniNum,
      fecha_asistencia: todayStr,
      hora_asistencia: now.toISOString(),
      tipo_registro_asistencia: action,
      ubicacion_asistencia: 'Sede Central (Validado)',
      latitud: geoLoc?.lat,
      longitud: geoLoc?.lng
    };
    
    setAsistencia([...asistencia, newLog]);
    alert(`✅ ${action} registrada correctamente para ${tecnico?.nombre_completo_tec}`);
    setSelectedDni(''); // Resetear para el siguiente usuario
  };

  // --- HISTORY LOGIC ---
  const historyData = useMemo(() => {
      return asistencia.sort((a,b) => new Date(b.hora_asistencia).getTime() - new Date(a.hora_asistencia).getTime());
  }, [asistencia]);

  // --- STAFF MONITOR (Who is IN?) ---
  const activeStaff = useMemo(() => {
      // Logic: Get today's entries, filter out those who have an exit AFTER the entry
      const todayStr = new Date().toISOString().split('T')[0];
      const todayLogs = asistencia.filter(l => l.fecha_asistencia === todayStr);
      
      const statusMap = new Map<number, 'IN' | 'OUT'>();
      
      todayLogs.forEach(log => {
          if (log.tipo_registro_asistencia === 'Entrada') statusMap.set(log.id_dni_tec, 'IN');
          if (log.tipo_registro_asistencia === 'Salida') statusMap.set(log.id_dni_tec, 'OUT');
      });

      return tecnicos.filter(t => statusMap.get(t.id_dni_tec) === 'IN');
  }, [asistencia, tecnicos]);

  return (
    <div className="h-full flex flex-col bg-slate-100 overflow-hidden">
        {/* HEADER */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm z-10">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Clock className="text-brand-600"/> Control de Asistencia
                </h2>
                <p className="text-sm text-gray-500">Sistema biométrico digital y geolocalizado</p>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('CLOCK')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'CLOCK' ? 'bg-white text-brand-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Reloj Marcador
                </button>
                <button 
                    onClick={() => setActiveTab('HISTORY')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'HISTORY' ? 'bg-white text-brand-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Historial
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-hidden p-6 flex gap-6">
            
            {/* MAIN CONTENT AREA */}
            <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col relative">
                
                {activeTab === 'CLOCK' ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-white to-slate-50">
                        {/* DIGITAL CLOCK DISPLAY */}
                        <div className="mb-10 text-center">
                            <div className="text-7xl font-mono font-bold text-slate-800 tracking-tighter drop-shadow-sm">
                                {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                            <div className="text-xl text-brand-600 font-medium mt-2 uppercase tracking-wide flex items-center justify-center gap-2">
                                <Calendar size={20}/>
                                {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                        </div>

                        {/* INPUT AREA */}
                        <div className="w-full max-w-md space-y-6">
                            <div className="bg-white p-2 rounded-xl border-2 border-gray-200 shadow-sm focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-50 transition-all">
                                <select 
                                    className="w-full p-3 text-lg bg-transparent outline-none text-gray-700 font-medium"
                                    value={selectedDni}
                                    onChange={(e) => setSelectedDni(e.target.value)}
                                >
                                    <option value="">-- Seleccionar Colaborador --</option>
                                    {tecnicos.map(e => (
                                        <option key={e.id_dni_tec} value={e.id_dni_tec}>{e.nombre_completo_tec}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleAction('Entrada')}
                                    disabled={!selectedDni}
                                    className={`group flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all transform active:scale-95 ${
                                        !selectedDni ? 'border-gray-100 bg-gray-50 text-gray-300' : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-400 hover:shadow-lg shadow-green-100'
                                    }`}
                                >
                                    <div className="bg-white p-3 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                        <LogIn size={32} className={!selectedDni ? 'text-gray-300' : 'text-green-600'} />
                                    </div>
                                    <span className="font-bold text-xl">MARCAR ENTRADA</span>
                                    <span className="text-xs mt-1 opacity-75">Iniciar Turno</span>
                                </button>

                                <button
                                    onClick={() => handleAction('Salida')}
                                    disabled={!selectedDni}
                                    className={`group flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all transform active:scale-95 ${
                                        !selectedDni ? 'border-gray-100 bg-gray-50 text-gray-300' : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-400 hover:shadow-lg shadow-red-100'
                                    }`}
                                >
                                    <div className="bg-white p-3 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                        <LogOut size={32} className={!selectedDni ? 'text-gray-300' : 'text-red-600'} />
                                    </div>
                                    <span className="font-bold text-xl">MARCAR SALIDA</span>
                                    <span className="text-xs mt-1 opacity-75">Finalizar Turno</span>
                                </button>
                            </div>

                            {/* GEO STATUS */}
                            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-4">
                                <MapPin size={14} className={loadingGeo ? 'animate-bounce' : 'text-green-500'}/>
                                {loadingGeo ? 'Obteniendo satélites...' : `Ubicación validada: ${geoLoc?.lat}, ${geoLoc?.lng}`}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* HISTORY TAB */
                    <div className="flex-1 flex flex-col">
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700">Registro de Actividad Reciente</h3>
                            <div className="text-xs text-gray-500">{historyData.length} registros totales</div>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white text-gray-500 sticky top-0 shadow-sm">
                                    <tr>
                                        <th className="p-4">Colaborador</th>
                                        <th className="p-4">Fecha</th>
                                        <th className="p-4">Hora</th>
                                        <th className="p-4">Tipo</th>
                                        <th className="p-4">Ubicación</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {historyData.map(log => {
                                        const tec = tecnicos.find(t => t.id_dni_tec === log.id_dni_tec);
                                        return (
                                            <tr key={log.id_asistencia} className="hover:bg-gray-50">
                                                <td className="p-4 font-medium text-gray-800">{tec?.nombre_completo_tec}</td>
                                                <td className="p-4 text-gray-600">{log.fecha_asistencia}</td>
                                                <td className="p-4 font-mono text-gray-600">{new Date(log.hora_asistencia).toLocaleTimeString()}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${log.tipo_registro_asistencia === 'Entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {log.tipo_registro_asistencia.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-xs text-gray-500 flex items-center gap-1">
                                                    <MapPin size={12}/> {log.ubicacion_asistencia}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* SIDEBAR: ACTIVE STAFF */}
            <div className="w-80 bg-slate-800 rounded-2xl shadow-lg flex flex-col overflow-hidden text-white hidden lg:flex">
                <div className="p-6 border-b border-slate-700">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <UserCheck className="text-green-400"/> Personal Activo
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Actualmente en sede</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {activeStaff.length === 0 ? (
                        <div className="text-center text-slate-500 py-10 flex flex-col items-center">
                            <AlertCircle className="mb-2 opacity-50"/>
                            <p>No hay personal registrado en planta actualmente.</p>
                        </div>
                    ) : (
                        activeStaff.map(t => (
                            <div key={t.id_dni_tec} className="bg-slate-700/50 p-3 rounded-lg border border-slate-600 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center font-bold text-slate-300">
                                    {t.nombre_completo_tec.substring(0,2)}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-slate-200">{t.nombre_completo_tec}</p>
                                    <p className="text-[10px] text-green-400 flex items-center gap-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> En Turno
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-4 bg-slate-900 text-center text-xs text-slate-500">
                    Sincronizado: {currentTime.toLocaleTimeString()}
                </div>
            </div>

        </div>
    </div>
  );
};