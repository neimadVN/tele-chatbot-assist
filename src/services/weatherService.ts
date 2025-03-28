import axios from 'axios';
import { WeatherParams, WeatherResponse, WeatherApiSource } from '../types';
import dotenv from 'dotenv';

dotenv.config();

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const OPENWEATHERMAP_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const OPEN_METEO_API_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Get weather data from Open-Meteo API
 */
async function getOpenMeteoWeather(params: WeatherParams): Promise<WeatherResponse> {
  try {
    // First, we need to get coordinates for the location using geocoding API
    const geocodingResponse = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
      params: {
        name: params.location,
        count: 1,
        language: 'en',
        format: 'json'
      }
    });

    if (!geocodingResponse.data.results || geocodingResponse.data.results.length === 0) {
      throw new Error(`Location not found: ${params.location}`);
    }

    const locationData = geocodingResponse.data.results[0];
    const { latitude, longitude, name } = locationData;

    const date = params.date || new Date().toISOString().split('T')[0];

    // Now get the weather data using the coordinates
    const weatherResponse = await axios.get(OPEN_METEO_API_URL, {
      params: {
        latitude,
        longitude,
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max',
        current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
        timezone: 'auto',
        forecast_days: 1
      }
    });

    const data = weatherResponse.data;
    
    // Map weather code to description
    const weatherCode = data.current.weather_code;
    const description = getWeatherDescription(weatherCode);

    return {
      location: name,
      date,
      temperature: data.current.temperature_2m,
      description,
      windSpeed: data.current.wind_speed_10m,
      humidity: data.current.relative_humidity_2m,
      precipitation: data.daily.precipitation_sum[0] || 0,
      units: 'metric',
      source: WeatherApiSource.OPEN_METEO
    };
  } catch (error) {
    console.error('Error fetching weather data from Open-Meteo:', error);
    throw error;
  }
}

/**
 * Get weather data from OpenWeatherMap API (fallback)
 */
async function getOpenWeatherMapWeather(params: WeatherParams): Promise<WeatherResponse> {
  try {
    const response = await axios.get(OPENWEATHERMAP_API_URL, {
      params: {
        q: params.location,
        appid: WEATHER_API_KEY,
        units: 'metric'
      }
    });

    const data = response.data;
    
    return {
      location: data.name,
      date: params.date || new Date().toISOString().split('T')[0],
      temperature: data.main.temp,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      units: 'metric',
      source: WeatherApiSource.OPENWEATHERMAP
    };
  } catch (error) {
    console.error('Error fetching weather data from OpenWeatherMap:', error);
    throw error;
  }
}

/**
 * Map Open-Meteo weather code to description
 */
function getWeatherDescription(code: number): string {
  const weatherCodes: Record<number, string> = {
    0: 'clear sky',
    1: 'mainly clear',
    2: 'partly cloudy',
    3: 'overcast',
    45: 'fog',
    48: 'depositing rime fog',
    51: 'light drizzle',
    53: 'moderate drizzle',
    55: 'dense drizzle',
    56: 'light freezing drizzle',
    57: 'dense freezing drizzle',
    61: 'slight rain',
    63: 'moderate rain',
    65: 'heavy rain',
    66: 'light freezing rain',
    67: 'heavy freezing rain',
    71: 'slight snow fall',
    73: 'moderate snow fall',
    75: 'heavy snow fall',
    77: 'snow grains',
    80: 'slight rain showers',
    81: 'moderate rain showers',
    82: 'violent rain showers',
    85: 'slight snow showers',
    86: 'heavy snow showers',
    95: 'thunderstorm',
    96: 'thunderstorm with slight hail',
    99: 'thunderstorm with heavy hail'
  };

  return weatherCodes[code] || 'unknown weather';
}

/**
 * Get weather data for a specific location and date, 
 * trying Open-Meteo first and falling back to OpenWeatherMap if needed
 */
export async function getWeather(params: WeatherParams): Promise<WeatherResponse> {
  try {
    // Try Open-Meteo first (primary)
    return await getOpenMeteoWeather(params);
  } catch (error) {
    console.log('Falling back to OpenWeatherMap API...');
    
    // Use OpenWeatherMap as fallback
    if (WEATHER_API_KEY) {
      try {
        return await getOpenWeatherMapWeather(params);
      } catch (backupError) {
        throw new Error(`Both weather APIs failed. Error: ${backupError}`);
      }
    } else {
      throw new Error('Primary weather API failed and no API key for backup service');
    }
  }
} 