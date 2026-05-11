import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

const Profile = () => {
    const { user, getToken, logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        bio: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await fetch(`${API_URL}/profile`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setProfile(data);
            setFormData({
                full_name: data.full_name || '',
                email: data.email || '',
                phone: data.phone || '',
                bio: data.bio || ''
            });
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify(formData)
            });
            if (!response.ok) throw new Error('Failed to update');
            setEditing(false);
            fetchProfile();
            alert('Профиль успешно обновлен!');
        } catch (err) {
            console.error('Failed to update profile:', err);
            alert('Ошибка при обновлении профиля');
        }
    };

    const getRoleName = (role) => {
        switch(role) {
            case 'admin': return 'Администратор';
            case 'teacher': return 'Преподаватель';
            case 'student': return 'Студент';
            default: return role;
        }
    };

    const getRoleIcon = (role) => {
        switch(role) {
            case 'admin': return '👑';
            case 'teacher': return '👨‍🏫';
            case 'student': return '🎓';
            default: return '👤';
        }
    };

    if (loading) return <div className="loading">Загрузка профиля...</div>;

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-avatar">
                        {getRoleIcon(profile?.role)}
                    </div>
                    <h1>{profile?.full_name}</h1>
                    <p className="profile-role">{getRoleName(profile?.role)}</p>
                </div>

                {!editing ? (
                    <div className="profile-info">
                        <div className="info-section">
                            <h3>📋 Основная информация</h3>
                            <div className="info-row">
                                <span className="info-label">📧 Email:</span>
                                <span className="info-value">{profile?.email}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">📱 Телефон:</span>
                                <span className="info-value">{profile?.phone || 'Не указан'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">📝 О себе:</span>
                                <span className="info-value">{profile?.bio || 'Не указано'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">📅 Дата регистрации:</span>
                                <span className="info-value">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Не указана'}</span>
                            </div>
                        </div>

                        {profile?.role === 'teacher' && (
                            <div className="info-section">
                                <h3>📊 Статистика преподавателя</h3>
                                <div className="stats-grid">
                                    <div className="stat-card">
                                        <div className="stat-number">{profile?.systems_count || 0}</div>
                                        <div className="stat-label">Систем уравнений</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-number">{profile?.tests_count || 0}</div>
                                        <div className="stat-label">Тестов создано</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-number">{profile?.students_count || 0}</div>
                                        <div className="stat-label">Студентов</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {profile?.role === 'student' && (
                            <div className="info-section">
                                <h3>📊 Статистика студента</h3>
                                <div className="stats-grid">
                                    <div className="stat-card">
                                        <div className="stat-number">{profile?.solved_systems || 0}</div>
                                        <div className="stat-label">Решено систем</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-number">{profile?.average_score || 0}%</div>
                                        <div className="stat-label">Средний балл</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-number">{profile?.tests_passed || 0}</div>
                                        <div className="stat-label">Пройдено тестов</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="profile-actions">
                            <button className="btn-primary" onClick={() => setEditing(true)}>
                                ✏️ Редактировать профиль
                            </button>
                            <button className="btn-secondary" onClick={logout}>
                                🚪 Выйти
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleUpdate} className="profile-form">
                        <h3>✏️ Редактирование профиля</h3>
                        
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

                        <div className="form-group">
                            <label>Телефон</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                placeholder="+7 (XXX) XXX-XX-XX"
                            />
                        </div>

                        <div className="form-group">
                            <label>О себе</label>
                            <textarea
                                rows="4"
                                value={formData.bio}
                                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                placeholder="Расскажите о себе..."
                            />
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
                                Отмена
                            </button>
                            <button type="submit" className="btn-primary">
                                Сохранить
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Profile;