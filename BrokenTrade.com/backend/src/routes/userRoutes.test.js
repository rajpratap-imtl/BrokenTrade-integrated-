const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userRoutes = require('./userRoutes');
const User = require('../modules/user');

// Mock the User model
jest.mock('../modules/user');
jest.mock('../modules/enrollment');

// Create a test app
const app = express();
app.use(express.json());
app.use('/User', userRoutes);

// Set up environment variables for testing
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '24h';

describe('JWT Token Generation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /User/login - Valid credentials generate valid JWT', () => {
    it('should generate a valid JWT token when credentials are correct', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        type: 'Learner',
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/User/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('message', 'Login successful');
      
      // Verify the token is a valid JWT
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded).toBeDefined();
    });
  });

  describe('POST /User/login - JWT payload contains correct user data', () => {
    it('should include user id, email, and type in JWT payload', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        type: 'Learner',
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/User/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      
      expect(decoded.id).toBe(mockUser._id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.type).toBe(mockUser.type);
    });

    it('should return user data in response body', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        type: 'Learner',
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/User/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual({
        id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        type: mockUser.type,
      });
    });
  });

  describe('POST /User/login - JWT expires after configured duration', () => {
    it('should set JWT expiration to 24 hours', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        type: 'Learner',
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/User/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      
      // Check that exp and iat exist
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      
      // Calculate the difference (should be 24 hours = 86400 seconds)
      const expirationDuration = decoded.exp - decoded.iat;
      expect(expirationDuration).toBe(86400); // 24 hours in seconds
    });

    it('should reject expired token', () => {
      // Create a token that expired 1 hour ago
      const expiredToken = jwt.sign(
        {
          id: '507f1f77bcf86cd799439011',
          email: 'test@example.com',
          type: 'Learner',
        },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Negative expiration = already expired
      );

      expect(() => {
        jwt.verify(expiredToken, process.env.JWT_SECRET);
      }).toThrow('jwt expired');
    });
  });

  describe('POST /User/login - Invalid credentials return 401 error', () => {
    it('should return 401 when email does not exist', async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/User/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid email or password');
      expect(response.body).not.toHaveProperty('token');
    });

    it('should return 401 when password is incorrect', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('correctpassword', 10),
        type: 'Learner',
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/User/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid email or password');
      expect(response.body).not.toHaveProperty('token');
    });

    it('should not leak information about which credential is wrong', async () => {
      // Test with non-existent email
      User.findOne.mockResolvedValue(null);
      const response1 = await request(app)
        .post('/User/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      // Test with wrong password
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        password: await bcrypt.hash('correctpassword', 10),
      };
      User.findOne.mockResolvedValue(mockUser);
      
      const response2 = await request(app)
        .post('/User/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      // Both should return the same error message
      expect(response1.body.error).toBe(response2.body.error);
    });
  });
});
