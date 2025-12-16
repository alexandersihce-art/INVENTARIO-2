import React, { useState } from 'react';
import { Employee, ROLES } from '../types';
import { Plus, Search, Trash2, Edit2, User } from 'lucide-react';

interface EmployeeManagerProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
}

export const EmployeeManager: React.FC<EmployeeManagerProps> = ({ employees, setEmployees }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, 'id' | 'active'>>({
    firstName: '',
    lastName: '',
    role: ROLES[0],
    email: ''
  });

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const id = (Math.random() * 10000).toFixed(0);
    setEmployees([...employees, { ...newEmployee, id, active: true }]);
    setNewEmployee({ firstName: '', lastName: '', role: ROLES[0], email: '' });
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este empleado?')) {
      setEmployees(employees.filter(e => e.id !== id));
    }
  };

  const filteredEmployees = employees.filter(e => 
    e.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Personal</h2>
          <p className="text-gray-500">Gestione su equipo y roles</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={18} />
          Nuevo Empleado
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar por nombre o rol..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium text-sm uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Empleado</th>
              <th className="px-6 py-4">Rol</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredEmployees.map((employee) => (
              <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold">
                    {employee.firstName[0]}{employee.lastName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{employee.firstName} {employee.lastName}</p>
                    <p className="text-xs text-gray-500">ID: {employee.id}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">
                    {employee.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">{employee.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${employee.active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-sm text-gray-600">{employee.active ? 'Activo' : 'Inactivo'}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gray-400 hover:text-brand-600 mx-1"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(employee.id)} className="text-gray-400 hover:text-red-600 mx-1"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredEmployees.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            No se encontraron empleados.
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Registrar Nuevo Empleado</h3>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input required type="text" className="w-full p-2 border rounded-lg" 
                    value={newEmployee.firstName} onChange={e => setNewEmployee({...newEmployee, firstName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                  <input required type="text" className="w-full p-2 border rounded-lg"
                    value={newEmployee.lastName} onChange={e => setNewEmployee({...newEmployee, lastName: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input required type="email" className="w-full p-2 border rounded-lg"
                  value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select className="w-full p-2 border rounded-lg"
                  value={newEmployee.role} onChange={e => setNewEmployee({...newEmployee, role: e.target.value})}>
                  {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};