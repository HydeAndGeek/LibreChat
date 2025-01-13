const { EventSource } = require('eventsource');
const logger = require('./winston');

global.EventSource = EventSource;

let mcpManager = null;

/**
 * @returns {Promise<MCPManager>}
 */
async function getMCPManager() {
  if (!mcpManager) {
    try {
      let MCPManager;
      try {
        MCPManager = (await import('librechat-mcp')).MCPManager;
      } catch {
        MCPManager = require('librechat-mcp').MCPManager;
      }
      mcpManager = MCPManager.getInstance(logger);
    } catch (error) {
      logger.warn('MCP functionality disabled: librechat-mcp package not available');
      mcpManager = {
        initializeMCP: () => {},
        mapAvailableTools: () => {}
      };
    }
  }
  return mcpManager;
}

module.exports = {
  logger,
  getMCPManager,
};
