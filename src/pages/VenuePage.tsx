import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { formatPersianNumber } from '../utils/persianNumbers'

interface Venue {
  id: string
  name: string
  image: string
  rating: number
  location: string
  category: string
  description: string
  events: Event[]
}

interface Event {
  id: string
  title: string
  date: string
  time: string
  price: string
  image: string
  category: string
  attendees: number
  maxAttendees: number
}

export default function VenuePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const navigate = useNavigate()

  const venues: Venue[] = [
    // Cafe Venues
    {
      id: '1',
      name: 'The Grand Cafe',
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop',
      rating: 4.8,
      location: 'Downtown District',
      category: 'Cafe',
      description: 'Elegant cafe with premium coffee and cozy atmosphere',
      events: [
        {
          id: '1',
          title: 'Coffee Tasting Workshop',
          date: '2024-01-15',
          time: '14:00',
          price: '$25',
          image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=200&fit=crop',
          category: 'Workshop',
          attendees: 12,
          maxAttendees: 20
        },
        {
          id: '2',
          title: 'Live Jazz Night',
          date: '2024-01-20',
          time: '19:00',
          price: '$15',
          image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop',
          category: 'Music',
          attendees: 45,
          maxAttendees: 60
        }
      ]
    },
    {
      id: '2',
      name: 'Brew & Bean',
      image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop',
      rating: 4.6,
      location: 'Westside Quarter',
      category: 'Cafe',
      description: 'Artisanal coffee shop with specialty brews and pastries',
      events: [
        {
          id: '3',
          title: 'Latte Art Class',
          date: '2024-01-18',
          time: '16:00',
          price: '$30',
          image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&h=200&fit=crop',
          category: 'Workshop',
          attendees: 8,
          maxAttendees: 15
        }
      ]
    },
    {
      id: '3',
      name: 'Urban Tea House',
      image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop',
      rating: 4.7,
      location: 'Tea District',
      category: 'Cafe',
      description: 'Traditional tea ceremonies and modern tea culture',
      events: [
        {
          id: '4',
          title: 'Tea Ceremony Workshop',
          date: '2024-01-22',
          time: '15:00',
          price: '$40',
          image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&h=200&fit=crop',
          category: 'Cultural',
          attendees: 6,
          maxAttendees: 10
        }
      ]
    },

    // Gaming Venues
    {
      id: '4',
      name: 'GameZone Arena',
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop',
      rating: 4.6,
      location: 'Gaming District',
      category: 'Gaming',
      description: 'Ultimate gaming destination with latest consoles and VR experiences',
      events: [
        {
          id: '5',
          title: 'Mafia Game Night',
          date: '2024-01-18',
          time: '18:00',
          price: '$20',
          image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=200&fit=crop',
          category: 'Social',
          attendees: 8,
          maxAttendees: 12
        },
        {
          id: '6',
          title: 'Board Game Tournament',
          date: '2024-01-25',
          time: '15:00',
          price: '$30',
          image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=300&h=200&fit=crop',
          category: 'Competition',
          attendees: 24,
          maxAttendees: 32
        }
      ]
    },
    {
      id: '5',
      name: 'Pixel Paradise',
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
      rating: 4.5,
      location: 'Tech Valley',
      category: 'Gaming',
      description: 'PC gaming center with high-end rigs and esports events',
      events: [
        {
          id: '7',
          title: 'CS:GO Tournament',
          date: '2024-01-19',
          time: '14:00',
          price: '$25',
          image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=200&fit=crop',
          category: 'Esports',
          attendees: 32,
          maxAttendees: 64
        }
      ]
    },
    {
      id: '6',
      name: 'Retro Arcade',
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop',
      rating: 4.4,
      location: 'Nostalgia Lane',
      category: 'Gaming',
      description: 'Classic arcade games and pinball machines',
      events: [
        {
          id: '8',
          title: 'Pinball Championship',
          date: '2024-01-21',
          time: '17:00',
          price: '$15',
          image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=200&fit=crop',
          category: 'Competition',
          attendees: 16,
          maxAttendees: 24
        }
      ]
    },

    // Cinema Venues
    {
      id: '7',
      name: 'Cinema Paradiso',
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop',
      rating: 4.7,
      location: 'Entertainment Quarter',
      category: 'Cinema',
      description: 'Premium movie theater with luxury seating and gourmet snacks',
      events: [
        {
          id: '9',
          title: 'Classic Movie Marathon',
          date: '2024-01-22',
          time: '13:00',
          price: '$35',
          image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=200&fit=crop',
          category: 'Entertainment',
          attendees: 78,
          maxAttendees: 120
        },
        {
          id: '10',
          title: 'Horror Movie Night',
          date: '2024-01-28',
          time: '20:00',
          price: '$18',
          image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop',
          category: 'Entertainment',
          attendees: 65,
          maxAttendees: 100
        }
      ]
    },
    {
      id: '8',
      name: 'Drive-In Dreams',
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop',
      rating: 4.3,
      location: 'Outskirts',
      category: 'Cinema',
      description: 'Classic drive-in theater experience under the stars',
      events: [
        {
          id: '11',
          title: '80s Movie Night',
          date: '2024-01-23',
          time: '19:30',
          price: '$20',
          image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=200&fit=crop',
          category: 'Entertainment',
          attendees: 45,
          maxAttendees: 80
        }
      ]
    },

    // Sports Venues
    {
      id: '9',
      name: 'Sports Central',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
      rating: 4.5,
      location: 'Sports Complex',
      category: 'Sports',
      description: 'Multi-sport facility with indoor and outdoor courts',
      events: [
        {
          id: '12',
          title: 'Championship Match Viewing',
          date: '2024-01-19',
          time: '16:00',
          price: '$12',
          image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop',
          category: 'Sports',
          attendees: 120,
          maxAttendees: 150
        },
        {
          id: '13',
          title: 'Fitness Bootcamp',
          date: '2024-01-26',
          time: '07:00',
          price: '$25',
          image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop',
          category: 'Fitness',
          attendees: 18,
          maxAttendees: 25
        }
      ]
    },
    {
      id: '10',
      name: 'Rock Climbing Hub',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
      rating: 4.6,
      location: 'Adventure Zone',
      category: 'Sports',
      description: 'Indoor climbing walls and outdoor adventure courses',
      events: [
        {
          id: '14',
          title: 'Beginner Climbing Class',
          date: '2024-01-20',
          time: '10:00',
          price: '$35',
          image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop',
          category: 'Fitness',
          attendees: 12,
          maxAttendees: 16
        }
      ]
    },

    // Book Venues
    {
      id: '11',
      name: 'Bookworm Haven',
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
      rating: 4.9,
      location: 'Literary District',
      category: 'Books',
      description: 'Cozy bookstore with reading nooks and author events',
      events: [
        {
          id: '15',
          title: 'Book Club Meeting',
          date: '2024-01-17',
          time: '19:00',
          price: 'Free',
          image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=200&fit=crop',
          category: 'Education',
          attendees: 15,
          maxAttendees: 20
        },
        {
          id: '16',
          title: 'Author Reading Session',
          date: '2024-01-24',
          time: '18:00',
          price: '$10',
          image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop',
          category: 'Education',
          attendees: 32,
          maxAttendees: 40
        }
      ]
    },
    {
      id: '12',
      name: 'Poetry Corner',
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
      rating: 4.4,
      location: 'Arts Quarter',
      category: 'Books',
      description: 'Intimate space for poetry readings and literary discussions',
      events: [
        {
          id: '17',
          title: 'Open Mic Poetry Night',
          date: '2024-01-25',
          time: '20:00',
          price: '$8',
          image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=200&fit=crop',
          category: 'Cultural',
          attendees: 28,
          maxAttendees: 35
        }
      ]
    },

    // Music Venues
    {
      id: '13',
      name: 'Jazz Junction',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
      rating: 4.7,
      location: 'Music Row',
      category: 'Music',
      description: 'Intimate jazz club with live performances and jam sessions',
      events: [
        {
          id: '18',
          title: 'Jazz Jam Session',
          date: '2024-01-26',
          time: '21:00',
          price: '$18',
          image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop',
          category: 'Music',
          attendees: 35,
          maxAttendees: 50
        }
      ]
    },
    {
      id: '14',
      name: 'Rock Arena',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
      rating: 4.5,
      location: 'Entertainment District',
      category: 'Music',
      description: 'Large venue for rock concerts and music festivals',
      events: [
        {
          id: '19',
          title: 'Rock Battle of the Bands',
          date: '2024-01-27',
          time: '19:00',
          price: '$25',
          image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop',
          category: 'Music',
          attendees: 180,
          maxAttendees: 300
        }
      ]
    },

    // Art Venues
    {
      id: '15',
      name: 'Creative Canvas',
      image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
      rating: 4.6,
      location: 'Arts District',
      category: 'Art',
      description: 'Art studio offering painting, drawing, and sculpture classes',
      events: [
        {
          id: '20',
          title: 'Watercolor Workshop',
          date: '2024-01-28',
          time: '14:00',
          price: '$45',
          image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=200&fit=crop',
          category: 'Workshop',
          attendees: 10,
          maxAttendees: 15
        }
      ]
    }
  ]

  const categories = ['all', ...Array.from(new Set(venues.map(venue => venue.category)))]

  const filteredVenues = selectedCategory === 'all' 
    ? venues 
    : venues.filter(venue => venue.category === selectedCategory)

  const handleVenueClick = (venueId: string) => {
    navigate(`/venue/${venueId}`)
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">Venues</h1>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`chip whitespace-nowrap capitalize flex-shrink-0 ${
              selectedCategory === category ? 'chip-active' : ''
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Venues Grid - Improved Responsiveness */}
      <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredVenues.map(venue => (
          <div 
            key={venue.id} 
            className="card p-3 sm:p-4 md:p-6 cursor-pointer hover:scale-105 transition-transform duration-200 hover:shadow-xl"
            onClick={() => handleVenueClick(venue.id)}
          >
            {/* Venue Image */}
            <div className="relative mb-4">
              <img 
                src={venue.image} 
                alt={venue.name}
                className="w-full h-32 sm:h-40 md:h-48 object-cover rounded-lg"
              />
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 px-2 py-1 rounded-full text-xs">
                <Icon name="star" className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="text-white">{formatPersianNumber(venue.rating, 1)}</span>
              </div>
            </div>

            {/* Venue Info */}
            <div className="space-y-3">
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold line-clamp-2">{venue.name}</h2>
                <div className="flex items-center gap-1 text-slate-400 text-sm mt-1">
                  <Icon name="location" className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="line-clamp-1">{venue.location}</span>
                </div>
                <div className="mt-2">
                  <span className="chip text-xs">{venue.category}</span>
                </div>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm md:text-base line-clamp-3">{venue.description}</p>
              
              {/* Events Preview */}
              <div className="pt-2 border-t border-slate-700/50">
                <p className="text-xs sm:text-sm text-slate-400 mb-2">
                  {venue.events.length} upcoming event{venue.events.length !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {venue.events.slice(0, 2).map(event => (
                    <div key={event.id} className="flex-shrink-0 bg-slate-800/60 rounded-lg p-2 min-w-[120px]">
                      <p className="text-xs font-medium line-clamp-1">{event.title}</p>
                      <p className="text-xs text-slate-400">{event.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-center pt-4">
        <NavLink to="/" className="btn-primary">
          <Icon name="home" className="w-4 h-4" />
          Back to Home
        </NavLink>
      </div>
    </div>
  )
}
