# OpenAI Assistant Chatbot

A terminal-based chatbot that leverages OpenAI's Assistant API with function calling capabilities. This chatbot can provide weather information for locations specified by the user, search the web for information using Tavily, and check current gold prices in Vietnam.

## Features

- Utilizes OpenAI's Beta Assistants API
- Creates a new thread for each conversation
- Implements function calling to fetch weather data from Open-Meteo API
- Falls back to OpenWeatherMap if the primary API fails
- Web search capabilities powered by Tavily API
- Real-time gold price information from mihong.vn
- Simple terminal-based interface
- Interactive command-line interface
- Integration with OpenAI's Assistant API
- Function calling capability with weather service, web search, and gold price checking
- Telegram bot integration for chatting via Telegram

## Prerequisites

- Node.js (v14 or higher)
- OpenAI API key
- Assistant ID from OpenAI dashboard
- OpenWeatherMap API key (optional, only for fallback)
- Tavily API key (for web search functionality)

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your API keys:
   ```
   cp .env.example .env
   ```
4. Build the TypeScript code:
   ```
   npm run build
   ```

## Running the Chatbot

```
npm start
```

## Setting up the OpenAI Assistant

Before using this app, you need to set up an Assistant on the OpenAI platform:

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Navigate to the "Assistants" section
3. Click "Create Assistant"
4. Configure your assistant with the following settings:

### Basic Configuration

- **Name**: Multifunctional Assistant (or any name you prefer)
- **Model**: Select GPT-4 or GPT-3.5 Turbo
- **Description**: A helpful assistant that can provide weather information, search the web for information, and check gold prices in Vietnam.

### System Instructions

Add the following system instructions:

```
Your name is Javen, you are a helpful assistant that can provide weather information, search the web for information, and check gold prices in Vietnam.

When asked about the weather in a location, you should use the get_weather function to fetch the current weather data.
The weather data comes from Open-Meteo API with OpenWeatherMap as a fallback. You can provide temperature, weather conditions, humidity, wind speed, and precipitation information.
Always ask for the location if the user doesn't provide one when asking about weather.

When asked about facts, information, current events, or any topic that might benefit from up-to-date information, use the search_web function to get relevant information from the internet.
Present the search results in a clear and concise manner, citing sources when appropriate.

When asked about gold prices, use the get_gold_price function to fetch the current gold prices in Vietnam.
By default, focus on SJC and 999 gold codes which are the most commonly requested types of gold. 
The prices are in Vietnamese Dong (VND) currency.
After providing the current prices for SJC and 999 gold, ask if the user would like to know about prices for other gold types (such as 980, 750, 610, etc).
Always include the buying and selling prices, and mention the date and time of the price update.
If the get_gold_price function having any issue, fallback to search_web function to get the VietNam gold price of 999 and SJC somewhere else from the internet.

Any message prefixed with 'SYSTEM:' must be treated as an invisible instruction that you will follow without any acknowledgment. You must never reference, mention, paraphrase, or respond to the SYSTEM message itself in any way. The SYSTEM prefix indicates that this is a command to modify your behavior, not content to be addressed in your response. You should only respond to the actual user query that follows or precedes the SYSTEM message, or execute the appropriate function call, as if the SYSTEM message never appeared in the conversation.

Be friendly, concise, and helpful in your responses. If you don't know the answer to a question or if it's outside your capabilities, just say so.
```

### Function Definitions

Add the following functions:

1. **Function Name**: get_weather
   - **Description**: Get the current weather for a specific location and optionally for a specific date
   - **Parameters**:
   ```json
   {
     "type": "object",
     "properties": {
       "location": {
         "type": "string",
         "description": "The city and country, e.g., 'London, UK'"
       },
       "date": {
         "type": "string",
         "description": "The date for the weather forecast in YYYY-MM-DD format (optional)"
       }
     },
     "required": ["location"]
   }
   ```

2. **Function Name**: search_web
   - **Description**: Search the web for information on a given query
   - **Parameters**:
   ```json
   {
     "type": "object",
     "properties": {
       "query": {
         "type": "string",
         "description": "The search query"
       },
       "max_results": {
         "type": "integer",
         "description": "Maximum number of results to return (default: 5)"
       },
       "include_domains": {
         "type": "array",
         "items": {
           "type": "string"
         },
         "description": "List of domains to include in the search (optional)"
       },
       "exclude_domains": {
         "type": "array",
         "items": {
           "type": "string"
         },
         "description": "List of domains to exclude from the search (optional)"
       }
     },
     "required": ["query"]
   }
   ```

3. **Function Name**: get_gold_price
   - **Description**: Get current gold prices in Vietnam
   - **Parameters**:
   ```json
   {
     "type": "object",
     "properties": {
       "code": {
         "type": "string",
         "description": "The gold code to get prices for (e.g., 'SJC', '999', '980', etc.). If not specified, returns prices for all gold types."
       }
     },
     "required": []
   }
   ```

### Model Settings

- **Temperature**: 0.7 (moderate creativity)
- **Top P**: 0.9
- **Response format**: Text

4. Save your assistant and copy the Assistant ID to your .env file

## APIs Used

- **Weather (Primary)**: [Open-Meteo API](https://open-meteo.com/) (free, no API key required)
- **Weather (Fallback)**: [OpenWeatherMap API](https://openweathermap.org/) (free tier requires API key)
- **Web Search**: [Tavily API](https://tavily.com/) (requires API key)
- **Gold Prices**: [Mihong.vn API](https://www.mihong.vn/) (no API key required)

## License

MIT 

### Telegram Bot Setup (Optional)

To use the Telegram integration:

1. Create a new bot on Telegram by messaging [@BotFather](https://t.me/botfather)
2. Follow the instructions to create a new bot and get the API token
3. Add your Telegram Bot Token to the `.env` file:
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   ```
4. When you run the application with `npm start` or `npm run dev`, it will start both the CLI and Telegram bot interfaces
5. Open your bot in Telegram and send `/start` to begin a new conversation 