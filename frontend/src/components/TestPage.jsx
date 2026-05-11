import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

const TestPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const [test, setTest] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [results, setResults] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchTest();
    }, [id]);

    const fetchTest = async () => {
        try {
            const response = await fetch(`${API_URL}/test/${id}`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (!response.ok) throw new Error('Test not found');
            const data = await response.json();
            setTest(data.test);
            setQuestions(data.questions);
        } catch (err) {
            console.error('Failed to fetch test:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionId, variable, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                [variable]: value
            }
        }));
    };

    const checkAnswer = async (questionId) => {
        const answer = answers[questionId];
        if (!answer || answer.x === undefined || answer.y === undefined || answer.z === undefined) {
            alert('Введите значения для x, y и z');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/system/check`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    system_id: questions[currentIndex].system_id,
                    user_x: parseFloat(answer.x),
                    user_y: parseFloat(answer.y),
                    user_z: parseFloat(answer.z)
                })
            });
            const data = await response.json();
            setResults(prev => ({
                ...prev,
                [questionId]: data
            }));
        } catch (err) {
            console.error('Failed to check answer:', err);
        }
    };

    const nextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const prevQuestion = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const finishTest = async () => {
        setSubmitting(true);
        
        let score = 0;
        let maxScore = questions.reduce((sum, q) => sum + q.points, 0);
        
        for (const q of questions) {
            if (results[q.id]?.isCorrect) {
                score += q.points;
            }
        }

        try {
            await fetch(`${API_URL}/test/${id}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ score, max_score: maxScore })
            });
            
            navigate('/');
        } catch (err) {
            console.error('Failed to submit test:', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="loading">Загрузка теста...</div>;
    }

    if (!test || questions.length === 0) {
        return <div className="error-message">Тест не найден</div>;
    }

    const currentQuestion = questions[currentIndex];
    const currentAnswer = answers[currentQuestion?.id] || {};
    const currentResult = results[currentQuestion?.id];

    const formatCoefficient = (value) => {
        const num = parseFloat(value);
        if (Number.isInteger(num)) return num;
        return num.toFixed(2);
    };

    return (
        <div className="test-page">
            <div className="test-header-info">
                <h1>{test.title}</h1>
                <p>{test.description}</p>
                <div className="progress-info">
                    Вопрос {currentIndex + 1} из {questions.length}
                </div>
            </div>

            {currentQuestion && (
                <div className="question-container">
                    <div className="equation-system">
                        <h3>Решите систему уравнений:</h3>
                        <div className="system-display">
                            <div className="equation">
                                {formatCoefficient(currentQuestion.system.a1)}x + {formatCoefficient(currentQuestion.system.b1)}y + {formatCoefficient(currentQuestion.system.c1)}z = {formatCoefficient(currentQuestion.system.d1)}
                            </div>
                            <div className="equation">
                                {formatCoefficient(currentQuestion.system.a2)}x + {formatCoefficient(currentQuestion.system.b2)}y + {formatCoefficient(currentQuestion.system.c2)}z = {formatCoefficient(currentQuestion.system.d2)}
                            </div>
                            <div className="equation">
                                {formatCoefficient(currentQuestion.system.a3)}x + {formatCoefficient(currentQuestion.system.b3)}y + {formatCoefficient(currentQuestion.system.c3)}z = {formatCoefficient(currentQuestion.system.d3)}
                            </div>
                        </div>
                        <div className="difficulty-badge">
                            Сложность: {currentQuestion.difficulty}/5
                        </div>
                        <div className="points-badge">
                            {currentQuestion.points} баллов
                        </div>
                    </div>

                    <div className="answer-section">
                        <h4>Введите ваш ответ:</h4>
                        <div className="answer-inputs">
                            <div className="input-group">
                                <label>x =</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={currentAnswer.x || ''}
                                    onChange={(e) => handleAnswerChange(currentQuestion.id, 'x', e.target.value)}
                                    placeholder="x"
                                />
                            </div>
                            <div className="input-group">
                                <label>y =</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={currentAnswer.y || ''}
                                    onChange={(e) => handleAnswerChange(currentQuestion.id, 'y', e.target.value)}
                                    placeholder="y"
                                />
                            </div>
                            <div className="input-group">
                                <label>z =</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={currentAnswer.z || ''}
                                    onChange={(e) => handleAnswerChange(currentQuestion.id, 'z', e.target.value)}
                                    placeholder="z"
                                />
                            </div>
                        </div>
                        <button 
                            className="btn-check"
                            onClick={() => checkAnswer(currentQuestion.id)}
                        >
                            Проверить
                        </button>
                    </div>

                    {currentResult && (
                        <div className={`result-section ${currentResult.isCorrect ? 'correct' : 'incorrect'}`}>
                            <h4>{currentResult.isCorrect ? 'Верно!' : 'Неверно'}</h4>
                            
                            <div className="verification">
                                <h5>Проверка подстановкой:</h5>
                                <div className="equation-check">
                                    <span className={Math.abs(currentResult.equations[0].calculated - currentResult.equations[0].expected) < 0.001 ? 'check-ok' : 'check-error'}>
                                        Уравнение 1: {currentResult.equations[0].calculated.toFixed(3)} {Math.abs(currentResult.equations[0].calculated - currentResult.equations[0].expected) < 0.001 ? '✓' : '✗'} (ожидалось {currentResult.equations[0].expected})
                                    </span>
                                </div>
                                <div className="equation-check">
                                    <span className={Math.abs(currentResult.equations[1].calculated - currentResult.equations[1].expected) < 0.001 ? 'check-ok' : 'check-error'}>
                                        Уравнение 2: {currentResult.equations[1].calculated.toFixed(3)} {Math.abs(currentResult.equations[1].calculated - currentResult.equations[1].expected) < 0.001 ? '✓' : '✗'} (ожидалось {currentResult.equations[1].expected})
                                    </span>
                                </div>
                                <div className="equation-check">
                                    <span className={Math.abs(currentResult.equations[2].calculated - currentResult.equations[2].expected) < 0.001 ? 'check-ok' : 'check-error'}>
                                        Уравнение 3: {currentResult.equations[2].calculated.toFixed(3)} {Math.abs(currentResult.equations[2].calculated - currentResult.equations[2].expected) < 0.001 ? '✓' : '✗'} (ожидалось {currentResult.equations[2].expected})
                                    </span>
                                </div>
                            </div>

                            {!currentResult.isCorrect && (
                                <div className="correct-answer">
                                    Правильный ответ: x={currentResult.correctAnswer.x}, y={currentResult.correctAnswer.y}, z={currentResult.correctAnswer.z}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="navigation-buttons">
                <button 
                    className="btn-secondary"
                    onClick={prevQuestion}
                    disabled={currentIndex === 0}
                >
                    Назад
                </button>
                
                <div className="question-dots">
                    {questions.map((q, idx) => (
                        <span 
                            key={q.id} 
                            className={`dot ${idx === currentIndex ? 'active' : ''} ${results[q.id]?.isCorrect ? 'correct' : ''} ${results[q.id] && !results[q.id].isCorrect ? 'incorrect' : ''}`}
                        />
                    ))}
                </div>

                {currentIndex === questions.length - 1 ? (
                    <button 
                        className="btn-primary"
                        onClick={finishTest}
                        disabled={submitting}
                    >
                        {submitting ? 'Завершение...' : 'Завершить тест'}
                    </button>
                ) : (
                    <button 
                        className="btn-primary"
                        onClick={nextQuestion}
                    >
                        Далее
                    </button>
                )}
            </div>
        </div>
    );
};

export default TestPage;