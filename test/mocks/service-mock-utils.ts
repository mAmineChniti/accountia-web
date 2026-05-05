import { publicClient, createAuthenticatedClient } from '@/lib/requests';

/**
 * Utility to setup mocks for services that use publicClient or createAuthenticatedClient
 * Returns a mock client that handles the .json() chaining commonly used in our services
 */
export function setupServiceMocks() {
  const mockClient = {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    json: jest.fn(),
  };

  // Setup the chain: client.method().json()
  const createMockChain = (method: keyof typeof mockClient) => {
    (mockClient[method] as jest.Mock).mockReturnValue({
      json: mockClient.json,
    });
  };

  ['post', 'get', 'put', 'patch', 'delete'].forEach((m) =>
    createMockChain(m as any)
  );

  // Mock the imports from '@/lib/requests'
  (publicClient.post as jest.Mock).mockImplementation(mockClient.post);
  (publicClient.get as jest.Mock).mockImplementation(mockClient.get);
  (publicClient.put as jest.Mock).mockImplementation(mockClient.put);
  (publicClient.patch as jest.Mock).mockImplementation(mockClient.patch);
  (publicClient.delete as jest.Mock).mockImplementation(mockClient.delete);

  (createAuthenticatedClient as jest.Mock).mockReturnValue(mockClient);

  return mockClient;
}
