import axios from 'axios';
import https from 'https';

export interface GoldPrice {
  buyingPrice: number;
  sellingPrice: number;
  code: string;
  sellChange: number;
  sellChangePercent: number;
  buyChange: number;
  buyChangePercent: number;
  dateTime: string;
}

export interface GoldPriceResponse {
  prices: GoldPrice[];
  timestamp: string;
  source: string;
}

/**
 * Get current gold prices from mihong.vn
 */
export async function getGoldPrices(): Promise<GoldPriceResponse> {
  try {
    // Create custom https agent to bypass SSL verification
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });

    const response = await axios.get('https://www.mihong.vn/api/v1/gold/prices/current', {
      headers: {
        'accept': '*/*',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'accept-language': 'en-US,en;q=0.9',
        'referer': 'https://www.mihong.vn/vi/gia-vang-trong-nuoc',
        'x-requested-with': 'XMLHttpRequest'
      },
      httpsAgent: httpsAgent // Add the HTTPS agent to bypass SSL verification
    });

    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      // Format the data to match our response structure
      return {
        prices: response.data.data,
        timestamp: new Date().toISOString(),
        source: 'mihong.vn'
      };
    } else {
      throw new Error('Invalid response format from mihong.vn');
    }
  } catch (error) {
    console.error('Error fetching gold prices:', error);
    throw new Error('Failed to fetch gold prices');
  }
} 