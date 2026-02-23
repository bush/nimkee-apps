// Factories are registered here (hoisted by Jest); fresh instances are
// obtained via require() inside beforeEach after jest.resetModules().
jest.mock('./nest-init', () => ({ nestInit: jest.fn() }));
jest.mock('@codegenie/serverless-express', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('main-sls HTTP Lambda handler', () => {
  let handler: (...args: any[]) => Promise<any>;
  let mockNestInit: jest.Mock;
  let mockAdapter: jest.Mock;

  beforeEach(() => {
    jest.resetModules();

    // Re-register factories so require() gets fresh mocks after reset
    jest.mock('./nest-init', () => ({ nestInit: jest.fn() }));
    jest.mock('@codegenie/serverless-express', () => ({
      __esModule: true,
      default: jest.fn(),
    }));

    mockAdapter = jest.fn().mockResolvedValue({ statusCode: 200 });

    // Grab fresh mock references AFTER reset
    const nestInitMod = require('./nest-init');
    mockNestInit = nestInitMod.nestInit;
    mockNestInit.mockResolvedValue({
      init: jest.fn().mockResolvedValue(undefined),
      getHttpAdapter: jest.fn().mockReturnValue({
        getInstance: jest.fn().mockReturnValue({}),
      }),
    });

    const slsMod = require('@codegenie/serverless-express');
    slsMod.default.mockReturnValue(mockAdapter);

    handler = require('./main-sls').handler;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('2.1 first invocation calls bootstrap() and caches the server', async () => {
    await handler({}, {}, jest.fn());
    expect(mockNestInit).toHaveBeenCalledTimes(1);
  });

  it('2.2 second invocation reuses the cached server (warm start)', async () => {
    await handler({}, {}, jest.fn());
    await handler({}, {}, jest.fn());
    expect(mockNestInit).toHaveBeenCalledTimes(1);
  });

  it('2.3 handler delegates to the serverlessExpress adapter', async () => {
    const event = { httpMethod: 'GET', path: '/' };
    const context = { functionName: 'test' };
    const callback = jest.fn();

    await handler(event, context, callback);

    expect(mockAdapter).toHaveBeenCalledWith(event, context, callback);
  });
});
