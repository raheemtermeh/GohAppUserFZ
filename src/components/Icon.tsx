type Props = { 
  name: 'calendar' | 'filter' | 'user' | 'home' | 'login' | 'star' | 'search' | 'ticket' | 'chevron-right' | 'chevron-left' | 'price' | 'clock' | 'map' | 'phone' | 'heart' | 'cart' | 'edit' | 'location' | 'fire' | 'trending' | 'advertisement' | 'close' | 'check' | 'arrow-right' | 'arrow-left' | 'minus' | 'plus' | 'coffee' | 'warning' | 'list' | 'grid' | 'play' | 'globe' | 'settings'; 
  className?: string 
}

export default function Icon({ name, className = 'w-5 h-5' }: Props) {
  const common = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as any
  switch (name) {
    case 'home':
      return (<svg {...common}><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>)
    case 'calendar':
      return (<svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>)
    case 'filter':
      return (<svg {...common}><path d="M3 5h18M6 12h12M10 19h4"/></svg>)
    case 'user':
      return (<svg {...common}><path d="M20 21a8 8 0 1 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>)
    case 'login':
      return (<svg {...common}><path d="M15 3h6v18h-6"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>)
    case 'star':
      return (<svg {...common}><path d="m12 3 2.9 5.9 6.5.9-4.7 4.5 1.1 6.4L12 17.8 6.2 20.7l1.1-6.4L2.6 9.8l6.5-.9z"/></svg>)
    case 'search':
      return (<svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>)
    case 'ticket':
      return (<svg {...common}><path d="M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v2a2 2 0 0 0-2 2 2 2 0 0 0 2 2v2a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2a2 2 0 0 0 2-2 2 2 0 0 0-2-2z"/></svg>)
    case 'chevron-right':
      return (<svg {...common}><path d="m9 18 6-6-6-6"/></svg>)
    case 'chevron-left':
      return (<svg {...common}><path d="m15 18-6-6 6-6"/></svg>)
    case 'price':
      return (<svg {...common}><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6"/></svg>)
    case 'clock':
      return (<svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg>)
    case 'map':
      return (<svg {...common}><path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2z"/><path d="M9 3v16M15 5v16"/></svg>)
    case 'phone':
      return (<svg {...common}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>)
    case 'heart':
      return (<svg {...common}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>)
    case 'cart':
      return (<svg {...common}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>)
    case 'edit':
      return (<svg {...common}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>)
    case 'location':
      return (<svg {...common}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>)
    case 'fire':
      return (<svg {...common}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1.5-2.5"/><path d="M14.5 9.5c1.38 0 2.5.84 2.5 2.5 0 1.38-.84 2.5-2.5 2.5"/><path d="M12 2c-1.5 0-3.5 1.5-3.5 4.5 0 2.5 1.5 3.5 3.5 3.5s3.5-1 3.5-3.5C16.5 3.5 14.5 2 12 2z"/></svg>)
    case 'trending':
      return (<svg {...common}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>)
    case 'advertisement':
      return (<svg {...common}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M13 8H7.5"/><path d="M17 12H7.5"/></svg>)
    case 'close':
      return (<svg {...common}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>)
    case 'check':
      return (<svg {...common}><path d="M20 6 9 17l-5-5"/></svg>)
    case 'arrow-right':
      return (<svg {...common}><path d="M8 5l7 7-7 7"/></svg>)
    case 'arrow-left':
      return (<svg {...common}><path d="M16 5L9 12l7 7"/></svg>)
    case 'minus':
      return (<svg {...common}><path d="M5 12h14"/></svg>)
    case 'plus':
      return (<svg {...common}><path d="M12 5v14"/><path d="M5 12h14"/></svg>)
    case 'coffee':
      return (<svg {...common}><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><path d="M6 1v3"/><path d="M10 1v3"/><path d="M14 1v3"/></svg>)
    case 'warning':
      return (<svg {...common}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>)
    case 'list':
      return (<svg {...common}><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></svg>)
    case 'grid':
      return (<svg {...common}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>)
    case 'play':
      return (<svg {...common}><polygon points="5,3 19,12 5,21"/></svg>)
    case 'globe':
      return (<svg {...common}><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>)
    case 'settings':
      return (<svg {...common}><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/></svg>)
  }
}
