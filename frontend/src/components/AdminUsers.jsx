import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [roleFilter, setRoleFilter] = useState('');
    const { getToken } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'student',
        group_id: ''
    });

    useEffect(() => {
        fetchUsers();
        fetchGroups();
    }, []);

    const fetchUsers = async () => {
        try {
            const url = roleFilter ? `${API_URL}/admin/users?role=${roleFilter}` : `${API_URL}/admin/users`;
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchGroups = async () => {
        try {
            const response = await fetch(`${API_URL}/groups`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (!response.ok) throw new Error('Failed to fetch groups');
            const data = await response.json();
            setGroups(data);
        } catch (err) {
            console.error('Failed to fetch groups:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingUser ? `${API_URL}/admin/users/${editingUser.id}` : `${API_URL}/admin/users`;
            const method = editingUser ? 'PUT' : 'POST';
            
            const dataToSend = {
                email: formData.email,
                full_name: formData.full_name,
                role: formData.role,
                group_id: formData.group_id || null
            };
            
            if (!editingUser) {
                dataToSend.password = formData.password;
            }
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify(dataToSend)
            });
            
            if (!response.ok) throw new Error('Failed to save user');
            
            setShowModal(false);
            setEditingUser(null);
            resetForm();
            fetchUsers();
        } catch (err) {
            console.error('Failed to save user:', err);
            alert('Ошибка при сохранении пользователя');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
        
        try {
            await fetch(`${API_URL}/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            fetchUsers();
        } catch (err) {
            console.error('Failed to delete user:', err);
            alert('Ошибка при удалении пользователя');
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            password: '',
            full_name: user.full_name,
            role: user.role,
            group_id: user.group_id || ''
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            full_name: '',
            role: 'student',
            group_id: ''
        });
    };

    useEffect(() => {
        fetchUsers();
    }, [roleFilter]);

    if (loading) return <div className="loading">Загрузка...</div>;

    return (
        <div className="users-container">
            <div className="section-header">
                <h1>Управление пользователями</h1>
                <button className="btn-primary" onClick={() => {
                    setEditingUser(null);
                    resetForm();
                    setShowModal(true);
                }}>
                    + Добавить пользователя
                </button>
            </div>

            <div className="filter-bar">
                <label>Фильтр по роли:</label>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="">Все</option>
                    <option value="student">Студент</option>
                    <option value="teacher">Преподаватель</option>
                    <option value="admin">Администратор</option>
                </select>
            </div>

            <table className="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>ФИО</th>
                        <th>Email</th>
                        <th>Роль</th>
                        <th>Группа</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.full_name}</td>
                            <td>{user.email}</td>
                            <td>{user.role === 'student' ? 'Студент' : user.role === 'teacher' ? 'Преподаватель' : 'Администратор'}</td>
                            <td>{user.group_name || '-'}</td>
                            <td>
                                <button className="btn-edit" onClick={() => handleEdit(user)}>✏️</button>
                                <button className="btn-delete" onClick={() => handleDelete(user.id)}>🗑️</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingUser ? 'Редактировать пользователя' : 'Новый пользователь'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>ФИО</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    required
                                />
                            </div>
                            {!editingUser && (
                                <div className="form-group">
                                    <label>Пароль</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        required
                                    />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Роль</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                                >
                                    <option value="student">Студент</option>
                                    <option value="teacher">Преподаватель</option>
                                    <option value="admin">Администратор</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Группа</label>
                                <select
                                    value={formData.group_id}
                                    onChange={(e) => setFormData({...formData, group_id: e.target.value})}
                                >
                                    <option value="">Без группы</option>
                                    {groups.map(group => (
                                        <option key={group.id} value={group.id}>{group.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-buttons">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
                                <button type="submit" className="btn-primary">Сохранить</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;