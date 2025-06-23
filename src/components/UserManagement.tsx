import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from './Layout';

interface User {
  id: number;
  username: string;
  email: string;
  nombre_completo: string;
  activo: boolean;
  ultimo_acceso: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  rol_nombre: string;
  rol_descripcion: string;
  creado_por_nombre: string;
}

interface Role {
  id: number;
  nombre: string;
  descripcion: string;
  fecha_creacion: string;
}

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Formulario de creación/edición
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    nombre_completo: '',
    rol_id: ''
  });

  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Cargar usuarios y roles
  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3001/api/auth/usuarios', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      setError('Error al cargar usuarios');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3001/api/auth/roles', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar roles');
      }

      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error('Error al cargar roles:', error);
    }
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!formData.username.trim()) {
      errors.username = 'El nombre de usuario es requerido';
    }

    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'El email no es válido';
    }

    if (!editingUser && !formData.password.trim()) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password && formData.password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (!formData.nombre_completo.trim()) {
      errors.nombre_completo = 'El nombre completo es requerido';
    }

    if (!formData.rol_id) {
      errors.rol_id = 'Debe seleccionar un rol';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const accessToken = localStorage.getItem('accessToken');
      const url = editingUser 
        ? `http://localhost:3001/api/auth/usuarios/${editingUser.id}`
        : 'http://localhost:3001/api/auth/usuarios';

      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser 
        ? { ...formData, password: undefined } // No enviar password en edición
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al procesar la solicitud');
      }

      // Limpiar formulario y recargar usuarios
      resetForm();
      loadUsers();
      
      alert(editingUser ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      nombre_completo: '',
      rol_id: ''
    });
    setFormErrors({});
    setShowCreateForm(false);
    setEditingUser(null);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      nombre_completo: user.nombre_completo,
      rol_id: roles.find(r => r.nombre === user.rol_nombre)?.id.toString() || ''
    });
    setShowCreateForm(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL');
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Gestión de Usuarios" />
        <div className="loading">Cargando usuarios...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Gestión de Usuarios" />
        <div className="error-message">{error}</div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Gestión de Usuarios" />
      
      <div className="user-management-container">
        <div className="toolbar">
          <h3>Usuarios del Sistema</h3>
          {user?.permisos.usuarios.includes('crear') && (
            <button 
              className="btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              <i className="fas fa-plus"></i> Nuevo Usuario
            </button>
          )}
        </div>

        {/* Tabla de usuarios */}
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre Completo</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Último Acceso</th>
                <th>Fecha Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(userItem => (
                <tr key={userItem.id}>
                  <td>{userItem.username}</td>
                  <td>{userItem.nombre_completo}</td>
                  <td>{userItem.email}</td>
                  <td>
                    <span className={`role-badge ${userItem.rol_nombre.toLowerCase()}`}>
                      {userItem.rol_nombre}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${userItem.activo ? 'active' : 'inactive'}`}>
                      {userItem.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    {userItem.ultimo_acceso 
                      ? formatDate(userItem.ultimo_acceso)
                      : 'Nunca'
                    }
                  </td>
                  <td>{formatDate(userItem.fecha_creacion)}</td>
                  <td className="actions">
                    {user?.permisos.usuarios.includes('actualizar') && (
                      <button 
                        className="btn-edit"
                        onClick={() => handleEdit(userItem)}
                        title="Editar usuario"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal de creación/edición */}
        {showCreateForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                <button className="btn-close" onClick={resetForm}>
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="username">Nombre de Usuario *</label>
                  <input
                    type="text"
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    disabled={!!editingUser}
                  />
                  {formErrors.username && <span className="error">{formErrors.username}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                  {formErrors.email && <span className="error">{formErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="password">
                    Contraseña {!editingUser && '*'}
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder={editingUser ? 'Dejar vacío para no cambiar' : ''}
                  />
                  {formErrors.password && <span className="error">{formErrors.password}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="nombre_completo">Nombre Completo *</label>
                  <input
                    type="text"
                    id="nombre_completo"
                    value={formData.nombre_completo}
                    onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
                  />
                  {formErrors.nombre_completo && <span className="error">{formErrors.nombre_completo}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="rol_id">Rol *</label>
                  <select
                    id="rol_id"
                    value={formData.rol_id}
                    onChange={(e) => setFormData({...formData, rol_id: e.target.value})}
                  >
                    <option value="">Seleccionar rol</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.nombre} - {role.descripcion}
                      </option>
                    ))}
                  </select>
                  {formErrors.rol_id && <span className="error">{formErrors.rol_id}</span>}
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={resetForm}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingUser ? 'Actualizar' : 'Crear'} Usuario
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserManagement; 