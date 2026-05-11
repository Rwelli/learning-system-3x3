import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

const TeacherSystems = () => {
    const [systems, setSystems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSystem, setEditingSystem] = useState(null);
    const [filter, setFilter] = useState('');
    const { getToken } = useAuth();

    const [formData, setFormData] = useState({
        a1: '', b1: '', c1: '', d1: '',
        a2: '', b2: '', c2: '', d2: '',
        a3: '', b3: '', c3: '', d3: '',
        solution_x: '', solution_y: '', solution_z: '',
        difficulty: 1
    });

    useEffect(() => {
        fetchSystems();
    }, []);

    const fetchSystems = async () => {
        try {
            const response = await fetch(`${API_URL}/systems`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await response.json();
            setSystems(data);
        } catch (err) {
            console.error('Failed to fetch systems:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingSystem ? `${API_URL}/system/${editingSystem.id}` : `${API_URL}/system/create`;
        const method = editingSystem ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    a1: parseFloat(formData.a1),
                    b1: parseFloat(formData.b1),
                    c1: parseFloat(formData.c1),
                    d1: parseFloat(formData.d1),
                    a2: parseFloat(formData.a2),
                    b2: parseFloat(formData.b2),
                    c2: parseFloat(formData.c2),
                    d2: parseFloat(formData.d2),
                    a3: parseFloat(formData.a3),
                    b3: parseFloat(formData.b3),
                    c3: parseFloat(formData.c3),
                    d3: parseFloat(formData.d3),
                    solution_x: parseFloat(formData.solution_x),
                    solution_y: parseFloat(formData.solution_y),
                    solution_z: parseFloat(formData.solution_z),
                    difficulty: parseInt(formData.difficulty)
                })
            });

            if (!response.ok) throw new Error('Failed to save system');
            
            setShowModal(false);
            setEditingSystem(null);
            resetForm();
            fetchSystems();
        } catch (err) {
            console.error('Failed to save system:', err);
            alert('Ошибка при сохранении системы');
        }
    };

    const handleEdit = (system) => {
        setEditingSystem(system);
        setFormData({
            a1: system.a1, b1: system.b1, c1: system.c1, d1: system.d1,
            a2: system.a2, b2: system.b2, c2: system.c2, d2: system.d2,
            a3: system.a3, b3: system.b3, c3: system.c3, d3: system.d3,
            solution_x: system.solution_x,
            solution_y: system.solution_y,
            solution_z: system.solution_z,
            difficulty: system.difficulty
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Вы уверены, что хотите удалить эту систему?')) return;

        try {
            await fetch(`${API_URL}/system/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            fetchSystems();
        } catch (err) {
            console.error('Failed to delete system:', err);
        }
    };

    const handleGenerate = async () => {
        const difficulty = parseInt(formData.difficulty) || 1;
        
        try {
            const response = await fetch(`${API_URL}/system/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ difficulty })
            });

            if (!response.ok) throw new Error('Failed to generate system');
            
            const system = await response.json();
            setFormData({
                a1: system.a1, b1: system.b1, c1: system.c1, d1: system.d1,
                a2: system.a2, b2: system.b2, c2: system.c2, d2: system.d2,
                a3: system.a3, b3: system.b3, c3: system.c3, d3: system.d3,
                solution_x: system.solution_x,
                solution_y: system.solution_y,
                solution_z: system.solution_z,
                difficulty: system.difficulty
            });
        } catch (err) {
            console.error('Failed to generate system:', err);
        }
    };

    const resetForm = () => {
        setFormData({
            a1: '', b1: '', c1: '', d1: '',
            a2: '', b2: '', c2: '', d2: '',
            a3: '', b3: '', c3: '', d3: '',
            solution_x: '', solution_y: '', solution_z: '',
            difficulty: 1
        });
    };

    const filteredSystems = systems.filter(s => 
        filter === '' || s.difficulty === parseInt(filter)
    );

    if (loading) {
        return <div className="loading">Загрузка...</div>;
    }

    return (
        <div className="teacher-systems">
            <div className="section-header">
                <h1>Управление системами уравнений</h1>
                <button className="btn-primary" onClick={() => { setShowModal(true); setEditingSystem(null); resetForm(); }}>
                    Добавить систему
                </button>
            </div>

            <div className="filter-bar">
                <label>Фильтр по сложности:</label>
                <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="">Все</option>
                    <option value="1">1 - Легко</option>
                    <option value="2">2 - Средне</option>
                    <option value="3">3 - Сложно</option>
                    <option value="4">4 - Очень сложно</option>
                    <option value="5">5 - Эксперт</option>
                </select>
            </div>

            <div className="systems-list">
                {filteredSystems.map((system) => (
                    <div key={system.id} className="system-card">
                        <div className="system-info">
                            <div className="difficulty-badge">Сложность: {system.difficulty}</div>
                            <div className="system-display">
                                {formatEquation(system.a1, system.b1, system.c1, system.d1)}<br/>
                                {formatEquation(system.a2, system.b2, system.c2, system.d2)}<br/>
                                {formatEquation(system.a3, system.b3, system.c3, system.d3)}
                            </div>
                            <div className="solution-info">
                                Ответ: x={system.solution_x}, y={system.solution_y}, z={system.solution_z}
                            </div>
                            {system.created_by_name && (
                                <div className="created-by">
                                    Создал: {system.created_by_name}
                                </div>
                            )}
                        </div>
                        <div className="system-actions">
                            <button className="btn-edit" onClick={() => handleEdit(system)}>Редактировать</button>
                            <button className="btn-delete" onClick={() => handleDelete(system.id)}>Удалить</button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingSystem ? 'Редактировать систему' : 'Новая система'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-section">
                                <h4>Уравнение 1</h4>
                                <div className="equation-inputs">
                                    <input name="a1" value={formData.a1} onChange={handleInputChange} placeholder="a1" required />
                                    <span>x +</span>
                                    <input name="b1" value={formData.b1} onChange={handleInputChange} placeholder="b1" required />
                                    <span>y +</span>
                                    <input name="c1" value={formData.c1} onChange={handleInputChange} placeholder="c1" required />
                                    <span>z =</span>
                                    <input name="d1" value={formData.d1} onChange={handleInputChange} placeholder="d1" required />
                                </div>
                            </div>
                            <div className="form-section">
                                <h4>Уравнение 2</h4>
                                <div className="equation-inputs">
                                    <input name="a2" value={formData.a2} onChange={handleInputChange} placeholder="a2" required />
                                    <span>x +</span>
                                    <input name="b2" value={formData.b2} onChange={handleInputChange} placeholder="b2" required />
                                    <span>y +</span>
                                    <input name="c2" value={formData.c2} onChange={handleInputChange} placeholder="c2" required />
                                    <span>z =</span>
                                    <input name="d2" value={formData.d2} onChange={handleInputChange} placeholder="d2" required />
                                </div>
                            </div>
                            <div className="form-section">
                                <h4>Уравнение 3</h4>
                                <div className="equation-inputs">
                                    <input name="a3" value={formData.a3} onChange={handleInputChange} placeholder="a3" required />
                                    <span>x +</span>
                                    <input name="b3" value={formData.b3} onChange={handleInputChange} placeholder="b3" required />
                                    <span>y +</span>
                                    <input name="c3" value={formData.c3} onChange={handleInputChange} placeholder="c3" required />
                                    <span>z =</span>
                                    <input name="d3" value={formData.d3} onChange={handleInputChange} placeholder="d3" required />
                                </div>
                            </div>
                            <div className="form-section">
                                <h4>Правильное решение</h4>
                                <div className="solution-inputs">
                                    <label>x =</label>
                                    <input name="solution_x" value={formData.solution_x} onChange={handleInputChange} placeholder="x" required />
                                    <label>y =</label>
                                    <input name="solution_y" value={formData.solution_y} onChange={handleInputChange} placeholder="y" required />
                                    <label>z =</label>
                                    <input name="solution_z" value={formData.solution_z} onChange={handleInputChange} placeholder="z" required />
                                </div>
                            </div>
                            <div className="form-section">
                                <label>Сложность (1-5):</label>
                                <input type="number" name="difficulty" value={formData.difficulty} onChange={handleInputChange} min="1" max="5" required />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={handleGenerate}>
                                    Сгенерировать случайную
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                                    Отмена
                                </button>
                                <button type="submit" className="btn-primary">
                                    Сохранить
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

function formatEquation(a, b, c, d) {
    return `${formatNum(a)}x + ${formatNum(b)}y + ${formatNum(c)}z = ${formatNum(d)}`;
}

function formatNum(n) {
    const num = parseFloat(n);
    return Number.isInteger(num) ? num : num.toFixed(2);
}

export default TeacherSystems;