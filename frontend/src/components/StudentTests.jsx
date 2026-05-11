import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

const StudentTests = () => {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const { getToken } = useAuth();

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        try {
            const response = await fetch(`${API_URL}/tests`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await response.json();
            // ترتيب الاختبارات حسب التوفر والأولوية
            const sortedTests = data.sort((a, b) => {
                if (a.start_date && !b.start_date) return -1;
                if (!a.start_date && b.start_date) return 1;
                return a.id - b.id;
            });
            setTests(sortedTests);
        } catch (err) {
            console.error('Failed to fetch tests:', err);
        } finally {
            setLoading(false);
        }
    };

    const isTestActive = (test) => {
        const now = new Date();
        const start = test.start_date ? new Date(test.start_date) : null;
        const end = test.end_date ? new Date(test.end_date) : null;
        
        if (start && now < start) return false;
        if (end && now > end) return false;
        return true;
    };

    const getDifficultyColor = (difficulty) => {
        switch(difficulty) {
            case 1: return '#28a745';
            case 2: return '#ffc107';
            case 3: return '#fd7e14';
            case 4: return '#dc3545';
            case 5: return '#6f42c1';
            default: return '#6c757d';
        }
    };

    if (loading) {
        return <div className="loading">Загрузка тестов...</div>;
    }

    return (
        <div className="student-tests-container">
            <div className="student-tests-header">
                <h1>📚 Доступные тесты</h1>
                <p>Выберите тест для прохождения</p>
            </div>

            {tests.length === 0 ? (
                <div className="no-tests">
                    <p>Нет доступных тестов</p>
                </div>
            ) : (
                <div className="tests-grid">
                    {tests.map((test) => {
                        const isActive = isTestActive(test);
                        return (
                            <div key={test.id} className={`test-card ${isActive ? 'active' : 'inactive'}`}>
                                <div className="test-card-header">
                                    <div className="test-icon">
                                        {test.title.includes('Гаусса') ? '📐' : test.title.includes('Крамера') ? '📊' : '📝'}
                                    </div>
                                    <div className="test-title-section">
                                        <h3>{test.title}</h3>
                                        {!isActive && (
                                            <span className="test-status-badge">🔒 Недоступен</span>
                                        )}
                                        {isActive && (
                                            <span className="test-status-badge available">✅ Доступен</span>
                                        )}
                                    </div>
                                </div>
                                
                                <p className="test-description">{test.description || 'Описание отсутствует'}</p>
                                
                                <div className="test-details">
                                    {test.start_date && (
                                        <div className="detail-item">
                                            <span className="detail-icon">📅</span>
                                            <span className="detail-text">Начало: {new Date(test.start_date).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    {test.end_date && (
                                        <div className="detail-item">
                                            <span className="detail-icon">⏰</span>
                                            <span className="detail-text">Конец: {new Date(test.end_date).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    <div className="detail-item">
                                        <span className="detail-icon">🎯</span>
                                        <span className="detail-text">Сложность: средняя</span>
                                    </div>
                                </div>
                                
                                {isActive && (
                                    <Link to={`/test/${test.id}`} className="start-test-btn">
                                        Начать тест
                                        <span className="btn-arrow">→</span>
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StudentTests;