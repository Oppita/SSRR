import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Hello', model: 'gemini-3-flash-preview' })
    });
    const data = await res.text();
    console.log('Response:', data);
  } catch (e) {
    console.error(e);
  }
}

test();
