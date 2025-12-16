import React, { useState, useMemo } from 'react';
import { Usuario, Tecnico, Rol, SYSTEM_PERMISSIONS, Personal } from '../types';
import { Lock, UserCog, Plus, Search, Edit, Trash2, X, ShieldCheck, Key, Users, Settings, Briefcase, Stethoscope } from 'lucide-react';

interface AccessViewProps {
  usuarios: Usuario[];
  setUsuarios: React.Dispatch<React.SetStateAction<Usuario[]>>;
  tecnicos: Tecnico[];
  personalSalud: Personal[];
  roles: Rol[];
  setRoles: React.Dispatch<React.SetStateAction<Rol[]>>;
}

export const AccessView: React.FC<AccessViewProps> = ({ usuarios, setUsuarios, tecnicos, personalSalud, roles, setRoles }) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'ROLES'>('USERS');
  const [searchTerm, setSearchTerm] = useState('');
  
  // -- MODAL STATES --
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [editingId, setEditingId] = useState<number | null>(null);

  // -- USER FORM --
  const initialUserForm: Partial<Usuario> = {
      id_usuario: undefined,
      id_dni_tec: undefined,
      id_dni_pers: undefined,
      nombre_usuario: '',
      contrasena_usuario: '',
      id_rol: 2, 
      estado: 'Activo'
  };
  const [userFormData, setUserFormData] = useState<Partial<Usuario>>(initialUserForm);
  const [userSourceType, setUserSourceType] = useState<'CENTRAL' | 'IPRESS'>('CENTRAL');
  const [userPersonSearch, setUserPersonSearch] = useState('');
  const [showPersonSuggestions, setShowPersonSuggestions] = useState(false);

  // -- ROLE FORM --
  const initialRoleForm: Partial<Rol> = {
      nombre_rol: '',
      permisos: []
  };
  const [roleFormData, setRoleFormData] = useState<Partial<Rol>>(initialRoleForm);

  // --- FILTERING ---
  const filteredUsers = usuarios.filter(u => {
      const term = searchTerm.toLowerCase();
      // Resolve Name
      const tec = tecnicos.find(t => t.id_dni_tec === u.id_dni_tec);
      const pers = personalSalud.find(p => p.id_dni_pers === u.id_dni_pers);
      const fullName = tec?.nombre_completo_tec || pers?.nombre_completo_pers || '';
      
      return (
        u.nombre_usuario.toLowerCase().includes(term) ||
        fullName.toLowerCase().includes(term)
      );
  });

  const filteredRoles = roles.filter(r => r.nombre_rol.toLowerCase().includes(searchTerm.toLowerCase()));

  // Filter available personnel for dropdown
  const filteredPersonnelList = useMemo(() => {
      const term = userPersonSearch.toLowerCase();
      if (userSourceType === 'CENTRAL') {
          return tecnicos.filter(t => 
              t.nombre_completo_tec.toLowerCase().includes(term) || 
              t.id_dni_tec.toString().includes(term)
          );
      } else {
          return personalSalud.filter(p => 
              p.nombre_completo_pers.toLowerCase().includes(term) || 
              p.id_dni_pers.toString().includes(term)
          );
      }
  }, [userPersonSearch, userSourceType, tecnicos, personalSalud]);

  // --- ACTIONS: USERS ---
  const openCreateUser = () => {
      setModalMode('CREATE');
      setUserFormData(initialUserForm);
      setUserSourceType('CENTRAL');
      setUserPersonSearch('');
      setIsUserModalOpen(true);
  };

  const openEditUser = (user: Usuario) => {
      setModalMode('EDIT');
      setEditingId(user.id_usuario);
      setUserFormData({ ...user });
      
      // Determine source
      if (user.id_dni_tec) {
          setUserSourceType('CENTRAL');
          const p = tecnicos.find(t => t.id_dni_tec === user.id_dni_tec);
          setUserPersonSearch(p ? `${p.nombre_completo_tec} (DNI: ${p.id_dni_tec})` : '');
      } else if (user.id_dni_pers) {
          setUserSourceType('IPRESS');
          const p = personalSalud.find(t => t.id_dni_pers === user.id_dni_pers);
          setUserPersonSearch(p ? `${p.nombre_completo_pers} (DNI: ${p.id_dni_pers})` : '');
      }
      setIsUserModalOpen(true);
  };

  const handleDeleteUser = (id: number) => {
      if (confirm('¿Eliminar usuario?')) setUsuarios(prev => prev.filter(u => u.id_usuario !== id));
  };

  const handleSaveUser = (e: React.FormEvent) => {
      e.preventDefault();
      // Validation: Must select a person
      if (userSourceType === 'CENTRAL' && !userFormData.id_dni_tec) {
          alert("Debe seleccionar un personal de Sede Central.");
          return;
      }
      if (userSourceType === 'IPRESS' && !userFormData.id_dni_pers) {
          alert("Debe seleccionar un personal de IPRESS.");
          return;
      }

      // Cleanup logic: Ensure only the selected type ID is saved
      const finalData = { ...userFormData };
      if (userSourceType === 'CENTRAL') {
          finalData.id_dni_pers = undefined;
      } else {
          finalData.id_dni_tec = undefined;
      }

      if (modalMode === 'CREATE') {
          const newUser: Usuario = { ...finalData, id_usuario: Math.floor(Math.random() * 10000), estado: 'Activo' } as Usuario;
          setUsuarios(prev => [...prev, newUser]);
      } else {
          setUsuarios(prev => prev.map(u => u.id_usuario === editingId ? { ...finalData, id_usuario: editingId } as Usuario : u));
      }
      setIsUserModalOpen(false);
  };

  const handleSelectPerson = (id: number, name: string) => {
      if (userSourceType === 'CENTRAL') {
          setUserFormData({ ...userFormData, id_dni_tec: id, id_dni_pers: undefined });
      } else {
          setUserFormData({ ...userFormData, id_dni_pers: id, id_dni_tec: undefined });
      }
      setUserPersonSearch(`${name} (DNI: ${id})`);
      setShowPersonSuggestions(false);
  };

  // --- ACTIONS: ROLES ---
  const openCreateRole = () => {
      setModalMode('CREATE');
      setRoleFormData({ nombre_rol: '', permisos: [] });
      setIsRoleModalOpen(true);
  };

  const openEditRole = (rol: Rol) => {
      setModalMode('EDIT');
      setEditingId(rol.id_rol);
      setRoleFormData({ ...rol });
      setIsRoleModalOpen(true);
  };

  const handleDeleteRole = (id: number) => {
      if (usuarios.some(u => u.id_rol === id)) {
          alert("No se puede eliminar un rol que está asignado a usuarios.");
          return;
      }
      if (confirm('¿Eliminar rol?')) setRoles(prev => prev.filter(r => r.id_rol !== id));
  };

  const handleSaveRole = (e: React.FormEvent) => {
      e.preventDefault();
      if (modalMode === 'CREATE') {
          const newRole: Rol = { ...roleFormData, id_rol: Math.floor(Math.random() * 10000) } as Rol;
          setRoles(prev => [...prev, newRole]);
      } else {
          setRoles(prev => prev.map(r => r.id_rol === editingId ? { ...roleFormData, id_rol: editingId } as Rol : r));
      }
      setIsRoleModalOpen(false);
  };

  const togglePermission = (permId: string) => {
      const currentPerms = roleFormData.permisos || [];
      if (currentPerms.includes(permId)) {
          setRoleFormData({ ...roleFormData, permisos: currentPerms.filter(p => p !== permId) });
      } else {
          setRoleFormData({ ...roleFormData, permisos: [...currentPerms, permId] });
      }
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Seguridad y Accesos</h2>
          <p className="text-gray-500">Gestión de usuarios, roles y permisos granulares</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <input 
                  type="text" 
                  placeholder={activeTab === 'USERS' ? "Buscar usuario..." : "Buscar rol..."}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
             <button onClick={activeTab === 'USERS' ? openCreateUser : openCreateRole} className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-brand-700 shadow-sm whitespace-nowrap transition-colors">
               <Plus size={18}/> 
               <span className="hidden sm:inline">Nuevo {activeTab === 'USERS' ? 'Usuario' : 'Rol'}</span>
             </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button onClick={() => setActiveTab('USERS')} className={`px-4 py-2 flex items-center gap-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'USERS' ? 'bg-brand-50 text-brand-600 border-b-2 border-brand-600' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Users size={16}/> Usuarios
        </button>
        <button onClick={() => setActiveTab('ROLES')} className={`px-4 py-2 flex items-center gap-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'ROLES' ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:bg-gray-50'}`}>
            <ShieldCheck size={16}/> Roles y Permisos
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         {activeTab === 'USERS' ? (
             <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                  <tr>
                    <th className="px-6 py-4 text-left">Usuario</th>
                    <th className="px-6 py-4 text-left">Personal Vinculado</th>
                    <th className="px-6 py-4 text-left">Rol Asignado</th>
                    <th className="px-6 py-4 text-left">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filteredUsers.map(user => {
                        const tecnico = tecnicos.find(t => t.id_dni_tec === user.id_dni_tec);
                        const personal = personalSalud.find(p => p.id_dni_pers === user.id_dni_pers);
                        const rol = roles.find(r => r.id_rol === user.id_rol)?.nombre_rol || 'Rol Eliminado';
                        const isCentral = !!tecnico;
                        const name = tecnico?.nombre_completo_tec || personal?.nombre_completo_pers || 'Desconocido';
                        const cargo = tecnico?.cargo_tec || personal?.cargo_pers || '-';

                        return (
                            <tr key={user.id_usuario} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold text-gray-800">{user.nombre_usuario}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {isCentral ? <Briefcase size={14} className="text-brand-600"/> : <Stethoscope size={14} className="text-green-600"/>}
                                        <span className="font-medium text-gray-700">{name}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 ml-5">{cargo}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded text-xs font-bold border bg-blue-50 text-blue-700 border-blue-200">
                                        {rol}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${user.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {user.estado.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => openEditUser(user)} className="p-1.5 text-gray-400 hover:text-brand-600 rounded"><Edit size={16}/></button>
                                    <button onClick={() => handleDeleteUser(user.id_usuario)} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
             </table>
         ) : (
             <table className="w-full text-left text-sm">
                <thead className="bg-purple-50 text-purple-800 font-medium border-b border-purple-100">
                  <tr>
                    <th className="px-6 py-4 text-left">Nombre del Rol</th>
                    <th className="px-6 py-4 text-left">Permisos (Resumen)</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filteredRoles.map(rol => (
                        <tr key={rol.id_rol} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-bold text-gray-800">{rol.nombre_rol}</td>
                            <td className="px-6 py-4">
                                <div className="text-xs text-gray-500 max-w-md truncate">
                                    {rol.permisos.length} permisos habilitados
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => openEditRole(rol)} className="p-1.5 text-gray-400 hover:text-purple-600 rounded"><Edit size={16}/></button>
                                <button onClick={() => handleDeleteRole(rol.id_rol)} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash2 size={16}/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
         )}
      </div>

      {/* --- MODAL CREATE/EDIT USER --- */}
      {isUserModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
                  <div className="flex justify-between items-center mb-4 border-b pb-4">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><UserCog size={24} className="text-brand-600"/> {modalMode === 'CREATE' ? 'Crear Usuario' : 'Editar Usuario'}</h3>
                      <button onClick={() => setIsUserModalOpen(false)}><X className="text-gray-400 hover:text-gray-600"/></button>
                  </div>
                  <form onSubmit={handleSaveUser} className="space-y-4">
                      {/* TYPE SELECTOR */}
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Tipo de Personal Vinculado</label>
                          <div className="flex gap-4">
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                  <input type="radio" checked={userSourceType === 'CENTRAL'} onChange={() => { setUserSourceType('CENTRAL'); setUserPersonSearch(''); }} className="text-brand-600"/>
                                  <span className="flex items-center gap-1"><Briefcase size={14}/> Sede Central</span>
                              </label>
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                  <input type="radio" checked={userSourceType === 'IPRESS'} onChange={() => { setUserSourceType('IPRESS'); setUserPersonSearch(''); }} className="text-brand-600"/>
                                  <span className="flex items-center gap-1"><Stethoscope size={14}/> IPRESS</span>
                              </label>
                          </div>
                      </div>

                      {/* SEARCHABLE PERSON DROPDOWN */}
                      <div className="relative">
                          <label className="block text-xs font-bold text-gray-500 mb-1">Buscar Personal (Nombre o DNI) *</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Escriba para buscar..."
                            className="w-full border p-2 rounded text-sm"
                            value={userPersonSearch}
                            onChange={(e) => {
                                setUserPersonSearch(e.target.value);
                                setShowPersonSuggestions(true);
                                // Clear IDs when typing new search
                                if (userSourceType === 'CENTRAL') setUserFormData({...userFormData, id_dni_tec: undefined});
                                else setUserFormData({...userFormData, id_dni_pers: undefined});
                            }}
                            onFocus={() => setShowPersonSuggestions(true)}
                          />
                          {showPersonSuggestions && userPersonSearch && (
                              <div className="absolute z-10 w-full bg-white border mt-1 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                  {filteredPersonnelList.length === 0 ? (
                                      <div className="p-2 text-gray-400 text-xs italic">No se encontraron resultados.</div>
                                  ) : (
                                      filteredPersonnelList.map(p => {
                                          const isTec = 'id_dni_tec' in p;
                                          const id = isTec ? (p as Tecnico).id_dni_tec : (p as Personal).id_dni_pers;
                                          const name = isTec ? (p as Tecnico).nombre_completo_tec : (p as Personal).nombre_completo_pers;
                                          return (
                                              <div 
                                                key={id} 
                                                className="p-2 hover:bg-gray-100 cursor-pointer text-sm border-b"
                                                onClick={() => handleSelectPerson(id, name)}
                                              >
                                                  <div className="font-bold text-gray-800">{name}</div>
                                                  <div className="text-xs text-gray-500">DNI: {id}</div>
                                              </div>
                                          );
                                      })
                                  )}
                              </div>
                          )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Usuario *</label>
                              <input type="text" required className="w-full border p-2 rounded text-sm" value={userFormData.nombre_usuario} onChange={e => setUserFormData({...userFormData, nombre_usuario: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Key size={12}/> Contraseña *</label>
                              <input type="password" required className="w-full border p-2 rounded text-sm" value={userFormData.contrasena_usuario} onChange={e => setUserFormData({...userFormData, contrasena_usuario: e.target.value})} />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><ShieldCheck size={12}/> Rol de Acceso *</label>
                          <select required className="w-full border p-2 rounded text-sm" value={userFormData.id_rol} onChange={e => setUserFormData({...userFormData, id_rol: parseInt(e.target.value)})}>
                              {roles.map(r => <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Estado</label>
                          <select className="w-full border p-2 rounded text-sm" value={userFormData.estado} onChange={e => setUserFormData({...userFormData, estado: e.target.value as any})}>
                              <option value="Activo">Activo</option>
                              <option value="Inactivo">Inactivo</option>
                          </select>
                      </div>
                      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                          <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                          <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm">Guardar Acceso</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* --- MODAL CREATE/EDIT ROLE --- */}
      {isRoleModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl w-full max-w-3xl p-6 shadow-2xl h-[90vh] flex flex-col">
                  <div className="flex justify-between items-center mb-4 border-b pb-4">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Settings size={24} className="text-purple-600"/> {modalMode === 'CREATE' ? 'Crear Rol' : 'Editar Rol'}</h3>
                      <button onClick={() => setIsRoleModalOpen(false)}><X className="text-gray-400 hover:text-gray-600"/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                      <form id="roleForm" onSubmit={handleSaveRole}>
                          <div className="mb-6">
                              <label className="block text-xs font-bold text-gray-500 mb-1">Nombre del Rol *</label>
                              <input type="text" required className="w-full border p-2 rounded text-sm" value={roleFormData.nombre_rol} onChange={e => setRoleFormData({...roleFormData, nombre_rol: e.target.value})} placeholder="Ej. Supervisor de TI" />
                          </div>

                          <div className="space-y-4">
                              <label className="block text-xs font-bold text-gray-500 uppercase border-b pb-2">Configuración de Permisos</label>
                              {SYSTEM_PERMISSIONS.map(parent => (
                                  <div key={parent.id} className="border rounded-lg p-3 bg-gray-50">
                                      <div className="flex items-center gap-2 mb-2">
                                          <input 
                                            type="checkbox" 
                                            id={parent.id}
                                            checked={roleFormData.permisos?.includes(parent.id)}
                                            onChange={() => togglePermission(parent.id)}
                                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                                          />
                                          <label htmlFor={parent.id} className="font-bold text-sm text-gray-800 cursor-pointer select-none">{parent.label}</label>
                                      </div>
                                      
                                      {parent.children && (
                                          <div className="ml-6 grid grid-cols-2 gap-2 mt-2 pl-4 border-l-2 border-gray-200">
                                              {parent.children.map(child => (
                                                  <div key={child.id} className="flex items-center gap-2">
                                                      <input 
                                                        type="checkbox" 
                                                        id={child.id}
                                                        checked={roleFormData.permisos?.includes(child.id)}
                                                        onChange={() => togglePermission(child.id)}
                                                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                                                      />
                                                      <label htmlFor={child.id} className="text-sm text-gray-600 cursor-pointer select-none">{child.label}</label>
                                                  </div>
                                              ))}
                                          </div>
                                      )}
                                  </div>
                              ))}
                          </div>
                      </form>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                      <button type="button" onClick={() => setIsRoleModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                      <button type="submit" form="roleForm" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm">Guardar Permisos</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};