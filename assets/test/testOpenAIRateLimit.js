const { OpenAI } = require('openai');

const dotenv = require('dotenv');
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.ASSISTANT_ID;

if (!ASSISTANT_ID) {
  throw new Error('ASSISTANT_ID environment variable is required');
}

const threadId= 'thread_Ll6riTO2R2HnKOBLDd7PWZ8Z'; 
const runId= 'run_m9jnwfVmDeGWyYRGtIKNnJOn';

(async () => {
  // test the rate limit of open AI (500 requests per minute)
  // run retrive run status 600 times, in batch of 50 parallel requests, using Promise.all
  // logging error if any
  const BATCH_SIZE = 500;
  const totalRequests = 5000;
  const batches = Math.ceil(totalRequests / BATCH_SIZE);
  try {

    for (let i = 0; i < batches; i++) {
      console.log('Batch:', i + 1);
      await Promise.all(
        Array.from({ length: BATCH_SIZE }, async (_, j) => {
          const runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
          return runStatus;
        })
      );
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    console.log('Total requests:', totalRequests);
    console.log('Total batches:', batches);
  }
  
})();
