import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import PortalLayout from './layouts/PortalLayout'
import Dashboard from './pages/Dashboard'
import PerCareRequestsListPage from './pages/percare/PerCareRequestsListPage'
import PerCareRequestDetailsPage from './pages/percare/PerCareRequestDetailsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<PortalLayout />}>
        <Route index element={<Navigate to="/percare/requests" replace />} />
        <Route path="dashboard"              element={<Dashboard />} />
        <Route path="percare/requests"       element={<PerCareRequestsListPage />} />
        <Route path="percare/requests/:id"   element={<PerCareRequestDetailsPage />} />
        <Route path="*"                      element={<Navigate to="/percare/requests" replace />} />
      </Route>
    </Routes>
  )
}
