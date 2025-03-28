import OpenAI from 'openai';
import dotenv from 'dotenv';
import { WeatherParams, SearchParams, GoldPriceParams } from '../types';
import { getWeather } from './weatherService';
import { searchWeb } from './tavilyService';
import { getGoldPrices } from './goldPriceService';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.ASSISTANT_ID;

if (!ASSISTANT_ID) {
  throw new Error('ASSISTANT_ID environment variable is required');
}

/**
 * Create a new thread for conversation
 */
export async function createThread() {
  const thread = await openai.beta.threads.create();
  return thread.id;
}

/**
 * Add a message to a thread
 */
export async function addMessage(threadId: string, content: string, role: string = 'user') {
  await openai.beta.threads.messages.create(threadId, {
    role: role as 'user' | 'assistant',
    content,
  });
}

/**
 * Run the assistant on the thread and handle function calls
 */
export async function runAssistant(threadId: string) {
  // Start a run
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: ASSISTANT_ID as string,
  });

  // Poll for the run completion
  let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);

  while (runStatus.status !== 'completed' && runStatus.status !== 'failed') {
    if (runStatus.status === 'requires_action') {
      // Handle tool calls/function calling
      const toolCalls = runStatus.required_action?.submit_tool_outputs.tool_calls;
      
      // Log the tool calls
      console.log('requires_action - Tool calls: ', toolCalls);
      
      if (toolCalls) {
        const toolOutputs = [];

        for (const toolCall of toolCalls) {
          if (toolCall.function.name === 'get_weather') {
            try {
              const args = JSON.parse(toolCall.function.arguments) as WeatherParams;
              const weatherData = await getWeather(args);
              
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify(weatherData),
              });
            } catch (error) {
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify({ error: 'Failed to get weather data' }),
              });
            }
          } else if (toolCall.function.name === 'search_web') {
            try {
              const args = JSON.parse(toolCall.function.arguments) as SearchParams;
              const searchData = await searchWeb(args);
              
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify(searchData),
              });
            } catch (error) {
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify({ error: 'Failed to search the web' }),
              });
            }
          } else if (toolCall.function.name === 'get_gold_price') {
            try {
              const args = JSON.parse(toolCall.function.arguments) as GoldPriceParams;
              const goldPriceData = await getGoldPrices();
              
              // If specific gold code requested, filter the results
              if (args.code) {
                const filteredPrices = goldPriceData.prices.filter(
                  price => price.code.toLowerCase() === args.code?.toLowerCase()
                );
                
                // If found, return only that specific price
                if (filteredPrices.length > 0) {
                  goldPriceData.prices = filteredPrices;
                }
              }
              
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify(goldPriceData),
              });
            } catch (error) {
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify({ error: 'Failed to get gold price data' }),
              });
            }
          }
        }

        // Submit the outputs back to the assistant
        await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, {
          tool_outputs: toolOutputs,
        });
      }
    }
    
    // Wait for a bit to avoid hitting rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check the status again
    runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
  }

  // Retrieve messages after the run is complete
  const messages = await openai.beta.threads.messages.list(threadId);
  
  // Return the latest assistant message
  const assistantMessages = messages.data
    .filter(msg => msg.role === 'assistant')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  if (assistantMessages.length > 0) {
    return assistantMessages[0];
  }
  
  return null;
} 