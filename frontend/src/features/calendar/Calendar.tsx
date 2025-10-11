import { useState, useEffect } from 'react';
import CalendarTablet from './CalendarTablet';
import CalendarMobile from './CalendarMobile';
import { mockEvents } from '../../mockData';

export default function Calendar() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile ? (
    <CalendarMobile events={mockEvents} />
  ) : (
    <CalendarTablet events={mockEvents} />
  );
}