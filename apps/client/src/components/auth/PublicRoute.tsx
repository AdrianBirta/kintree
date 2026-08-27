import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PublicRoute: React.FC = () => {
  const token = localStorage.getItem('access_token');
  return token ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default PublicRoute;