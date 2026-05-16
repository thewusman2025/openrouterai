#!/usr/bin/env node
// Drives the built MCP server over stdio and asserts annotations[] survive.

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const serverPath = join(here, '..', 'dist', 'index.js');

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.error('FAIL: OPENROUTER_API_KEY not set in env');
  process.exit(2);
}

const child = spawn('node', [serverPath], {
  env: { ...process.env, OPENROUTER_API_KEY: apiKey, OPENROUTER_DEFAULT_MODEL: 'perplexity/sonar' },
  stdio: ['pipe', 'pipe', 'pipe'],
});

let buf = '';
const pending = new Map();
let nextId = 1;

function send(method, params) {
  const id = nextId++;
  const msg = { jsonrpc: '2.0', id, method, params };
  child.stdin.write(JSON.stringify(msg) + '\n');
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error(`timeout waiting for ${method}`));
      }
    }, 60_000);
  });
}

child.stdout.on('data', (chunk) => {
  buf += chunk.toString();
  let nl;
  while ((nl = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      }
    } catch (e) {
      // skip non-JSON stderr noise that landed in stdout
    }
  }
});

child.stderr.on('data', (d) => process.stderr.write(`[mcp stderr] ${d}`));

try {
  await send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'citation-test', version: '0.1.0' },
  });
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

  const result = await send('tools/call', {
    name: 'chat_completion',
    arguments: {
      model: 'perplexity/sonar',
      messages: [
        { role: 'user', content: 'In one sentence: who won the 2024 US presidential election? Include source URL.' },
      ],
      search_recency_filter: 'month',
    },
  });

  const text = result.content?.[0]?.text ?? '';
  const parsed = JSON.parse(text);
  const msg = parsed.choices?.[0]?.message ?? {};
  const annotations = msg.annotations ?? [];

  console.log('=== RESPONSE ===');
  console.log('content:', msg.content);
  console.log('annotations count:', annotations.length);
  console.log('first annotation:', JSON.stringify(annotations[0], null, 2));

  if (annotations.length > 0 && annotations[0]?.url_citation?.url) {
    console.log('\n✅ PASS — annotations[].url_citation preserved end-to-end through MCP');
    process.exit(0);
  } else {
    console.log('\n❌ FAIL — annotations missing or malformed');
    process.exit(1);
  }
} catch (e) {
  console.error('FAIL:', e.message);
  process.exit(1);
} finally {
  child.kill();
}
