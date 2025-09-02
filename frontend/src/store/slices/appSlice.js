import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { appAPI } from '../../services/api'

// Async thunks
export const fetchApps = createAsyncThunk(
  'apps/fetchApps',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await appAPI.getApps(filters)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch apps')
    }
  }
)

export const fetchFeaturedApps = createAsyncThunk(
  'apps/fetchFeaturedApps',
  async (_, { rejectWithValue }) => {
    try {
      const response = await appAPI.getFeaturedApps()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch featured apps')
    }
  }
)

export const fetchAppById = createAsyncThunk(
  'apps/fetchAppById',
  async (appId, { rejectWithValue }) => {
    try {
      const response = await appAPI.getAppById(appId)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch app')
    }
  }
)

export const createApp = createAsyncThunk(
  'apps/createApp',
  async (appData, { rejectWithValue }) => {
    try {
      const response = await appAPI.createApp(appData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create app')
    }
  }
)

export const updateApp = createAsyncThunk(
  'apps/updateApp',
  async ({ appId, appData }, { rejectWithValue }) => {
    try {
      const response = await appAPI.updateApp(appId, appData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update app')
    }
  }
)

export const deleteApp = createAsyncThunk(
  'apps/deleteApp',
  async (appId, { rejectWithValue }) => {
    try {
      await appAPI.deleteApp(appId)
      return appId
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete app')
    }
  }
)

export const toggleWishlist = createAsyncThunk(
  'apps/toggleWishlist',
  async (appId, { rejectWithValue }) => {
    try {
      const response = await appAPI.toggleWishlist(appId)
      return { appId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle wishlist')
    }
  }
)

export const purchaseApp = createAsyncThunk(
  'apps/purchaseApp',
  async (appId, { rejectWithValue }) => {
    try {
      const response = await appAPI.purchaseApp(appId)
      return { appId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to purchase app')
    }
  }
)

export const addReview = createAsyncThunk(
  'apps/addReview',
  async ({ appId, reviewData }, { rejectWithValue }) => {
    try {
      const response = await appAPI.addReview(appId, reviewData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add review')
    }
  }
)

export const fetchUserApps = createAsyncThunk(
  'apps/fetchUserApps',
  async (_, { rejectWithValue }) => {
    try {
      const response = await appAPI.getUserApps()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user apps')
    }
  }
)

const initialState = {
  // Marketplace apps
  marketplaceApps: [],
  featuredApps: [],
  currentApp: null,
  
  // User apps
  userApps: [],
  
  // Pagination
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12
  },
  
  // Filters
  filters: {
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  
  // Loading states
  isLoading: false,
  isFeaturedLoading: false,
  isAppLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isWishlistLoading: false,
  isPurchasing: false,
  isReviewing: false,
  isUserAppsLoading: false,
  
  // Error states
  error: null,
  featuredError: null,
  appError: null,
  createError: null,
  updateError: null,
  deleteError: null,
  wishlistError: null,
  purchaseError: null,
  reviewError: null,
  userAppsError: null
}

const appSlice = createSlice({
  name: 'apps',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null
      state.featuredError = null
      state.appError = null
      state.createError = null
      state.updateError = null
      state.deleteError = null
      state.wishlistError = null
      state.purchaseError = null
      state.reviewError = null
      state.userAppsError = null
    },
    
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    
    clearFilters: (state) => {
      state.filters = {
        search: '',
        category: '',
        minPrice: '',
        maxPrice: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }
    },
    
    clearCurrentApp: (state) => {
      state.currentApp = null
    },
    
    clearUserApps: (state) => {
      state.userApps = []
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Apps
      .addCase(fetchApps.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchApps.fulfilled, (state, action) => {
        state.isLoading = false
        state.marketplaceApps = action.payload.apps
        state.pagination = action.payload.pagination
      })
      .addCase(fetchApps.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
      // Fetch Featured Apps
      .addCase(fetchFeaturedApps.pending, (state) => {
        state.isFeaturedLoading = true
        state.featuredError = null
      })
      .addCase(fetchFeaturedApps.fulfilled, (state, action) => {
        state.isFeaturedLoading = false
        state.featuredApps = action.payload
      })
      .addCase(fetchFeaturedApps.rejected, (state, action) => {
        state.isFeaturedLoading = false
        state.featuredError = action.payload
      })
      
      // Fetch App by ID
      .addCase(fetchAppById.pending, (state) => {
        state.isAppLoading = true
        state.appError = null
      })
      .addCase(fetchAppById.fulfilled, (state, action) => {
        state.isAppLoading = false
        state.currentApp = action.payload
      })
      .addCase(fetchAppById.rejected, (state, action) => {
        state.isAppLoading = false
        state.appError = action.payload
      })
      
      // Create App
      .addCase(createApp.pending, (state) => {
        state.isCreating = true
        state.createError = null
      })
      .addCase(createApp.fulfilled, (state, action) => {
        state.isCreating = false
        state.userApps.unshift(action.payload)
      })
      .addCase(createApp.rejected, (state, action) => {
        state.isCreating = false
        state.createError = action.payload
      })
      
      // Update App
      .addCase(updateApp.pending, (state) => {
        state.isUpdating = true
        state.updateError = null
      })
      .addCase(updateApp.fulfilled, (state, action) => {
        state.isUpdating = false
        // Update in marketplace apps if exists
        const marketplaceIndex = state.marketplaceApps.findIndex(app => app._id === action.payload._id)
        if (marketplaceIndex !== -1) {
          state.marketplaceApps[marketplaceIndex] = action.payload
        }
        // Update in user apps if exists
        const userIndex = state.userApps.findIndex(app => app._id === action.payload._id)
        if (userIndex !== -1) {
          state.userApps[userIndex] = action.payload
        }
        // Update current app if it's the one being updated
        if (state.currentApp && state.currentApp._id === action.payload._id) {
          state.currentApp = action.payload
        }
      })
      .addCase(updateApp.rejected, (state, action) => {
        state.isUpdating = false
        state.updateError = action.payload
      })
      
      // Delete App
      .addCase(deleteApp.pending, (state) => {
        state.isDeleting = true
        state.deleteError = null
      })
      .addCase(deleteApp.fulfilled, (state, action) => {
        state.isDeleting = false
        // Remove from user apps
        state.userApps = state.userApps.filter(app => app._id !== action.payload)
        // Remove from marketplace apps if exists
        state.marketplaceApps = state.marketplaceApps.filter(app => app._id !== action.payload)
        // Clear current app if it's the one being deleted
        if (state.currentApp && state.currentApp._id === action.payload) {
          state.currentApp = null
        }
      })
      .addCase(deleteApp.rejected, (state, action) => {
        state.isDeleting = false
        state.deleteError = action.payload
      })
      
      // Toggle Wishlist
      .addCase(toggleWishlist.pending, (state) => {
        state.isWishlistLoading = true
        state.wishlistError = null
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        state.isWishlistLoading = false
        // Update current app wishlist status if viewing it
        if (state.currentApp && state.currentApp._id === action.payload.appId) {
          state.currentApp.inWishlist = action.payload.inWishlist
        }
      })
      .addCase(toggleWishlist.rejected, (state, action) => {
        state.isWishlistLoading = false
        state.wishlistError = action.payload
      })
      
      // Purchase App
      .addCase(purchaseApp.pending, (state) => {
        state.isPurchasing = true
        state.purchaseError = null
      })
      .addCase(purchaseApp.fulfilled, (state, action) => {
        state.isPurchasing = false
        // Update current app purchase status if viewing it
        if (state.currentApp && state.currentApp._id === action.payload.appId) {
          state.currentApp.hasPurchased = true
        }
      })
      .addCase(purchaseApp.rejected, (state, action) => {
        state.isPurchasing = false
        state.purchaseError = action.payload
      })
      
      // Add Review
      .addCase(addReview.pending, (state) => {
        state.isReviewing = true
        state.reviewError = null
      })
      .addCase(addReview.fulfilled, (state, action) => {
        state.isReviewing = false
        // Update current app with new review data
        if (state.currentApp && state.currentApp._id === action.payload._id) {
          state.currentApp = action.payload
        }
      })
      .addCase(addReview.rejected, (state, action) => {
        state.isReviewing = false
        state.reviewError = action.payload
      })
      
      // Fetch User Apps
      .addCase(fetchUserApps.pending, (state) => {
        state.isUserAppsLoading = true
        state.userAppsError = null
      })
      .addCase(fetchUserApps.fulfilled, (state, action) => {
        state.isUserAppsLoading = false
        state.userApps = action.payload
      })
      .addCase(fetchUserApps.rejected, (state, action) => {
        state.isUserAppsLoading = false
        state.userAppsError = action.payload
      })
  }
})

export const { 
  clearErrors, 
  setFilters, 
  clearFilters, 
  clearCurrentApp, 
  clearUserApps 
} = appSlice.actions

export default appSlice.reducer

// Selectors
export const selectApps = (state) => state.apps
export const selectMarketplaceApps = (state) => state.apps.marketplaceApps
export const selectFeaturedApps = (state) => state.apps.featuredApps
export const selectCurrentApp = (state) => state.apps.currentApp
export const selectUserApps = (state) => state.apps.userApps
export const selectPagination = (state) => state.apps.pagination
export const selectFilters = (state) => state.apps.filters
export const selectIsLoading = (state) => state.apps.isLoading
export const selectIsFeaturedLoading = (state) => state.apps.isFeaturedLoading
export const selectIsAppLoading = (state) => state.apps.isAppLoading
export const selectIsCreating = (state) => state.apps.isCreating
export const selectIsUpdating = (state) => state.apps.isUpdating
export const selectIsDeleting = (state) => state.apps.isDeleting
export const selectIsWishlistLoading = (state) => state.apps.isWishlistLoading
export const selectIsPurchasing = (state) => state.apps.isPurchasing
export const selectIsReviewing = (state) => state.apps.isReviewing
export const selectIsUserAppsLoading = (state) => state.apps.isUserAppsLoading
export const selectError = (state) => state.apps.error
export const selectFeaturedError = (state) => state.apps.featuredError
export const selectAppError = (state) => state.apps.appError
export const selectCreateError = (state) => state.apps.createError
export const selectUpdateError = (state) => state.apps.updateError
export const selectDeleteError = (state) => state.apps.deleteError
export const selectWishlistError = (state) => state.apps.wishlistError
export const selectPurchaseError = (state) => state.apps.purchaseError
export const selectReviewError = (state) => state.apps.reviewError
export const selectUserAppsError = (state) => state.apps.userAppsError
