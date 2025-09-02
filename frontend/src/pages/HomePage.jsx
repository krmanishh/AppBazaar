import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchFeaturedApps } from '../store/slices/appSlice'
import { selectFeaturedApps, selectIsFeaturedLoading, selectFeaturedError } from '../store/slices/appSlice'
import { selectIsAuthenticated } from '../store/slices/authSlice'
import { 
  ArrowRight, 
  Search, 
  Star, 
  Download, 
  Smartphone, 
  Zap, 
  Shield,
  Users,
  Globe
} from 'lucide-react'
import AppCard from '../components/apps/AppCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const HomePage = () => {
  const dispatch = useDispatch()
  const featuredApps = useSelector(selectFeaturedApps)
  const isFeaturedLoading = useSelector(selectIsFeaturedLoading)
  const featuredError = useSelector(selectFeaturedError)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  useEffect(() => {
    dispatch(fetchFeaturedApps())
  }, [dispatch])

  const features = [
    {
      icon: <Search className="w-6 h-6" />,
      title: 'Discover Apps',
      description: 'Find the perfect apps for your needs with our advanced search and filtering system.'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure & Trusted',
      description: 'All apps are thoroughly reviewed and verified for security and quality.'
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: 'Easy Download',
      description: 'One-click downloads with automatic updates and installation guides.'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Community Driven',
      description: 'Join our community of developers and users to share feedback and ideas.'
    }
  ]

  const stats = [
    { label: 'Apps Available', value: '10,000+', icon: <Smartphone className="w-5 h-5" /> },
    { label: 'Active Users', value: '500K+', icon: <Users className="w-5 h-5" /> },
    { label: 'Downloads', value: '2M+', icon: <Download className="w-5 h-5" /> },
    { label: 'Countries', value: '150+', icon: <Globe className="w-5 h-5" /> }
  ]

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-20 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900 dark:to-primary-800 rounded-3xl">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Your Ultimate
            <span className="text-gradient block">App Marketplace</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Discover, download, and manage the best mobile applications in one place. 
            From productivity tools to entertainment apps, find everything you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/marketplace"
              className="btn btn-primary btn-lg flex items-center justify-center space-x-2"
            >
              <span>Explore Apps</span>
              <ArrowRight size={20} />
            </Link>
            {!isAuthenticated && (
              <Link
                to="/register"
                className="btn btn-outline btn-lg"
              >
                Join Now
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-xl mx-auto mb-4">
                <div className="text-primary-600 dark:text-primary-400">
                  {stat.icon}
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Why Choose AppBazaar?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            We provide the best experience for discovering and managing mobile applications
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-6">
              <div className="flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-2xl mx-auto mb-6">
                <div className="text-primary-600 dark:text-primary-400">
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Apps Section */}
      <section className="py-16">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Featured Apps
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Handpicked applications that stand out from the crowd
            </p>
          </div>
          <Link
            to="/marketplace"
            className="btn btn-outline flex items-center space-x-2"
          >
            <span>View All</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {isFeaturedLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : featuredError ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Failed to load featured apps. Please try again later.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredApps.slice(0, 6).map((app) => (
              <AppCard key={app._id} app={app} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-secondary-50 to-gray-50 dark:from-secondary-900 dark:to-gray-800 rounded-3xl text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of users who are already discovering amazing apps on AppBazaar
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/marketplace"
              className="btn btn-primary btn-lg flex items-center justify-center space-x-2"
            >
              <span>Browse Apps</span>
              <ArrowRight size={20} />
            </Link>
            {!isAuthenticated && (
              <Link
                to="/register"
                className="btn btn-outline btn-lg"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
