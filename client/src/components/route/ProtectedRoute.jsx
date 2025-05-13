import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Loader from '../Loader';

const ProtectedRoute = ({ isLoggedIn }) => {
  const location = useLocation();

  if (isLoggedIn === null) {
    return <Loader />;
  }

  return isLoggedIn ? <Outlet /> : <Navigate to="/login" state={{ from: location }} />;
};

export default ProtectedRoute;
