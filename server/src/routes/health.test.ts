import request from 'supertest';
import app from '../index';

describe('Health Check API', () => {
  it('should respond with 200 OK for /health endpoint', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', '服务运行正常');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should respond with 200 OK for /api/health endpoint', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', '服务运行正常');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should return JSON format for health check endpoints', async () => {
    const response = await request(app).get('/health');
    
    expect(response.type).toBe('application/json');
  });

  it('should have valid timestamp in response', async () => {
    const response = await request(app).get('/health');
    const timestamp = new Date(response.body.timestamp);
    
    expect(timestamp instanceof Date).toBe(true);
    expect(!isNaN(timestamp.getTime())).toBe(true);
  });
});