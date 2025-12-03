# FunZone APP - MVP Demo

A complete event reservation app with social hub discovery, built with React + TypeScript + Tailwind CSS.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The app will be available at `http://localhost:5174`

## 🎯 MVP Features

### ✅ Complete Features
- **Social Hub Discovery**: Browse venues, add favorites, view details
- **Event Recommendations**: Personalized suggestions based on favorite venues
- **Complete Reservation Flow**: Multi-step booking with confirmation
- **User Profile Management**: Profile, reservations, favorites
- **Social Features**: Rate and review events and venues
- **Advanced Search & Filtering**: Multiple filter options
- **Responsive Design**: Mobile-first, works on all devices

### 📱 Pages & Navigation
- **Home** (`/`): Event discovery with recommendations
- **Venues** (`/venues`): Social hub browsing and management
- **Favorites** (`/favorites`): Saved venues and events
- **Cart** (`/cart`): Reservation management
- **Profile** (`/profile`): User profile and settings
- **Login** (`/login`): Authentication demo
- **Demo** (`/demo`): MVP showcase page

## 🎨 Design System

- **Dark Theme**: Purple/teal gradients with glass morphism
- **Responsive**: Mobile-first design with Tailwind CSS
- **Animations**: Smooth transitions and hover effects
- **Icons**: Custom SVG icon system
- **Typography**: Responsive text scaling

## 🏗️ Architecture

### State Management
- React Context + useReducer
- Type-safe TypeScript
- Custom hooks for filtered data
- Optimized re-renders

### Components
- Reusable UI components
- Page-level components
- Responsive design patterns
- Consistent styling

### Data Flow
- Mock data matching Django backend structure
- Real-time filtering and search
- State persistence for user preferences
- Optimistic updates for better UX

## 🔧 Mock Data

The MVP includes comprehensive mock data:

### Social Hubs (3)
- Gaming Paradise Cafe
- Creative Workspace Hub  
- Music & Arts Center

### Event Categories (10)
- Gaming, Tournament, Music, Study, Cowork, Workshop, Sports, Entertainment, Food, Education

### Sample Events (5)
- Gaming Meetup: Valorant Night
- Esports Strategy Workshop
- Indie Music Night
- Study Group: Advanced Programming
- Networking Mixer

## 🎮 Demo Flow

1. **Start at Demo Page** (`/demo`): Overview of all features
2. **Try Login** (`/login`): Phone authentication demo
3. **Explore Venues** (`/venues`): Browse and favorite venues
4. **Discover Events** (`/`): See personalized recommendations
5. **Make Reservation** (`/event/1`): Complete booking flow
6. **Manage Profile** (`/profile`): View reservations and favorites

## 🔌 Backend Integration Ready

The frontend is built to easily integrate with your Django backend:

- **API Service Layer**: Ready for real API calls
- **Data Models**: Match Django model structure
- **Authentication**: Compatible with Django auth
- **State Management**: Can be connected to real data

## 📱 Responsive Design

- **Mobile**: 320px - 640px (primary focus)
- **Tablet**: 641px - 1024px
- **Desktop**: 1025px+

## 🎯 Key Features Demo

### Social Hub Discovery
- Browse venues with search and filtering
- Add/remove favorites with heart icon
- View detailed venue information
- See events hosted at each venue

### Event Recommendations
- Personalized suggestions based on favorite venues
- Popular events fallback
- Category-based filtering
- Location-based suggestions

### Reservation System
- Multi-step booking process
- Group size selection with constraints
- Price calculation and confirmation
- Success confirmation with details

### User Management
- Comprehensive profile with statistics
- Reservation history with status tracking
- Favorite venues management
- Profile information display

## 🚀 Next Steps

1. **Run the MVP**: `npm run dev`
2. **Explore Features**: Navigate through all pages
3. **Test Responsiveness**: Try on different screen sizes
4. **Backend Integration**: Connect to Django API
5. **Deploy**: Build and deploy to production

## 📞 Support

This MVP demonstrates a complete, production-ready frontend that can be immediately integrated with your Django backend. All components are built with real-world usage in mind and follow modern React best practices.

---

**Ready to explore?** Start the dev server and visit `http://localhost:5174/demo` for the full MVP experience!






