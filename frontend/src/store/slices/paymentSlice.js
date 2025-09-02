import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { paymentAPI } from '../../services/api'

// Async thunks
export const createPaymentOrder = createAsyncThunk(
  'payments/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await paymentAPI.createOrder(orderData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create payment order')
    }
  }
)

export const verifyPayment = createAsyncThunk(
  'payments/verifyPayment',
  async (verificationData, { rejectWithValue }) => {
    try {
      const response = await paymentAPI.verifyPayment(verificationData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to verify payment')
    }
  }
)

export const fetchUserPayments = createAsyncThunk(
  'payments/fetchUserPayments',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await paymentAPI.getUserPayments(filters)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user payments')
    }
  }
)

export const fetchPaymentById = createAsyncThunk(
  'payments/fetchPaymentById',
  async (paymentId, { rejectWithValue }) => {
    try {
      const response = await paymentAPI.getPaymentById(paymentId)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payment')
    }
  }
)

export const processRefund = createAsyncThunk(
  'payments/processRefund',
  async (refundData, { rejectWithValue }) => {
    try {
      const response = await paymentAPI.processRefund(refundData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to process refund')
    }
  }
)

const initialState = {
  // Current payment order
  currentOrder: null,
  
  // User payments
  userPayments: [],
  
  // Pagination
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  },
  
  // Filters
  filters: {
    status: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  
  // Loading states
  isCreatingOrder: false,
  isVerifying: false,
  isLoading: false,
  isPaymentLoading: false,
  isRefunding: false,
  
  // Error states
  error: null,
  orderError: null,
  verificationError: null,
  fetchError: null,
  paymentError: null,
  refundError: null,
  
  // Success states
  isOrderCreated: false,
  isPaymentVerified: false,
  isRefundProcessed: false
}

const paymentSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null
      state.orderError = null
      state.verificationError = null
      state.fetchError = null
      state.paymentError = null
      state.refundError = null
    },
    
    clearSuccess: (state) => {
      state.isOrderCreated = false
      state.isPaymentVerified = false
      state.isRefundProcessed = false
    },
    
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    
    clearFilters: (state) => {
      state.filters = {
        status: '',
        startDate: '',
        endDate: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }
    },
    
    clearCurrentOrder: (state) => {
      state.currentOrder = null
    },
    
    clearUserPayments: (state) => {
      state.userPayments = []
    },
    
    resetPaymentState: (state) => {
      state.currentOrder = null
      state.isOrderCreated = false
      state.isPaymentVerified = false
      state.isRefundProcessed = false
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Payment Order
      .addCase(createPaymentOrder.pending, (state) => {
        state.isCreatingOrder = true
        state.orderError = null
        state.isOrderCreated = false
      })
      .addCase(createPaymentOrder.fulfilled, (state, action) => {
        state.isCreatingOrder = false
        state.currentOrder = action.payload
        state.isOrderCreated = true
      })
      .addCase(createPaymentOrder.rejected, (state, action) => {
        state.isCreatingOrder = false
        state.orderError = action.payload
        state.isOrderCreated = false
      })
      
      // Verify Payment
      .addCase(verifyPayment.pending, (state) => {
        state.isVerifying = true
        state.verificationError = null
        state.isPaymentVerified = false
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.isVerifying = false
        state.isPaymentVerified = true
        // Clear current order after successful verification
        state.currentOrder = null
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.isVerifying = false
        state.verificationError = action.payload
        state.isPaymentVerified = false
      })
      
      // Fetch User Payments
      .addCase(fetchUserPayments.pending, (state) => {
        state.isLoading = true
        state.fetchError = null
      })
      .addCase(fetchUserPayments.fulfilled, (state, action) => {
        state.isLoading = false
        state.userPayments = action.payload.payments
        state.pagination = action.payload.pagination
      })
      .addCase(fetchUserPayments.rejected, (state, action) => {
        state.isLoading = false
        state.fetchError = action.payload
      })
      
      // Fetch Payment by ID
      .addCase(fetchPaymentById.pending, (state) => {
        state.isPaymentLoading = true
        state.paymentError = null
      })
      .addCase(fetchPaymentById.fulfilled, (state, action) => {
        state.isPaymentLoading = false
        // Update payment in userPayments if exists
        const paymentIndex = state.userPayments.findIndex(payment => payment._id === action.payload._id)
        if (paymentIndex !== -1) {
          state.userPayments[paymentIndex] = action.payload
        }
      })
      .addCase(fetchPaymentById.rejected, (state, action) => {
        state.isPaymentLoading = false
        state.paymentError = action.payload
      })
      
      // Process Refund
      .addCase(processRefund.pending, (state) => {
        state.isRefunding = true
        state.refundError = null
        state.isRefundProcessed = false
      })
      .addCase(processRefund.fulfilled, (state, action) => {
        state.isRefunding = false
        state.isRefundProcessed = true
        // Update payment status in userPayments if exists
        const paymentIndex = state.userPayments.findIndex(payment => payment._id === action.payload.paymentId)
        if (paymentIndex !== -1) {
          state.userPayments[paymentIndex].status = 'refunded'
          state.userPayments[paymentIndex].refundAmount = action.payload.amount
          state.userPayments[paymentIndex].refundReason = action.payload.reason
          state.userPayments[paymentIndex].refundedAt = new Date().toISOString()
        }
      })
      .addCase(processRefund.rejected, (state, action) => {
        state.isRefunding = false
        state.refundError = action.payload
        state.isRefundProcessed = false
      })
  }
})

export const { 
  clearErrors, 
  clearSuccess,
  setFilters, 
  clearFilters, 
  clearCurrentOrder, 
  clearUserPayments,
  resetPaymentState
} = paymentSlice.actions

export default paymentSlice.reducer

// Selectors
export const selectPayments = (state) => state.payments
export const selectCurrentOrder = (state) => state.payments.currentOrder
export const selectUserPayments = (state) => state.payments.userPayments
export const selectPagination = (state) => state.payments.pagination
export const selectFilters = (state) => state.payments.filters
export const selectIsCreatingOrder = (state) => state.payments.isCreatingOrder
export const selectIsVerifying = (state) => state.payments.isVerifying
export const selectIsLoading = (state) => state.payments.isLoading
export const selectIsPaymentLoading = (state) => state.payments.isPaymentLoading
export const selectIsRefunding = (state) => state.payments.isRefunding
export const selectError = (state) => state.payments.error
export const selectOrderError = (state) => state.payments.orderError
export const selectVerificationError = (state) => state.payments.verificationError
export const selectFetchError = (state) => state.payments.fetchError
export const selectPaymentError = (state) => state.payments.paymentError
export const selectRefundError = (state) => state.payments.refundError
export const selectIsOrderCreated = (state) => state.payments.isOrderCreated
export const selectIsPaymentVerified = (state) => state.payments.isPaymentVerified
export const selectIsRefundProcessed = (state) => state.payments.isRefundProcessed
