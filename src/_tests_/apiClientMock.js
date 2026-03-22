jest.mock('../services/apiClient', () => ({
  getRaceChannel: jest.fn().mockReturnValue({
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  }),
  getAblyClient: jest.fn().mockReturnValue({
    channels: {
      get: jest.fn().mockReturnValue({
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
      }),
    },
  }),
  getBaseUrl: jest.fn().mockReturnValue('http://localhost:8888'),
  headers: { 'Content-Type': 'application/json' },
  API_URL: 'http://localhost:8888/.netlify/functions',
  getClientId: jest.fn().mockReturnValue('test-client-id'),
}));
