import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { auctionAPI } from '../../services/api'

// Async thunks
export const fetchAuctions = createAsyncThunk(
  'auctions/fetchAuctions',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await auctionAPI.getAuctions(filters)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch auctions')
    }
  }
)

export const fetchFeaturedAuctions = createAsyncThunk(
  'auctions/fetchFeaturedAuctions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await auctionAPI.getFeaturedAuctions()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch featured auctions')
    }
  }
)

export const fetchAuctionById = createAsyncThunk(
  'auctions/fetchAuctionById',
  async (auctionId, { rejectWithValue }) => {
    try {
      const response = await auctionAPI.getAuctionById(auctionId)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch auction')
    }
  }
)

export const createAuction = createAsyncThunk(
  'auctions/createAuction',
  async (auctionData, { rejectWithValue }) => {
    try {
      const response = await auctionAPI.createAuction(auctionData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create auction')
    }
  }
)

export const updateAuction = createAsyncThunk(
  'auctions/updateAuction',
  async ({ auctionId, auctionData }, { rejectWithValue }) => {
    try {
      const response = await auctionAPI.updateAuction(auctionId, auctionData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update auction')
    }
  }
)

export const deleteAuction = createAsyncThunk(
  'auctions/deleteAuction',
  async (auctionId, { rejectWithValue }) => {
    try {
      await auctionAPI.deleteAuction(auctionId)
      return auctionId
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete auction')
    }
  }
)

export const submitBid = createAsyncThunk(
  'auctions/submitBid',
  async ({ auctionId, bidData }, { rejectWithValue }) => {
    try {
      const response = await auctionAPI.submitBid(auctionId, bidData)
      return { auctionId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit bid')
    }
  }
)

export const acceptBid = createAsyncThunk(
  'auctions/acceptBid',
  async ({ auctionId, bidId }, { rejectWithValue }) => {
    try {
      const response = await auctionAPI.acceptBid(auctionId, bidId)
      return { auctionId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept bid')
    }
  }
)

export const fetchUserAuctions = createAsyncThunk(
  'auctions/fetchUserAuctions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await auctionAPI.getUserAuctions()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user auctions')
    }
  }
)

export const fetchUserBids = createAsyncThunk(
  'auctions/fetchUserBids',
  async (_, { rejectWithValue }) => {
    try {
      const response = await auctionAPI.getUserBids()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user bids')
    }
  }
)

const initialState = {
  // Marketplace auctions
  marketplaceAuctions: [],
  featuredAuctions: [],
  currentAuction: null,
  
  // User auctions
  userAuctions: [],
  userBids: [],
  
  // Pagination
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  },
  
  // Filters
  filters: {
    search: '',
    status: '',
    platform: '',
    category: '',
    minBudget: '',
    maxBudget: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  
  // Loading states
  isLoading: false,
  isFeaturedLoading: false,
  isAuctionLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isBidding: false,
  isAcceptingBid: false,
  isUserAuctionsLoading: false,
  isUserBidsLoading: false,
  
  // Error states
  error: null,
  featuredError: null,
  auctionError: null,
  createError: null,
  updateError: null,
  deleteError: null,
  bidError: null,
  acceptBidError: null,
  userAuctionsError: null,
  userBidsError: null
}

const auctionSlice = createSlice({
  name: 'auctions',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null
      state.featuredError = null
      state.auctionError = null
      state.createError = null
      state.updateError = null
      state.deleteError = null
      state.bidError = null
      state.acceptBidError = null
      state.userAuctionsError = null
      state.userBidsError = null
    },
    
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    
    clearFilters: (state) => {
      state.filters = {
        search: '',
        status: '',
        platform: '',
        category: '',
        minBudget: '',
        maxBudget: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }
    },
    
    clearCurrentAuction: (state) => {
      state.currentAuction = null
    },
    
    clearUserAuctions: (state) => {
      state.userAuctions = []
    },
    
    clearUserBids: (state) => {
      state.userBids = []
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Auctions
      .addCase(fetchAuctions.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchAuctions.fulfilled, (state, action) => {
        state.isLoading = false
        state.marketplaceAuctions = action.payload.auctions
        state.pagination = action.payload.pagination
      })
      .addCase(fetchAuctions.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
      // Fetch Featured Auctions
      .addCase(fetchFeaturedAuctions.pending, (state) => {
        state.isFeaturedLoading = true
        state.featuredError = null
      })
      .addCase(fetchFeaturedAuctions.fulfilled, (state, action) => {
        state.isFeaturedLoading = false
        state.featuredAuctions = action.payload
      })
      .addCase(fetchFeaturedAuctions.rejected, (state, action) => {
        state.isFeaturedLoading = false
        state.featuredError = action.payload
      })
      
      // Fetch Auction by ID
      .addCase(fetchAuctionById.pending, (state) => {
        state.isAuctionLoading = true
        state.auctionError = null
      })
      .addCase(fetchAuctionById.fulfilled, (state, action) => {
        state.isAuctionLoading = false
        state.currentAuction = action.payload
      })
      .addCase(fetchAuctionById.rejected, (state, action) => {
        state.isAuctionLoading = false
        state.auctionError = action.payload
      })
      
      // Create Auction
      .addCase(createAuction.pending, (state) => {
        state.isCreating = true
        state.createError = null
      })
      .addCase(createAuction.fulfilled, (state, action) => {
        state.isCreating = false
        state.userAuctions.unshift(action.payload)
      })
      .addCase(createAuction.rejected, (state, action) => {
        state.isCreating = false
        state.createError = action.payload
      })
      
      // Update Auction
      .addCase(updateAuction.pending, (state) => {
        state.isUpdating = true
        state.updateError = null
      })
      .addCase(updateAuction.fulfilled, (state, action) => {
        state.isUpdating = false
        // Update in marketplace auctions if exists
        const marketplaceIndex = state.marketplaceAuctions.findIndex(auction => auction._id === action.payload._id)
        if (marketplaceIndex !== -1) {
          state.marketplaceAuctions[marketplaceIndex] = action.payload
        }
        // Update in user auctions if exists
        const userIndex = state.userAuctions.findIndex(auction => auction._id === action.payload._id)
        if (userIndex !== -1) {
          state.userAuctions[userIndex] = action.payload
        }
        // Update current auction if it's the one being updated
        if (state.currentAuction && state.currentAuction._id === action.payload._id) {
          state.currentAuction = action.payload
        }
      })
      .addCase(updateAuction.rejected, (state, action) => {
        state.isUpdating = false
        state.updateError = action.payload
      })
      
      // Delete Auction
      .addCase(deleteAuction.pending, (state) => {
        state.isDeleting = true
        state.deleteError = null
      })
      .addCase(deleteAuction.fulfilled, (state, action) => {
        state.isDeleting = false
        // Remove from user auctions
        state.userAuctions = state.userAuctions.filter(auction => auction._id !== action.payload)
        // Remove from marketplace auctions if exists
        state.marketplaceAuctions = state.marketplaceAuctions.filter(auction => auction._id !== action.payload)
        // Clear current auction if it's the one being deleted
        if (state.currentAuction && state.currentAuction._id === action.payload) {
          state.currentAuction = null
        }
      })
      .addCase(deleteAuction.rejected, (state, action) => {
        state.isDeleting = false
        state.deleteError = action.payload
      })
      
      // Submit Bid
      .addCase(submitBid.pending, (state) => {
        state.isBidding = true
        state.bidError = null
      })
      .addCase(submitBid.fulfilled, (state, action) => {
        state.isBidding = false
        // Update current auction with new bid data
        if (state.currentAuction && state.currentAuction._id === action.payload.auctionId) {
          state.currentAuction = action.payload
        }
      })
      .addCase(submitBid.rejected, (state, action) => {
        state.isBidding = false
        state.bidError = action.payload
      })
      
      // Accept Bid
      .addCase(acceptBid.pending, (state) => {
        state.isAcceptingBid = true
        state.acceptBidError = null
      })
      .addCase(acceptBid.fulfilled, (state, action) => {
        state.isAcceptingBid = false
        // Update current auction with accepted bid
        if (state.currentAuction && state.currentAuction._id === action.payload.auctionId) {
          state.currentAuction = action.payload
        }
      })
      .addCase(acceptBid.rejected, (state, action) => {
        state.isAcceptingBid = false
        state.acceptBidError = action.payload
      })
      
      // Fetch User Auctions
      .addCase(fetchUserAuctions.pending, (state) => {
        state.isUserAuctionsLoading = true
        state.userAuctionsError = null
      })
      .addCase(fetchUserAuctions.fulfilled, (state, action) => {
        state.isUserAuctionsLoading = false
        state.userAuctions = action.payload
      })
      .addCase(fetchUserAuctions.rejected, (state, action) => {
        state.isUserAuctionsLoading = false
        state.userAuctionsError = action.payload
      })
      
      // Fetch User Bids
      .addCase(fetchUserBids.pending, (state) => {
        state.isUserBidsLoading = true
        state.userBidsError = null
      })
      .addCase(fetchUserBids.fulfilled, (state, action) => {
        state.isUserBidsLoading = false
        state.userBids = action.payload
      })
      .addCase(fetchUserBids.rejected, (state, action) => {
        state.isUserBidsLoading = false
        state.userBidsError = action.payload
      })
  }
})

export const { 
  clearErrors, 
  setFilters, 
  clearFilters, 
  clearCurrentAuction, 
  clearUserAuctions,
  clearUserBids
} = auctionSlice.actions

export default auctionSlice.reducer

// Selectors
export const selectAuctions = (state) => state.auctions
export const selectMarketplaceAuctions = (state) => state.auctions.marketplaceAuctions
export const selectFeaturedAuctions = (state) => state.auctions.featuredAuctions
export const selectCurrentAuction = (state) => state.auctions.currentAuction
export const selectUserAuctions = (state) => state.auctions.userAuctions
export const selectUserBids = (state) => state.auctions.userBids
export const selectPagination = (state) => state.auctions.pagination
export const selectFilters = (state) => state.auctions.filters
export const selectIsLoading = (state) => state.auctions.isLoading
export const selectIsFeaturedLoading = (state) => state.auctions.isFeaturedLoading
export const selectIsAuctionLoading = (state) => state.auctions.isAuctionLoading
export const selectIsCreating = (state) => state.auctions.isCreating
export const selectIsUpdating = (state) => state.auctions.isUpdating
export const selectIsDeleting = (state) => state.auctions.isDeleting
export const selectIsBidding = (state) => state.auctions.isBidding
export const selectIsAcceptingBid = (state) => state.auctions.isAcceptingBid
export const selectIsUserAuctionsLoading = (state) => state.auctions.isUserAuctionsLoading
export const selectIsUserBidsLoading = (state) => state.auctions.isUserBidsLoading
export const selectError = (state) => state.auctions.error
export const selectFeaturedError = (state) => state.auctions.featuredError
export const selectAuctionError = (state) => state.auctions.auctionError
export const selectCreateError = (state) => state.auctions.createError
export const selectUpdateError = (state) => state.auctions.updateError
export const selectDeleteError = (state) => state.auctions.deleteError
export const selectBidError = (state) => state.auctions.bidError
export const selectAcceptBidError = (state) => state.auctions.acceptBidError
export const selectUserAuctionsError = (state) => state.auctions.userAuctionsError
export const selectUserBidsError = (state) => state.auctions.userBidsError
