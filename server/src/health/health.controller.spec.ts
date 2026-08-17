import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports a healthy API with an ISO timestamp', () => {
    const response = new HealthController().check();

    expect(response.status).toBe('ok');
    expect(typeof response.timestamp).toBe('string');
    expect(new Date(response.timestamp).toISOString()).toBe(response.timestamp);
  });
});
