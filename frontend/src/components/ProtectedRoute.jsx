import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="page-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="box" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <div className="loading-spinner" style={{ margin: '20px auto' }}></div>
          <p style={{ color: '#94a3b8' }}>Checking authentication...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
