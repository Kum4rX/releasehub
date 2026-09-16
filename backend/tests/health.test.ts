import http from 'http';
import { app } from '../src/app';
import { Logger } from '../src/utils/logger';

const runHealthTest = async (): Promise<void> => {
  Logger.info('Starting automated health endpoint verification test...');

  // Start app on ephemeral port
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Could not determine server address');
  }

  const port = address.port;
  const url = `http://localhost:${port}/api/v1/health`;

  try {
    const res = await fetch(url);
    const body = await res.json();

    Logger.info(`Response Status: ${res.status}`);
    Logger.info(`Response Body: ${JSON.stringify(body, null, 2)}`);

    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.status}`);
    }

    if (!body.success) {
      throw new Error(`Expected body.success === true, got ${body.success}`);
    }

    if (body.data?.status !== 'ok' || body.data?.service !== 'releasehub-api') {
      throw new Error('Unexpected payload in health response data');
    }

    Logger.info('SUCCESS: Health endpoint test passed cleanly!');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    Logger.error(`TEST FAILED: ${message}`);
    process.exitCode = 1;
  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }
};

runHealthTest();
