/**
 * Weather Widget Component
 * Location: frontend/src/components/WeatherWidget.tsx
 *
 * Fetches real weather data from Open-Meteo API (free, no API key required)
 * Uses Bradford, UK coordinates by default
 */

import { useState, useEffect } from 'react';

// Weather code to icon and description mapping
// Based on WMO Weather interpretation codes
const weatherCodeMap: { [key: number]: { icon: string; desc: string } } = {
  0: { icon: '☀️', desc: 'Clear' },
  1: { icon: '🌤️', desc: 'Mainly Clear' },
  2: { icon: '⛅', desc: 'Partly Cloudy' },
  3: { icon: '☁️', desc: 'Overcast' },
  45: { icon: '🌫️', desc: 'Foggy' },
  48: { icon: '🌫️', desc: 'Icy Fog' },
  51: { icon: '🌧️', desc: 'Light Drizzle' },
  53: { icon: '🌧️', desc: 'Drizzle' },
  55: { icon: '🌧️', desc: 'Heavy Drizzle' },
  56: { icon: '🌨️', desc: 'Freezing Drizzle' },
  57: { icon: '🌨️', desc: 'Heavy Freezing Drizzle' },
  61: { icon: '🌧️', desc: 'Light Rain' },
  63: { icon: '🌧️', desc: 'Rain' },
  65: { icon: '🌧️', desc: 'Heavy Rain' },
  66: { icon: '🌨️', desc: 'Freezing Rain' },
  67: { icon: '🌨️', desc: 'Heavy Freezing Rain' },
  71: { icon: '🌨️', desc: 'Light Snow' },
  73: { icon: '🌨️', desc: 'Snow' },
  75: { icon: '❄️', desc: 'Heavy Snow' },
  77: { icon: '🌨️', desc: 'Snow Grains' },
  80: { icon: '🌦️', desc: 'Light Showers' },
  81: { icon: '🌦️', desc: 'Showers' },
  82: { icon: '⛈️', desc: 'Heavy Showers' },
  85: { icon: '🌨️', desc: 'Light Snow Showers' },
  86: { icon: '🌨️', desc: 'Snow Showers' },
  95: { icon: '⛈️', desc: 'Thunderstorm' },
  96: { icon: '⛈️', desc: 'Thunderstorm + Hail' },
  99: { icon: '⛈️', desc: 'Thunderstorm + Heavy Hail' },
};

interface WeatherData {
  temperature: number;
  weatherCode: number;
  icon: string;
  description: string;
}

interface WeatherWidgetProps {
  variant?: 'compact' | 'full';
  className?: string;
}

// Bradford, UK coordinates
const LATITUDE = 53.7996;
const LONGITUDE = -1.5477;

export default function WeatherWidget({ variant = 'full', className = '' }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(false);

        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=temperature_2m,weather_code&timezone=Europe%2FLondon`
        );

        if (!response.ok) {
          throw new Error('Weather fetch failed');
        }

        const data = await response.json();
        const weatherCode = data.current.weather_code;
        const weatherInfo = weatherCodeMap[weatherCode] || { icon: '🌡️', desc: 'Unknown' };

        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          weatherCode,
          icon: weatherInfo.icon,
          description: weatherInfo.desc,
        });
      } catch (err) {
        console.error('Failed to fetch weather:', err);
        setError(true);
        // Fallback to default values on error
        setWeather({
          temperature: 12,
          weatherCode: 0,
          icon: '☀️',
          description: 'Sunny',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();

    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !weather) {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: variant === 'compact' ? 24 : 32 }}>🌡️</span>
        <div>
          <div style={{ fontSize: variant === 'compact' ? 20 : 24, fontWeight: 600 }}>--°C</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 24 }}>{weather.icon}</span>
        <span style={{ fontSize: 18, fontWeight: 600 }}>{weather.temperature}°C</span>
      </div>
    );
  }

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 32 }}>{weather.icon}</span>
      <div>
        <div style={{ fontSize: 24, fontWeight: 600 }}>{weather.temperature}°C</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>{weather.description}</div>
      </div>
    </div>
  );
}
