const mockMcpResponse = {
  content: 'Mock response from Claude',
  metadata: {
    model: 'claude-2',
    usage: {
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150
    }
  }
};

const use_mcp_tool = jest.fn().mockImplementation(async (server, tool, args) => {
  if (server === 'claude' && tool === 'chat') {
    return mockMcpResponse;
  }
  throw new Error(`Unknown server/tool combination: ${server}/${tool}`);
});

module.exports = {
  use_mcp_tool,
  mockMcpResponse
};
