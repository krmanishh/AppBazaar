import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getProfile } from './store/slices/authSlice'
import { selectIsAuthenticated, selectUser } from './store/slices/authSlice'
import { selectTheme } from './store/slices/uiSlice'
import { setTheme } from './store/slices/uiSlice'

// Layout Components
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'

// Page Components
import HomePage from './pages/HomePage'
import MarketplacePage from './pages/MarketplacePage'
import AppDetailPage from './pages/AppDetailPage'
import UserDashboardPage from './pages/UserDashboardPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import ProfilePage from './pages/ProfilePage'
import CreateAppPage from './pages/CreateAppPage'
import EditAppPage from './pages/EditAppPage'
import WishlistPage from './pages/WishlistPage'
import PurchasesPage from './pages/PurchasesPage'
import MyAppsPage from './pages/MyAppsPage'
import NotFoundPage from './pages/NotFoundPage'

// Modal Components
import LoginModal from './components/auth/LoginModal'
import RegisterModal from './components/auth/RegisterModal'
import CreateAppModal from './components/apps/CreateAppModal'
import EditAppModal from './components/apps/EditAppModal'
import DeleteAppModal from './components/apps/DeleteAppModal'
import ReviewModal from './components/apps/ReviewModal'

function App() {
  const dispatch = useDispatch()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectUser)
  const theme = useSelector(selectTheme)

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme && savedTheme !== theme) {
      dispatch(setTheme(savedTheme))
    }
  }, [dispatch, theme])

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
  }, [theme])

  // Check authentication status on app load
  useEffect(() => {
    if (isAuthenticated && user) {
      dispatch(getProfile())
    }
  }, [dispatch, isAuthenticated, user])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/app/:id" element={<AppDetailPage />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <UserDashboardPage />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          <Route path="/wishlist" element={
            <ProtectedRoute>
              <WishlistPage />
            </ProtectedRoute>
          } />
          
          <Route path="/purchases" element={
            <ProtectedRoute>
              <PurchasesPage />
            </ProtectedRoute>
          } />
          
          <Route path="/my-apps" element={
            <ProtectedRoute>
              <MyAppsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/create-app" element={
            <ProtectedRoute>
              <CreateAppPage />
            </ProtectedRoute>
          } />
          
          <Route path="/edit-app/:id" element={
            <ProtectedRoute>
              <EditAppPage />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          } />
          
          <Route path="/admin/*" element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          } />
          
          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>

      {/* Modals */}
      <LoginModal />
      <RegisterModal />
      <CreateAppModal />
      <EditAppModal />
      <DeleteAppModal />
      <ReviewModal />
    </div>
  )
}

export default App
