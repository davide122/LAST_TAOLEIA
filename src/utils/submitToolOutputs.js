
export async function submitToolOutputs(threadId, runId, toolCallId, output) {
  const res = await fetch(
    `https://api.openai.com/v1/threads/${threadId}/runs/${runId}/submit_tool_outputs`,
    {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta':   'assistants=v2'
      },
      body: JSON.stringify({
        tool_outputs: [{
          tool_call_id: toolCallId,
          output:       JSON.stringify(output)
        }]
      })
    }
  );
  if (!res.ok) {
    const txt = await res.text();
    console.error(`submitToolOutputs errore ${res.status}: ${txt}`);
  }
  return res;
}
