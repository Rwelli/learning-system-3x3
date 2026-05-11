import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import StudentTests from './components/StudentTests';
import TestPage from './components/TestPage';
import TeacherSystems from './components/TeacherSystems';
import TeacherTests from './components/TeacherTests';
import TeacherResults from './components/TeacherResults';
import AdminUsers from './components/AdminUsers';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading">Загрузка...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  
  return children;
};

function Dashboard() {
  const { user, logout } = useAuth();

  if (user?.role === 'student') {
    return <StudentTests />;
  }

  if (user?.role === 'teacher') {
    return (
      <div className="dashboard">
        <h1>Панель преподавателя</h1>
        <div className="dashboard-grid">
          <Link to="/teacher/tests" className="dashboard-card">
            <h3>📋 Тесты</h3>
            <p>Управление тестами</p>
          </Link>
          <Link to="/teacher/systems" className="dashboard-card">
            <h3>📐 Системы уравнений</h3>
            <p>Управление системами 3×3</p>
          </Link>
          <Link to="/teacher/results" className="dashboard-card">
            <h3>📊 Результаты</h3>
            <p>Просмотр результатов студентов</p>
          </Link>
          <Link to="/profile" className="dashboard-card">
            <h3>👤 Профиль</h3>
            <p>Ваши настройки</p>
          </Link>
          <button onClick={logout} className="logout-btn">Выйти</button>
        </div>
      </div>
    );
  }

  if (user?.role === 'admin') {
    return <AdminUsers />;
  }

  return <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/test/:id" element={<PrivateRoute allowedRoles={['student']}><TestPage /></PrivateRoute>} />
      <Route path="/teacher/tests" element={<PrivateRoute allowedRoles={['teacher', 'admin']}><TeacherTests /></PrivateRoute>} />
      <Route path="/teacher/systems" element={<PrivateRoute allowedRoles={['teacher', 'admin']}><TeacherSystems /></PrivateRoute>} />
      <Route path="/teacher/results" element={<PrivateRoute allowedRoles={['teacher', 'admin']}><TeacherResults /></PrivateRoute>} />
      <Route path="/admin/users" element={<PrivateRoute allowedRoles={['admin']}><AdminUsers /></PrivateRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;