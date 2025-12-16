




import React from 'react';
import { ViewState } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Clock, 
  FileText, 
  LogOut,
  Monitor,
  Wrench,
  Building,
  Lock,
  UserCog,
  Database,
  FileBadge
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  
  const navItems = [
    { view: ViewState.DASHBOARD, label: 'Panel General', icon: LayoutDashboard },
    { view: ViewState.INVENTORY, label: 'Gestión de Activos', icon: Monitor }, // Dispositivos, Redes, Ambientes
    { view: ViewState.OPERATIONS, label: 'Operaciones', icon: Wrench }, // Mantenimientos, Software
    { view: ViewState.STAFF, label: 'Gestión de Personal', icon: Users }, // Tecnicos, Personal Salud
    { view: ViewState.ACCESS, label: 'Seguridad y Accesos', icon: Lock }, // Usuarios, Roles
    { view: ViewState.SCHEDULE, label: 'Programación', icon: Calendar },
    { view: ViewState.TIMECLOCK, label: 'Control Asistencia', icon: Clock },
    { view: ViewState.REPORTS, label: 'Reportes IA', icon: FileText },
    { view: ViewState.SIHCE, label: 'Gestión SIHCE', icon: FileBadge }, // NEW MODULE
    { view: ViewState.DATABASE, label: 'Base de Datos', icon: Database },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen no-print shadow-xl z-50">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold tracking-wider flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">GP</div>
          SihceManager
        </h1>
        <p className="text-xs text-slate-400 mt-1">Soporte e Infraestructura</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === item.view
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium text-sm text-left">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
          <LogOut size={20} />
          <span className="font-medium text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};