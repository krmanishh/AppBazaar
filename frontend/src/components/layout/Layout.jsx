import React from 'react'
import Header from './Header'
import Footer from './Footer'
import Sidebar from './Sidebar'
import MobileMenu from './MobileMenu'
import { useSelector } from 'react-redux'
import { selectIsSidebarOpen, selectIsMobileMenuOpen } from '../../store/slices/uiSlice'

const Layout = ({ children }) => {
  const isSidebarOpen = useSelector(selectIsSidebarOpen)
  const isMobileMenuOpen = useSelector(selectIsMobileMenuOpen)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header />
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && <MobileMenu />}
      
      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        {isSidebarOpen && <Sidebar />}
        
        {/* Main Content Area */}
        <main className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        }`}>
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

export default Layout
