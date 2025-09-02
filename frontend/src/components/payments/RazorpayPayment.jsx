import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { 
  createPaymentOrder, 
  verifyPayment,
  selectCurrentOrder,
  selectIsCreatingOrder,
  selectIsVerifying,
  selectOrderError,
  selectVerificationError,
  clearErrors,
  clearSuccess
} from '../../store/slices/paymentSlice'
import { selectIsAuthenticated } from '../../store/slices/authSlice'
import { 
  CreditCard, 
  Smartphone, 
  Wallet, 
  Bank, 
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react'

const RazorpayPayment = ({ app, amount, onSuccess, onCancel }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const currentOrder = useSelector(selectCurrentOrder)
  const isCreatingOrder = useSelector(selectIsCreatingOrder)
  const isVerifying = useSelector(selectIsVerifying)
  const orderError = useSelector(selectOrderError)
  const verificationError = useSelector(selectVerificationError)
  
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // Clear any previous errors or success states
    dispatch(clearErrors())
    dispatch(clearSuccess())
  }, [dispatch])

  useEffect(() => {
    if (orderError) {
      toast.error(orderError)
      dispatch(clearErrors())
    }
    if (verificationError) {
      toast.error(verificationError)
      dispatch(clearErrors())
    }
  }, [orderError, verificationError, dispatch])

  const handlePayment = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to continue with payment')
      navigate('/login')
      return
    }

    try {
      setIsProcessing(true)
      
      // Create payment order
      const orderData = {
        appId: app._id,
        amount: amount
      }
      
      await dispatch(createPaymentOrder(orderData)).unwrap()
      
      // Initialize Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: currentOrder.amount,
        currency: currentOrder.currency,
        name: 'AppBazaar',
        description: `Purchase of ${app.title}`,
        order_id: currentOrder.orderId,
        handler: async function (response) {
          try {
            // Verify payment
            const verificationData = {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            }
            
            await dispatch(verifyPayment(verificationData)).unwrap()
            
            toast.success('Payment successful! App added to your purchases.')
            onSuccess && onSuccess()
            
          } catch (error) {
            console.error('Payment verification failed:', error)
            toast.error('Payment verification failed. Please contact support.')
          }
        },
        prefill: {
          name: 'User Name',
          email: 'user@example.com',
          contact: '9999999999'
        },
        notes: {
          address: 'AppBazaar Office'
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false)
            onCancel && onCancel()
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
      
    } catch (error) {
      console.error('Payment initiation failed:', error)
      toast.error('Failed to initiate payment. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: <CreditCard className="w-5 h-5" />,
      description: 'Pay with Visa, MasterCard, or any other card'
    },
    {
      id: 'upi',
      name: 'UPI',
      icon: <Smartphone className="w-5 h-5" />,
      description: 'Pay using UPI apps like Google Pay, PhonePe'
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: <Bank className="w-5 h-5" />,
      description: 'Pay using your bank account'
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      icon: <Wallet className="w-5 h-5" />,
      description: 'Pay using digital wallets'
    }
  ]

  if (!app) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No app selected for payment</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      {/* App Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center space-x-4 mb-4">
          {app.icon ? (
            <img 
              src={app.icon} 
              alt={app.title} 
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {app.title.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {app.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {app.category}
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Price:</span>
            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              ₹{amount}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Select Payment Method
        </h3>
        
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <label
              key={method.id}
              className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                paymentMethod === method.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={paymentMethod === method.id}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="text-primary-600 focus:ring-primary-500"
              />
              <div className="flex items-center space-x-3">
                <div className="text-primary-600 dark:text-primary-400">
                  {method.icon}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {method.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {method.description}
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Payment Button */}
      <div className="space-y-4">
        <button
          onClick={handlePayment}
          disabled={isCreatingOrder || isProcessing}
          className="w-full btn btn-primary btn-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreatingOrder || isProcessing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Pay ₹{amount}</span>
            </>
          )}
        </button>
        
        <button
          onClick={onCancel}
          className="w-full btn btn-outline"
        >
          Cancel
        </button>
      </div>

      {/* Security Notice */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Your payment is secured by Razorpay. We never store your payment details.
        </p>
      </div>
    </div>
  )
}

export default RazorpayPayment
