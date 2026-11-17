import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { stream } from 'hono/streaming';

type Bindings = {
  DB: D1Database;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors());

// Health check
app.get('/', (c) => c.json({
  message: 'DevMind API',
  version: '1.0.0',
  status: 'running'
}));

// Get all agents
app.get('/api/agents', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM agents ORDER BY created_at DESC'
  ).all();
  return c.json(results);
});

// Create agent
app.post('/api/agents', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();
  const now = Date.now();

  await c.env.DB.prepare(`
    INSERT INTO agents (id, user_id, name, description, type, model, avatar_url, system_prompt, tools, is_public, is_active, configuration, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    body.userId || 'demo-user',
    body.name,
    body.description || '',
    body.type || 'chatbot',
    body.model || 'gpt-4',
    body.avatarUrl || '',
    body.systemPrompt || '',
    JSON.stringify(body.tools || []),
    body.isPublic ? 1 : 0,
    1,
    JSON.stringify(body.configuration || {}),
    now,
    now
  );

  return c.json({ id, ...body }, 201);
});

// Get single agent
app.get('/api/agents/:id', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM agents WHERE id = ?'
  ).bind(c.req.param('id'));

  if (!results.length) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  return c.json(results[0]);
});

// Delete agent
app.delete('/api/agents/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM agents WHERE id = ?').bind(c.req.param('id'));
  return c.json({ success: true });
});

// Chat with AI
app.post('/api/chat', async (c) => {
  const body = await c.req.json();
  const { message, history, agent } = body;
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

// Get templates
app.get('/api/templates', (c) => {
  const templates = [
    { id: '1', name: 'Customer Support Agent', description: 'Handles customer inquiries', type: 'chatbot', category: 'Support' },
    { id: '2', name: 'Data Analyst', description: 'Analyzes data and generates insights', type: 'data_analysis', category: 'Analytics' },
    { id: '3', name: 'Code Assistant', description: 'Helps write and debug code', type: 'code_execution', category: 'Development' },
    { id: '4', name: 'Workflow Automator', description: 'Automates business processes', type: 'autonomous', category: 'Automation' },
    { id: '5', name: 'Research Assistant', description: 'Conducts research and summarizes', type: 'autonomous', category: 'Research' },
    { id: '6', name: 'Sales Assistant', description: 'Helps with sales outreach', type: 'chatbot', category: 'Sales' },
  ];
  return c.json(templates);
});

export default app;
