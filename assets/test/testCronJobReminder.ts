
import dotenv from 'dotenv';
dotenv.config();

import { createThread, addMessage, runAssistant } from '../../src/services/assistantService';

(async () => {
  const threadId = await createThread();

  await addMessage(threadId, 'hello, how are you?');
  await addMessage(threadId, 'check for morning headlines');
  const message1 = await runAssistant(threadId);
  // log the assistant message
  console.log('assistant message: ', message1?.content[0]);

  // wait 3 seconds
  await new Promise(resolve => setTimeout(resolve, 3000));

  await addMessage(threadId, 'SYSTEM: Now is 09:30 AM, assistant will remind the user to take a break right now!', 'user');
  const message2 = await runAssistant(threadId);
  console.log('assistant message: ', message2?.content[0]);
})();
