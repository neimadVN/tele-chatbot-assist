import axios from 'axios';
import dotenv from 'dotenv';
import { SearchParams, SearchResponse } from '../types';

dotenv.config();

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const TAVILY_API_URL = 'https://api.tavily.com/search';

/**
 * Search the web using Tavily's API
 */
export async function searchWeb(params: SearchParams): Promise<SearchResponse> {
  if (!TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY environment variable is required');
  }

  try {
    // Configure search request
    const searchRequest = {
      api_key: TAVILY_API_KEY,
      query: params.query,
      search_depth: params.max_results && params.max_results > 5 ? 'advanced' : 'basic',
      max_results: params.max_results || 5,
      include_domains: params.include_domains || ['https://giavang.pnj.com.vn/'],
      exclude_domains: params.exclude_domains || [],
      include_answer: true,
      include_raw_content: false,
      include_images: false,
    };

    // Make the request to Tavily API
    const response = await axios.post(TAVILY_API_URL, searchRequest);
    
    // Format the response
    return {
      query: params.query,
      results: response.data.results.map((result: any) => ({
        title: result.title,
        url: result.url,
        content: result.content,
      })),
      answer: response.data.answer,
      source: 'Tavily'
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Tavily API error:', error.response.data);
      throw new Error(`Tavily API error: ${error.response.status}`);
    } else {
      console.error('Error searching with Tavily:', error);
      throw new Error('Failed to search the web');
    }
  }
} 