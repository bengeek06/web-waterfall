/**
 * Centralized mock responses for all API endpoints
 * These mocks are used when MOCK_API=true
 */

import { MockResponse } from './types';

/**
 * Authentication service mocks
 */
export const authMocks = {
  login: {
    status: 200,
    body: {
      message: "Login successful",
      access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2NrLXVzZXItaWQiLCJlbWFpbCI6Im1vY2tAdGVzdC5jb20iLCJjb21wYW55X2lkIjoibW9jay1jb21wYW55IiwiZXhwIjoxNzI4NzM0ODAwfQ.mock-signature",
      refresh_token: "mock-refresh-token-a1B2c3D4e5F6g7H8i9J0",
      _dev_note: "Tokens visible in development mode only"
    },
    cookies: [
      "access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2NrLXVzZXItaWQiLCJlbWFpbCI6Im1vY2tAdGVzdC5jb20iLCJjb21wYW55X2lkIjoibW9jay1jb21wYW55IiwiZXhwIjoxNzI4NzM0ODAwfQ.mock-signature; Path=/; HttpOnly; SameSite=Lax; Max-Age=900",
      "refresh_token=mock-refresh-token-a1B2c3D4e5F6g7H8i9J0; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800"
    ]
  } as MockResponse,

  verify: {
    status: 200,
    body: {
      valid: true,
      user_id: "mock-user-id",
      email: "mock@test.com",
      company_id: "mock-company-id"
    }
  } as MockResponse,

  refresh: {
    status: 200,
    body: {
      message: "Token refreshed",
      access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2NrLXVzZXItaWQiLCJlbWFpbCI6Im1vY2tAdGVzdC5jb20iLCJjb21wYW55X2lkIjoibW9jay1jb21wYW55IiwiZXhwIjoxNzI4NzM0ODAwfQ.new-mock-signature",
      refresh_token: "new-mock-refresh-token-b2C3d4E5f6G7h8I9j0K1",
      _dev_note: "Tokens visible in development mode only"
    },
    cookies: [
      "access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2NrLXVzZXItaWQiLCJlbWFpbCI6Im1vY2tAdGVzdC5jb20iLCJjb21wYW55X2lkIjoibW9jay1jb21wYW55IiwiZXhwIjoxNzI4NzM0ODAwfQ.new-mock-signature; Path=/; HttpOnly; SameSite=Lax; Max-Age=900",
      "refresh_token=new-mock-refresh-token-b2C3d4E5f6G7h8I9j0K1; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800"
    ]
  } as MockResponse,

  logout: {
    status: 200,
    body: {
      message: "Logout successful"
    },
    cookies: [
      "access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
      "refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
    ]
  } as MockResponse,

  health: {
    status: 200,
    body: {
      status: "healthy",
      service: "authentication",
      message: "Authentication service is running (mock)"
    }
  } as MockResponse,

  version: {
    status: 200,
    body: {
      version: "0.0.1-mock"
    }
  } as MockResponse,

  config: {
    status: 200,
    body: {
      FLASK_ENV: "development",
      DATABASE_URL: "postgresql://mock:mock@localhost:5432/mock",
      LOG_LEVEL: "INFO",
      USER_SERVICE_URL: "http://mock-user-service:5002"
    }
  } as MockResponse
};
