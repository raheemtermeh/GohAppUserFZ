// Mock API service for MVP
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

class MockApiService {
  private delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  // Mock authentication
  async login(phone: string, code: string): Promise<ApiResponse<any>> {
    await this.delay(1000)
    return {
      success: true,
      data: {
        id: 'customer-1',
        f_name: 'John',
        l_name: 'Doe',
        mobile_number: parseInt(phone),
        username: `user${phone.slice(-4)}`,
        email: `user${phone.slice(-4)}@example.com`,
        balance: 100.0,
        favorites: []
      }
    }
  }

  // Mock social hubs
  async getSocialHubs(): Promise<ApiResponse<any[]>> {
    await this.delay(500)
    return {
      success: true,
      data: [
        {
          id: '1',
          name: 'Gaming Paradise Cafe',
          address: '123 Gaming Street, Tech District',
          latitude: 35.7219,
          longitude: 51.3347,
          owner: { id: 'owner1', name: 'John Gaming' },
          description: 'The ultimate gaming destination with high-end PCs and consoles',
          average_rating: 4.8,
          image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop',
          postal_code: 12345,
          events_count: 15,
          is_favorite: false
        },
        {
          id: '2',
          name: 'Creative Workspace Hub',
          address: '456 Innovation Ave, Creative Quarter',
          latitude: 35.7319,
          longitude: 51.3447,
          owner: { id: 'owner2', name: 'Sarah Creative' },
          description: 'Modern co-working space perfect for workshops and study groups',
          average_rating: 4.6,
          image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop',
          postal_code: 12346,
          events_count: 12,
          is_favorite: true
        },
        {
          id: '3',
          name: 'Music & Arts Center',
          address: '789 Culture Blvd, Arts District',
          latitude: 35.7419,
          longitude: 51.3547,
          owner: { id: 'owner3', name: 'Mike Artist' },
          description: 'Live music venue and art gallery with regular performances',
          average_rating: 4.9,
          image_url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop',
          postal_code: 12347,
          events_count: 8,
          is_favorite: false
        }
      ]
    }
  }

  // Mock events
  async getEvents(): Promise<ApiResponse<any[]>> {
    await this.delay(500)
    return {
      success: true,
      data: [
        // Future Events (after 25 مهر 1404 - October 16, 2025)
        {
          id: '1',
          name: 'Gaming Meetup: Valorant Night',
          description: 'Casual Valorant games with coaching for newcomers. Snacks included.',
          start_time: '2025-10-17T20:00:00Z', // October 17, 2025 (tomorrow)
          end_time: '2025-10-17T23:00:00Z',
          price: 25,
          time: '20:00 - 23:00',
          category: { id: '1', name: 'Gaming', description: 'Video games and esports events' },
          social_hub: {
            id: '1',
            name: 'Gaming Paradise Cafe',
            address: '123 Gaming Street, Tech District',
            image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop'
          },
          average_rating: 4.7,
          date: '2025-10-17',
          capacity: 20,
          event_status: 'upcoming',
          minimum: 2,
          reservations_count: 2,
          ratings_count: 15,
          spots_left: 18
        },
        {
          id: '2',
          name: 'Esports Strategy Workshop',
          description: 'Deep-dive into competitive play theory with local pros.',
          start_time: '2025-10-19T18:30:00Z', // October 19, 2025
          end_time: '2025-10-19T21:30:00Z',
          price: 35,
          time: '18:30 - 21:30',
          category: { id: '6', name: 'Workshop', description: 'Educational workshops and training' },
          social_hub: {
            id: '2',
            name: 'Creative Workspace Hub',
            address: '456 Innovation Ave, Creative Quarter',
            image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop'
          },
          average_rating: 4.9,
          date: '2025-10-19',
          capacity: 15,
          event_status: 'upcoming',
          minimum: 1,
          reservations_count: 5,
          ratings_count: 8,
          spots_left: 10
        },
        {
          id: '3',
          name: 'Indie Music Night',
          description: 'Live indie performances. Chill vibes, coffee specials.',
          start_time: '2025-10-21T19:00:00Z', // October 21, 2025
          end_time: '2025-10-21T22:00:00Z',
          price: 15,
          time: '19:00 - 22:00',
          category: { id: '3', name: 'Music', description: 'Live music and performances' },
          social_hub: {
            id: '3',
            name: 'Music & Arts Center',
            address: '789 Culture Blvd, Arts District',
            image_url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop'
          },
          average_rating: 4.8,
          date: '2025-10-21',
          capacity: 50,
          event_status: 'upcoming',
          minimum: 1,
          reservations_count: 20,
          ratings_count: 25,
          spots_left: 30
        },
        // Past Events (before 24 مهر - October 15, 2025)
        {
          id: '4',
          name: 'Past Gaming Tournament',
          description: 'Previous gaming tournament that has ended.',
          start_time: '2025-10-10T15:00:00Z', // October 10, 2025 (past)
          end_time: '2025-10-10T19:00:00Z',
          price: 30,
          time: '15:00 - 19:00',
          category: { id: '1', name: 'Gaming', description: 'Video games and esports events' },
          social_hub: {
            id: '1',
            name: 'Gaming Paradise Cafe',
            address: '123 Gaming Street, Tech District',
            image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop'
          },
          average_rating: 4.6,
          date: '2025-10-10',
          capacity: 16,
          event_status: 'completed', // Reached minimum seats
          minimum: 8,
          reservations_count: 12,
          ratings_count: 10,
          spots_left: 0
        },
        {
          id: '5',
          name: 'Past Workshop Event',
          description: 'Previous workshop that has ended.',
          start_time: '2025-10-12T18:00:00Z', // October 12, 2025 (past)
          end_time: '2025-10-12T21:00:00Z',
          price: 25,
          time: '18:00 - 21:00',
          category: { id: '6', name: 'Workshop', description: 'Educational workshops and training' },
          social_hub: {
            id: '2',
            name: 'Creative Workspace Hub',
            address: '456 Innovation Ave, Creative Quarter',
            image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop'
          },
          average_rating: 4.3,
          date: '2025-10-12',
          capacity: 12,
          event_status: 'cancelled', // Did not reach minimum seats
          minimum: 6,
          reservations_count: 2,
          ratings_count: 0,
          spots_left: 10
        },
        {
          id: '6',
          name: 'Past Music Concert',
          description: 'Previous music event that has ended.',
          start_time: '2025-10-14T19:00:00Z', // October 14, 2025 (past)
          end_time: '2025-10-14T22:00:00Z',
          price: 20,
          time: '19:00 - 22:00',
          category: { id: '3', name: 'Music', description: 'Live music and performances' },
          social_hub: {
            id: '3',
            name: 'Music & Arts Center',
            address: '789 Culture Blvd, Arts District',
            image_url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop'
          },
          average_rating: 4.7,
          date: '2025-10-14',
          capacity: 30,
          event_status: 'completed', // Reached minimum seats
          minimum: 8,
          reservations_count: 15,
          ratings_count: 12,
          spots_left: 0
        }
      ]
    }
  }

  // Mock reservation
  async createReservation(eventId: string, numberOfPeople: number): Promise<ApiResponse<any>> {
    await this.delay(2000)
    return {
      success: true,
      data: {
        id: `reservation-${Date.now()}`,
        eventId,
        numberOfPeople,
        status: 'confirmed',
        totalPrice: 0 // Will be calculated
      }
    }
  }

  // Mock add to favorites
  async toggleFavorite(socialHubId: string): Promise<ApiResponse<boolean>> {
    await this.delay(500)
    return {
      success: true,
      data: true
    }
  }
}

export const mockApi = new MockApiService()






