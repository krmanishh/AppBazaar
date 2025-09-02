import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import appReducer from './slices/appSlice'
import uiReducer from './slices/uiSlice'
import auctionReducer from './slices/auctionSlice'
import paymentReducer from './slices/paymentSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    apps: appReducer,
    ui: uiReducer,
    auctions: auctionReducer,
    payments: paymentReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})
