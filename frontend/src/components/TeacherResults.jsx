import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const TeacherResults = () => {
    const [results, setResults] = useState([]);
    const [tests, setTests] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ test_id: '', group_id: '' });
    const { getToken } = useAuth();

    useEffect(() => {
        fetchTests();
        fetchGroups();
    }, []);

    useEffect(() => {
        fetchResults();
    }, [filters]);

    const fetchTests = async () => {
        try {
            const response = await fetch('/api/tests', {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await response.json();
            setTests(data);
        } catch (err) {
            console.error('Failed to fetch tests:', err);
        }
    };

    const fetchGroups = async () => {
        try {
            const response = await fetch('/api/groups', {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await response.json();
            setGroups(data);
        } catch (err) {
            console.error('Failed to fetch groups:', err);
        }
    };

    const fetchResults = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.test_id) params.append('test_id', filters.test_id);
            if (filters.group_id) params.append('group_id', filters.group_id);

            const response = await fetch(`/api/teacher/results?${params}`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await response.json();
            setResults(data);
        } catch (err) {
            console.error('Failed to fetch results:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    if (loading) {
        return <div className="loading">Загрузка...</div>;
    }

    return (
        <div className="teacher-results">
            <h1>Результаты студентов</h1>

            <div className="filter-bar">
                <div className="filter-group">
                    <label>Тест:</label>
                    <select name="test_id" value={filters.test_id} onChange={handleFilterChange}>
                        <option value="">Все тесты</option>
                        {tests.map((test) => (
                            <option key={test.id} value={test.id}>{test.title}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Группа:</label>
                    <select name="group_id" value={filters.group_id} onChange={handleFilterChange}>
                        <option value="">Все группы</option>
                        {groups.map((group) => (
                            <option key={group.id} value={group.id}>{group.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {results.length === 0 ? (
                <p className="no-data">Нет результатов</p>
            ) : (
                <table className="results-table">
                    <thead>
                        <tr>
                            <th>Студент</th>
                            <th>Email</th>
                            <th>Группа</th>
                            <th>Тест</th>
                            <th>Баллы</th>
                            <th>Максимум</th>
                            <th>Процент</th>
                            <th>Дата</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((result) => {
                            const percentage = result.max_score > 0 ? (result.score / result.max_score) * 100 : 0;
                            return (
                                <tr key={result.id}>
                                    <td>{result.full_name}</td>
                                    <td>{result.email}</td>
                                    <td>{result.group_name || '-'}</td>
                                    <td>{result.test_title}</td>
                                    <td>{result.score}</td>
                                    <td>{result.max_score}</td>
                                    <td className={percentage >= 60 ? 'text-success' : 'text-danger'}>
                                        {percentage.toFixed(1)}%
                                    </td>
                                    <td>{new Date(result.completed_at).toLocaleDateString()}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default TeacherResults;