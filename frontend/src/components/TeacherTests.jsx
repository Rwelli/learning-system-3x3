import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

const TeacherTests = () => {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTest, setEditingTest] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_date: '',
        end_date: ''
    });
    const { getToken } = useAuth();

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        try {
            const response = await fetch(`${API_URL}/tests`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setTests(data);
        } catch (err) {
            console.error('Failed to fetch tests:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingTest 
                ? `${API_URL}/test/${editingTest.id}`
                : `${API_URL}/tests/create`;
            
            const method = editingTest ? 'PUT' : 'POST';
            
            const dataToSend = {
                title: formData.title,
                description: formData.description,
                start_date: formData.start_date === '' ? null : formData.start_date,
                end_date: formData.end_date === '' ? null : formData.end_date
            };
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify(dataToSend)
            });
            
            if (!response.ok) throw new Error('Failed to save test');
            
            setShowForm(false);
            setEditingTest(null);
            setFormData({ title: '', description: '', start_date: '', end_date: '' });
            fetchTests();
        } catch (err) {
            console.error('Failed to save test:', err);
            alert('Ошибка при сохранении теста');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить этот тест?')) return;
        
        try {
            const response = await fetch(`${API_URL}/test/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (!response.ok) throw new Error('Failed to delete');
            fetchTests();
        } catch (err) {
            console.error('Failed to delete test:', err);
            alert('Ошибка при удалении теста');
        }
    };

    const handleEdit = (test) => {
        setEditingTest(test);
        setFormData({
            title: test.title,
            description: test.description || '',
            start_date: test.start_date ? test.start_date.split('T')[0] : '',
            end_date: test.end_date ? test.end_date.split('T')[0] : ''
        });
        setShowForm(true);
    };

    if (loading) return <div className="loading">Загрузка...</div>;

    return (
        <div className="teacher-tests">
            <div className="header">
                <h1>Управление тестами</h1>
                <button className="btn-primary" onClick={() => {
                    setEditingTest(null);
                    setFormData({ title: '', description: '', start_date: '', end_date: '' });
                    setShowForm(true);
                }}>
                    + Создать тест
                </button>
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>{editingTest ? 'Редактировать тест' : 'Новый тест'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Название</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Описание</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Дата начала (необязательно)</label>
                                <input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Дата окончания (необязательно)</label>
                                <input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                />
                            </div>
                            <div className="modal-buttons">
                                <button type="button" className="btn-secondary" onClick={() => {
                                    setShowForm(false);
                                    setEditingTest(null);
                                }}>Отмена</button>
                                <button type="submit" className="btn-primary">Сохранить</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="tests-list">
                <table className="data-table">
                    <thead>
                        <tr><th>ID</th><th>Название</th><th>Описание</th><th>Дата начала</th><th>Дата окончания</th><th>Действия</th></tr>
                    </thead>
                    <tbody>
                        {tests.map(test => (
                            <tr key={test.id}>
                                <td>{test.id}</td>
                                <td>{test.title}</td>
                                <td>{test.description}</td>
                                <td>{test.start_date ? new Date(test.start_date).toLocaleDateString() : '-'}</td>
                                <td>{test.end_date ? new Date(test.end_date).toLocaleDateString() : '-'}</td>
                                <td>
                                    <button className="btn-edit" onClick={() => handleEdit(test)}>✏️</button>
                                    <button className="btn-delete" onClick={() => handleDelete(test.id)}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeacherTests;