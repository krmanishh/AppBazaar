import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  // Sidebar
  isSidebarOpen: false,
  
  // Modals
  isLoginModalOpen: false,
  isRegisterModalOpen: false,
  isCreateAppModalOpen: false,
  isEditAppModalOpen: false,
  isDeleteAppModalOpen: false,
  isReviewModalOpen: false,
  
  // App data for modals
  editAppData: null,
  deleteAppData: null,
  reviewAppData: null,
  
  // Notifications
  notifications: [],
  
  // Search
  isSearchOpen: false,
  
  // Mobile menu
  isMobileMenuOpen: false,
  
  // Loading overlays
  isGlobalLoading: false,
  
  // Theme
  theme: 'light', // 'light' or 'dark'
  
  // Filters sidebar
  isFiltersSidebarOpen: false
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Sidebar actions
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen
    },
    openSidebar: (state) => {
      state.isSidebarOpen = true
    },
    closeSidebar: (state) => {
      state.isSidebarOpen = false
    },
    
    // Modal actions
    openLoginModal: (state) => {
      state.isLoginModalOpen = true
    },
    closeLoginModal: (state) => {
      state.isLoginModalOpen = false
    },
    openRegisterModal: (state) => {
      state.isRegisterModalOpen = true
    },
    closeRegisterModal: (state) => {
      state.isRegisterModalOpen = false
    },
    openCreateAppModal: (state) => {
      state.isCreateAppModalOpen = true
    },
    closeCreateAppModal: (state) => {
      state.isCreateAppModalOpen = false
    },
    openEditAppModal: (state, action) => {
      state.isEditAppModalOpen = true
      state.editAppData = action.payload
    },
    closeEditAppModal: (state) => {
      state.isEditAppModalOpen = false
      state.editAppData = null
    },
    openDeleteAppModal: (state, action) => {
      state.isDeleteAppModalOpen = true
      state.deleteAppData = action.payload
    },
    closeDeleteAppModal: (state) => {
      state.isDeleteAppModalOpen = false
      state.deleteAppData = null
    },
    openReviewModal: (state, action) => {
      state.isReviewModalOpen = true
      state.reviewAppData = action.payload
    },
    closeReviewModal: (state) => {
      state.isReviewModalOpen = false
      state.reviewAppData = null
    },
    
    // Close all modals
    closeAllModals: (state) => {
      state.isLoginModalOpen = false
      state.isRegisterModalOpen = false
      state.isCreateAppModalOpen = false
      state.isEditAppModalOpen = false
      state.isDeleteAppModalOpen = false
      state.isReviewModalOpen = false
      state.editAppData = null
      state.deleteAppData = null
      state.reviewAppData = null
    },
    
    // Notification actions
    addNotification: (state, action) => {
      const notification = {
        id: Date.now(),
        type: 'info',
        message: '',
        duration: 5000,
        ...action.payload
      }
      state.notifications.push(notification)
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      )
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
    
    // Search actions
    toggleSearch: (state) => {
      state.isSearchOpen = !state.isSearchOpen
    },
    openSearch: (state) => {
      state.isSearchOpen = true
    },
    closeSearch: (state) => {
      state.isSearchOpen = false
    },
    
    // Mobile menu actions
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen
    },
    openMobileMenu: (state) => {
      state.isMobileMenuOpen = true
    },
    closeMobileMenu: (state) => {
      state.isMobileMenuOpen = false
    },
    
    // Global loading actions
    setGlobalLoading: (state, action) => {
      state.isGlobalLoading = action.payload
    },
    
    // Theme actions
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
      // Save to localStorage
      localStorage.setItem('theme', state.theme)
    },
    setTheme: (state, action) => {
      state.theme = action.payload
      localStorage.setItem('theme', action.payload)
    },
    
    // Filters sidebar actions
    toggleFiltersSidebar: (state) => {
      state.isFiltersSidebarOpen = !state.isFiltersSidebarOpen
    },
    openFiltersSidebar: (state) => {
      state.isFiltersSidebarOpen = true
    },
    closeFiltersSidebar: (state) => {
      state.isFiltersSidebarOpen = false
    },
    
    // Reset UI state
    resetUI: (state) => {
      return { ...initialState, theme: state.theme }
    }
  }
})

export const {
  // Sidebar
  toggleSidebar,
  openSidebar,
  closeSidebar,
  
  // Modals
  openLoginModal,
  closeLoginModal,
  openRegisterModal,
  closeRegisterModal,
  openCreateAppModal,
  closeCreateAppModal,
  openEditAppModal,
  closeEditAppModal,
  openDeleteAppModal,
  closeDeleteAppModal,
  openReviewModal,
  closeReviewModal,
  closeAllModals,
  
  // Notifications
  addNotification,
  removeNotification,
  clearNotifications,
  
  // Search
  toggleSearch,
  openSearch,
  closeSearch,
  
  // Mobile menu
  toggleMobileMenu,
  openMobileMenu,
  closeMobileMenu,
  
  // Global loading
  setGlobalLoading,
  
  // Theme
  toggleTheme,
  setTheme,
  
  // Filters sidebar
  toggleFiltersSidebar,
  openFiltersSidebar,
  closeFiltersSidebar,
  
  // Reset
  resetUI
} = uiSlice.actions

export default uiSlice.reducer

// Selectors
export const selectUI = (state) => state.ui
export const selectIsSidebarOpen = (state) => state.ui.isSidebarOpen
export const selectIsLoginModalOpen = (state) => state.ui.isLoginModalOpen
export const selectIsRegisterModalOpen = (state) => state.ui.isRegisterModalOpen
export const selectIsCreateAppModalOpen = (state) => state.ui.isCreateAppModalOpen
export const selectIsEditAppModalOpen = (state) => state.ui.isEditAppModalOpen
export const selectIsDeleteAppModalOpen = (state) => state.ui.isDeleteAppModalOpen
export const selectIsReviewModalOpen = (state) => state.ui.isReviewModalOpen
export const selectEditAppData = (state) => state.ui.editAppData
export const selectDeleteAppData = (state) => state.ui.deleteAppData
export const selectReviewAppData = (state) => state.ui.reviewAppData
export const selectNotifications = (state) => state.ui.notifications
export const selectIsSearchOpen = (state) => state.ui.isSearchOpen
export const selectIsMobileMenuOpen = (state) => state.ui.isMobileMenuOpen
export const selectIsGlobalLoading = (state) => state.ui.isGlobalLoading
export const selectTheme = (state) => state.ui.theme
export const selectIsFiltersSidebarOpen = (state) => state.ui.isFiltersSidebarOpen
