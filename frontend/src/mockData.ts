export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime?: Date;
  allDay: boolean;
  assignedTo: {
    id: string;
    name: string;
    avatar: string;
    color: string;
  }[];
  category: 'family' | 'personal' | 'sports' | 'school' | 'other';
  color: string;
}

export const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Football Practice',
    description: 'Weekly practice session',
    location: 'Sports Ground',
    startTime: new Date(2025, 9, 11, 16, 0), // 4:00 PM today
    endTime: new Date(2025, 9, 11, 17, 30),
    allDay: false,
    assignedTo: [
      { id: 'tommy', name: 'Tommy', avatar: 'T', color: '#2dd4bf' }
    ],
    category: 'sports',
    color: '#2dd4bf'
  },
  {
    id: '2',
    title: "Dinner at Nonna's",
    description: 'Family dinner',
    location: '123 Oak Street',
    startTime: new Date(2025, 9, 11, 17, 30), // 5:30 PM today
    endTime: new Date(2025, 9, 11, 19, 30),
    allDay: false,
    assignedTo: [
      { id: 'james', name: 'James', avatar: 'J', color: '#fb7185' },
      { id: 'sarah', name: 'Sarah', avatar: 'S', color: '#fbbf24' },
      { id: 'tommy', name: 'Tommy', avatar: 'T', color: '#2dd4bf' },
      { id: 'ella', name: 'Ella', avatar: 'E', color: '#c084fc' }
    ],
    category: 'family',
    color: '#fb7185'
  },
  {
    id: '3',
    title: 'Movie Night',
    description: 'Family movie night at home',
    location: 'Home',
    startTime: new Date(2025, 9, 11, 19, 0), // 7:00 PM today
    endTime: new Date(2025, 9, 11, 21, 0),
    allDay: false,
    assignedTo: [
      { id: 'james', name: 'James', avatar: 'J', color: '#fb7185' },
      { id: 'sarah', name: 'Sarah', avatar: 'S', color: '#fbbf24' },
      { id: 'tommy', name: 'Tommy', avatar: 'T', color: '#2dd4bf' },
      { id: 'ella', name: 'Ella', avatar: 'E', color: '#c084fc' }
    ],
    category: 'family',
    color: '#2dd4bf'
  },
  {
    id: '4',
    title: 'School Assembly',
    location: 'School Hall',
    startTime: new Date(2025, 9, 12, 9, 0), // Tomorrow 9 AM
    endTime: new Date(2025, 9, 12, 10, 0),
    allDay: false,
    assignedTo: [
      { id: 'tommy', name: 'Tommy', avatar: 'T', color: '#2dd4bf' }
    ],
    category: 'school',
    color: '#fbbf24'
  },
  {
    id: '5',
    title: 'Dentist Appointment',
    location: 'Smile Dental Clinic',
    startTime: new Date(2025, 9, 12, 14, 30), // Tomorrow 2:30 PM
    endTime: new Date(2025, 9, 12, 15, 30),
    allDay: false,
    assignedTo: [
      { id: 'ella', name: 'Ella', avatar: 'E', color: '#c084fc' }
    ],
    category: 'personal',
    color: '#c084fc'
  },
  {
    id: '6',
    title: 'Grocery Shopping',
    location: 'Tesco',
    startTime: new Date(2025, 9, 13, 10, 0), // Day after tomorrow
    endTime: new Date(2025, 9, 13, 11, 30),
    allDay: false,
    assignedTo: [
      { id: 'sarah', name: 'Sarah', avatar: 'S', color: '#fbbf24' }
    ],
    category: 'other',
    color: '#64748b'
  },
  {
    id: '7',
    title: 'Weekend Trip',
    description: 'Visit to the coast',
    location: 'Brighton',
    startTime: new Date(2025, 9, 18, 0, 0), // Next weekend
    endTime: new Date(2025, 9, 19, 23, 59),
    allDay: true,
    assignedTo: [
      { id: 'james', name: 'James', avatar: 'J', color: '#fb7185' },
      { id: 'sarah', name: 'Sarah', avatar: 'S', color: '#fbbf24' },
      { id: 'tommy', name: 'Tommy', avatar: 'T', color: '#2dd4bf' },
      { id: 'ella', name: 'Ella', avatar: 'E', color: '#c084fc' }
    ],
    category: 'family',
    color: '#fb7185'
  }
];

export const mockFamilyMembers = [
  { id: 'james', name: 'James', avatar: 'J', color: '#fb7185', role: 'parent' },
  { id: 'sarah', name: 'Sarah', avatar: 'S', color: '#fbbf24', role: 'parent' },
  { id: 'tommy', name: 'Tommy', avatar: 'T', color: '#2dd4bf', role: 'child' },
  { id: 'ella', name: 'Ella', avatar: 'E', color: '#c084fc', role: 'child' }
];