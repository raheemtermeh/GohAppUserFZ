import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useStore } from '../state/apiStore'
import Icon from '../components/Icon'
import BackButton from '../components/BackButton'

export default function MVPDemoPage() {
  const { state, dispatch } = useStore()
  const [demoStep, setDemoStep] = useState(0)

  const demoSteps = [
    {
      title: "Welcome to FunZone MVP!",
      description: "This is a demo of the complete FunZone app with mock data",
      icon: "home",
      color: "from-purple-500 to-teal-500"
    },
    {
      title: "Social Hub Discovery",
      description: "Browse venues, add favorites, and discover events",
      icon: "location",
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Event Recommendations",
      description: "Get personalized recommendations based on your favorite venues",
      icon: "star",
      color: "from-yellow-500 to-orange-500"
    },
    {
      title: "Complete Reservation Flow",
      description: "Book events with a smooth multi-step process",
      icon: "calendar",
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "User Profile & Management",
      description: "Manage your profile, reservations, and favorites",
      icon: "user",
      color: "from-pink-500 to-red-500"
    }
  ]

  const quickActions = [
    { label: "Explore Venues", path: "/venues", icon: "location", color: "bg-blue-500" },
    { label: "Browse Events", path: "/", icon: "calendar", color: "bg-green-500" },
    { label: "View Profile", path: "/profile", icon: "user", color: "bg-purple-500" },
    { label: "My Favorites", path: "/profile#favorites", icon: "heart", color: "bg-red-500" },
    { label: "Advanced Filters", path: "/filters", icon: "filter", color: "bg-teal-500" },
    { label: "Categories", path: "/categories", icon: "star", color: "bg-yellow-500" }
  ]

  const features = [
    {
      title: "Social Hub System",
      description: "Discover and favorite venues",
      features: ["Venue browsing", "Favorites system", "Venue details", "Event listings"]
    },
    {
      title: "Smart Recommendations",
      description: "Personalized event suggestions",
      features: ["Based on favorites", "Popular events", "Category filtering", "Location-based"]
    },
    {
      title: "Reservation System",
      description: "Complete booking flow",
      features: ["Multi-step process", "Group size selection", "Price calculation", "Confirmation"]
    },
    {
      title: "User Management",
      description: "Profile and preferences",
      features: ["User profiles", "Reservation history", "Favorite management", "Settings"]
    },
    {
      title: "Social Features",
      description: "Reviews and ratings",
      features: ["Rate events", "Leave reviews", "View ratings", "Social interaction"]
    },
    {
      title: "Advanced Search",
      description: "Powerful filtering options",
      features: ["Category filters", "Price range", "Date filters", "Rating filters"]
    }
  ]

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <div className="hero-gradient p-6 md:p-8 text-center relative">
        <div className="absolute top-4 left-4">
          <BackButton fallbackPath="/" />
        </div>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold text-gradient mb-4">
            FunZone MVP Demo
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-8">
            Complete event reservation app with social hub discovery
          </p>
          
          {/* Demo Steps */}
          <div className="flex justify-center mb-8">
            {demoSteps.map((step, index) => (
              <div key={index} className="flex items-center">
                <button
                  onClick={() => setDemoStep(index)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                    demoStep === index 
                      ? `bg-gradient-to-r ${step.color} text-white shadow-glow` 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <Icon name={step.icon as any} className="w-5 h-5" />
                </button>
                {index < demoSteps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    demoStep > index ? 'bg-gradient-to-r from-purple-500 to-teal-500' : 'bg-slate-700'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Current Step Info */}
          <div className="card p-6 md:p-8 max-w-2xl mx-auto">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${demoSteps[demoStep].color} mx-auto mb-4 grid place-items-center shadow-glow`}>
              <Icon name={demoSteps[demoStep].icon as any} className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{demoSteps[demoStep].title}</h2>
            <p className="text-lg text-slate-300 mb-6">{demoSteps[demoStep].description}</p>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setDemoStep(Math.max(0, demoStep - 1))}
                disabled={demoStep === 0}
                className="btn-ghost disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setDemoStep(Math.min(demoSteps.length - 1, demoStep + 1))}
                disabled={demoStep === demoSteps.length - 1}
                className="btn-primary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Try the Features</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {quickActions.map((action, index) => (
              <NavLink
                key={index}
                to={action.path}
                className="card p-4 text-center hover:scale-105 transition-transform duration-200 group"
              >
                <div className={`w-12 h-12 ${action.color} rounded-full mx-auto mb-3 grid place-items-center shadow-glow`}>
                  <Icon name={action.icon as any} className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium group-hover:text-purple-400 transition-colors">
                  {action.label}
                </span>
              </NavLink>
            ))}
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="card p-6">
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.features.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center gap-2 text-sm text-slate-300">
                      <Icon name="check" className="w-4 h-4 text-green-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Mock Data Info */}
          <div className="card p-6 md:p-8 mt-12 bg-gradient-to-r from-purple-500/10 to-teal-500/10 border-purple-500/20">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">MVP Features</h3>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-400 mb-2">3</div>
                  <div className="text-sm text-slate-400">Social Hubs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-teal-400 mb-2">5</div>
                  <div className="text-sm text-slate-400">Event Categories</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400 mb-2">10</div>
                  <div className="text-sm text-slate-400">Sample Events</div>
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-4">
                This MVP uses mock data to demonstrate all features. Ready for backend integration!
              </p>
            </div>
          </div>

          {/* Login Demo */}
          {!state.auth.user && (
            <div className="text-center mt-8">
              <NavLink to="/login" className="btn-primary text-lg px-8 py-4 hover-scale">
                <Icon name="login" className="w-5 h-5" />
                <span className="ml-2">Try Login Demo</span>
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

