// src/components/auth/PrivateRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from 'store/authStore';
import Loading from 'components/common/Loading';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  // You could add a loading state here if checking auth status
  if (isAuthenticated === undefined) {
    return <Loading fullScreen text="Checking authentication..." />;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export default PrivateRoute;