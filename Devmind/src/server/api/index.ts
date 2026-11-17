import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { stream } from 'hono/streaming';
import { getDb, schema } from '../../db';
import { eq, desc } from 'drizzle-orm';

type Bindings = {
  DB: D1Database;
  OPENAI_API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors());

app.get('/', (c) => c.json({ 
  message: 'DevMind AI Agents API', 
  version: '1.0.0',
  endpoints: {
    agents: '/api/agents',
    conversations: '/api/conversations',
    execute: '/api/execute',
    chat: '/api/chat',
    templates: '/api/templates',
  }
}));

app.get('/api/templates', (c) => {
  const templates = [
    {
      id: '1',
      name: 'Customer Support Agent',
      description: 'Handles customer inquiries, answers FAQs, and escalates complex issues',
      type: 'chatbot',
      category: 'Support',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=support',
      systemPrompt: 'You are a helpful customer support agent. Be friendly, patient, and professional. Always try to resolve the user\'s issue. If you cannot help, escalate to a human agent.',
      tools: ['search_knowledge_base', 'create_ticket', 'lookup_order'],
    },
    {
      id: '2',
      name: 'Data Analyst',
      description: 'Analyzes data, generates insights, and creates visualizations',
      type: 'data_analysis',
      category: 'Analytics',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=analytics',
      systemPrompt: 'You are an expert data analyst. Analyze data thoroughly, provide actionable insights, and explain your findings clearly.',
      tools: ['analyze_csv', 'generate_chart', 'statistical_analysis'],
    },
    {
      id: '3',
      name: 'Code Assistant',
      description: 'Helps write, debug, and explain code across multiple languages',
      type: 'code_execution',
      category: 'Development',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=code',
      systemPrompt: 'You are an expert software developer. Write clean, efficient code. Explain your solutions clearly. Help debug issues.',
      tools: ['execute_code', 'review_code', 'explain_code'],
    },
    {
      id: '4',
      name: 'Workflow Automator',
      description: 'Automates complex multi-step workflows and business processes',
      type: 'autonomous',
      category: 'Automation',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=workflow',
      systemPrompt: 'You are an automation expert. Break down complex tasks into steps, execute them efficiently, and report progress.',
      tools: ['send_email', 'create_task', 'update_spreadsheet', 'webhook'],
    },
    {
      id: '5',
      name: 'Research Assistant',
      description: 'Conducts research, gathers information, and summarizes findings',
      type: 'autonomous',
      category: 'Research',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=research',
      systemPrompt: 'You are a research assistant. Gather information from reliable sources, organize findings, and provide comprehensive summaries.',
      tools: ['web_search', 'summarize', 'extract_data'],
    },
    {
      id: '6',
      name: 'Sales Assistant',
      description: 'Helps with sales outreach, follow-ups, and lead qualification',
      type: 'chatbot',
      category: 'Sales',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=sales',
      systemPrompt: 'You are a helpful sales assistant. Be persuasive but not pushy. Qualify leads and schedule follow-up meetings.',
      tools: ['crm_lookup', 'send_email', 'schedule_meeting'],
    },
  ];
  return c.json(templates);
});

app.get('/api/agents', async (c) => {
  const db = getDb(c.env);
  if (!db) {
    return c.json({ error: 'Database not configured' }, 500);
  }
  const agents = await db.select().from(schema.agents).orderBy(desc(schema.agents.createdAt));
  return c.json(agents);
});

app.post('/api/agents', async (c) => {
  const db = getDb(c.env);
  if (!db) {
    return c.json({ error: 'Database not configured' }, 500);
  }
  const body = await c.req.json();
  const id = crypto.randomUUID();
  const agent = await db.insert(schema.agents).values({
    id,
    userId: body.userId || '00000000-0000-0000-0000-000000000000',
    name: body.name,
    description: body.description,
    type: body.type,
    model: body.model || 'gpt-4',
    avatarUrl: body.avatarUrl,
    systemPrompt: body.systemPrompt,
    tools: body.tools || [],
    isPublic: body.isPublic || false,
    configuration: body.configuration || {},
  }).returning();
  return c.json(agent[0], 201);
});

app.get('/api/agents/:id', async (c) => {
  const db = getDb(c.env);
  if (!db) {
    return c.json({ error: 'Database not configured' }, 500);
  }
  const id = c.req.param('id');
  const agent = await db.select().from(schema.agents).where(eq(schema.agents.id, id));
  if (agent.length === 0) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  return c.json(agent[0]);
});

app.delete('/api/agents/:id', async (c) => {
  const db = getDb(c.env);
  if (!db) {
    return c.json({ error: 'Database not configured' }, 500);
  }
  const id = c.req.param('id');
  await db.delete(schema.agents).where(eq(schema.agents.id, id));
  return c.json({ success: true });
});

app.post('/api/chat', async (c) => {
  const body = await c.req.json();
  const { agentId, message, messages: history, agent } = body;
  const apiKey = c.env.OPENAI_API_KEY;

  if (!apiKey) {
    return c.json({ error: 'OpenAI API key not configured' }, 500);
  }

  const systemMessage = agent?.systemPrompt || 'You are a helpful AI assistant.';
  
  const chatMessages = [
    { role: 'system', content: systemMessage },
    ...(history || []),
    { role: 'user', content: message }
  ];

  return stream(c, async (stream) => {
    const encoder = new TextEncoder();

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: agent?.model || 'gpt-4',
          messages: chatMessages,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        await stream.write(`Error: ${error}`);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        await stream.write('Error: No response body');
        return;
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '' && line.startsWith('data: '));
        
        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              await stream.write(content);
            }
          } catch {}
        }
      }
    } catch (error) {
      await stream.write(`Error: ${error}`);
    }
  });
});

app.post('/api/execute', async (c) => {
  const body = await c.req.json();
  const { agentId, input, agent } = body;
  const apiKey = c.env.OPENAI_API_KEY;

  if (!apiKey) {
    return c.json({ error: 'OpenAI API key not configured' }, 500);
  }

  const systemMessage = agent?.systemPrompt || 'You are an autonomous AI agent. Execute the given task step by step.';

  return stream(c, async (stream) => {
    await stream.write(JSON.stringify({ status: 'started' }) + '\n');

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: agent?.model || 'gpt-4',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: `Execute this task: ${JSON.stringify(input)}` }
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        await stream.write(`Error: ${error}`);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        await stream.write('Error: No response body');
        return;
      }

      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '' && line.startsWith('data: '));
        
        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              await stream.write(content);
            }
          } catch {}
        }
      }

      await stream.write('\n' + JSON.stringify({ status: 'completed', result: fullResponse }));
    } catch (error) {
      await stream.write(`Error: ${error}`);
    }
  });
});

app.get('/api/conversations/:agentId', async (c) => {
  const db = getDb(c.env);
  if (!db) {
    return c.json({ error: 'Database not configured' }, 500);
  }
  const agentId = c.req.param('agentId');
  const conversations = await db.select()
    .from(schema.conversations)
    .where(eq(schema.conversations.agentId, agentId))
    .orderBy(desc(schema.conversations.updatedAt));
  return c.json(conversations);
});

app.get('/api/conversations/:conversationId/messages', async (c) => {
  const db = getDb(c.env);
  if (!db) {
    return c.json({ error: 'Database not configured' }, 500);
  }
  const conversationId = c.req.param('conversationId');
  const messages = await db.select()
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, conversationId))
    .orderBy(schema.messages.createdAt);
  return c.json(messages);
});

export const agentsApi = app;
