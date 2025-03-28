/**
 * Role definitions for assistant interactions
 */
export enum Role {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
  DEVELOPER = 'developer',
  OPERATOR = 'operator'
}

/**
 * Weather function parameter types
 */
export interface WeatherParams {
  location: string;
  date?: string;
}

/**
 * Web search function parameter types
 */
export interface SearchParams {
  query: string;
  max_results?: number;
  include_domains?: string[];
  exclude_domains?: string[];
}

/**
 * Gold price function parameter types
 */
export interface GoldPriceParams {
  code?: string;
}

/**
 * Web search result
 */
export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

/**
 * Web search response
 */
export interface SearchResponse {
  query: string;
  results: SearchResult[];
  answer?: string;
  source: string;
}

/**
 * Weather API sources
 */
export enum WeatherApiSource {
  OPEN_METEO = 'open-meteo',
  OPENWEATHERMAP = 'openweathermap'
}

/**
 * Weather response type
 */
export interface WeatherResponse {
  location: string;
  date: string;
  temperature: number;
  description: string;
  humidity?: number;
  windSpeed: number;
  precipitation?: number;
  units: 'metric' | 'imperial';
  source: WeatherApiSource;
}

/**
 * Function call type
 */
export interface FunctionCall {
  name: string;
  arguments: string;
}

/**
 * Telegram user session type
 */
export interface TelegramSession {
  threadId: string;
  chatId: number;
  firstName: string;
  lastInteraction: Date;
} 