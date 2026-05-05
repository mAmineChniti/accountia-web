const mockKy = {
  create: () => mockKy,
  extend: () => mockKy,
  post: () => ({ json: () => Promise.resolve({}) }),
  get: () => ({ json: () => Promise.resolve({}) }),
  put: () => ({ json: () => Promise.resolve({}) }),
  patch: () => ({ json: () => Promise.resolve({}) }),
  delete: () => ({ json: () => Promise.resolve({}) }),
};

module.exports = {
  default: mockKy,
  HTTPError: class HTTPError extends Error {},
};
