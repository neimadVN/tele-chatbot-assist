// import dotenv
import dotenv from 'dotenv';
dotenv.config();

// test if user adding multiple messages in serial before one run:
// 1. create a thread
// 2. add message to the thread: "check gold price"
// 3. add message to the thread: "only 999 gold, ignore other gold"
// 4. run the assistant
// 5. check the run status

import { createThread, addMessage, runAssistant } from '../../src/services/assistantService';

(async () => {
  const threadId = await createThread();
  await addMessage(threadId, 'hello, how are you?');
  await addMessage(threadId, 'would you please check gold price?');
  await addMessage(threadId, 'only 999 gold, ignore other gold');
  const message = await runAssistant(threadId);

  // log the assistant message
  console.log('assistant message: ', message?.content[0]);
})();
