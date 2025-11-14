// Mock for mermaid library to avoid ES module issues in Jest

export default {
  initialize: jest.fn(),
  render: jest.fn(() => Promise.resolve({ svg: '<svg></svg>' })),
  parse: jest.fn(() => Promise.resolve()),
  run: jest.fn(() => Promise.resolve()),
};

export const mermaidAPI = {
  initialize: jest.fn(),
  render: jest.fn(() => Promise.resolve({ svg: '<svg></svg>' })),
  parse: jest.fn(() => Promise.resolve()),
};
