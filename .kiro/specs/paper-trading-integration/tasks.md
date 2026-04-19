# Implementation Plan: Paper Trading Integration

## Overview

This implementation plan transforms BrokenTrade.com and paperTrading into a unified platform with shared authentication, database, and development environment. The tasks are organized sequentially to build incrementally from infrastructure setup through authentication integration to final testing.

## Tasks

- [x] 1. Set up root monorepo development environment
  - Create root `package.json` with concurrently scripts for all four services
  - Create root `.env` file with shared configuration (MongoDB URI, JWT secret, ports, CORS origins)
  - Install concurrently as dev dependency at root level
  - Test that `npm run dev` starts all four services on correct ports
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1, 7.2, 7.3, 7.4_

- [x] 2. Update BrokenTrade backend for JWT authentication
  - [x] 2.1 Install jsonwebtoken dependency in BrokenTrade backend
    - Add `jsonwebtoken` to `BrokenTrade.com/backend/package.json` dependencies
    - Run `npm install` in backend directory
    - _Requirements: 5.1_

  - [x] 2.2 Update BrokenTrade backend environment configuration
    - Create/update `BrokenTrade.com/backend/.env` with JWT_SECRET, JWT_EXPIRES_IN, CORS origins
    - Ensure MongoDB URI matches shared database
    - _Requirements: 6.1, 7.2, 7.3_

  - [x] 2.3 Modify login endpoint to generate JWT tokens
    - Update `BrokenTrade.com/backend/src/routes/userRoutes.js` login handler
    - Generate JWT token with user ID, email, and type in payload
    - Set token expiration to 24 hours
    - Return token and user data in response
    - _Requirements: 2.1, 2.2, 5.1, 5.2, 5.3_

  - [x] 2.4 Write unit tests for JWT token generation
    - Test valid credentials generate valid JWT
    - Test JWT payload contains correct user data
    - Test JWT expires after configured duration
    - Test invalid credentials return 401 error
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 2.5 Update CORS configuration in BrokenTrade backend
    - Modify `BrokenTrade.com/backend/server.js` CORS settings
    - Allow origins from both frontend ports (5173, 5174)
    - Enable credentials in CORS configuration
    - _Requirements: 3.1, 3.2, 3.5_

- [x] 3. Update BrokenTrade frontend for token storage and navigation
  - [x] 3.1 Update AuthContext to handle JWT tokens
    - Modify `BrokenTrade.com/frontend/src/context/AuthContext.jsx`
    - Add token state management
    - Store token and user data in localStorage with keys `brokentrade_token` and `brokentrade_user`
    - Add `navigateToPaperTrading` function that checks token and redirects
    - _Requirements: 2.3, 4.2_

  - [x] 3.2 Update Login page to store JWT token
    - Modify `BrokenTrade.com/frontend/src/pages/Login.jsx` login handler
    - Extract token from backend response
    - Call AuthContext login function with user and token
    - _Requirements: 2.3_

  - [x] 3.3 Create PaperTradingButton component
    - Create `BrokenTrade.com/frontend/src/components/PaperTradingButton.jsx`
    - Implement button that calls `navigateToPaperTrading` from AuthContext
    - Show error message if user not authenticated
    - Navigate to http://localhost:5174 if authenticated
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 3.4 Add PaperTradingButton to homepage
    - Import and render PaperTradingButton in appropriate homepage component
    - _Requirements: 4.1_

  - [x] 3.5 Update logout functionality to clear token
    - Modify AuthContext logout function to remove token from localStorage
    - _Requirements: 8.1_

- [x] 4. Checkpoint - Verify BrokenTrade authentication works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement PaperTrading backend authentication middleware
  - [x] 5.1 Install jsonwebtoken dependency in PaperTrading backend
    - Add `jsonwebtoken` to `paperTrading/backend/package.json` dependencies
    - Run `npm install` in backend directory
    - _Requirements: 5.4_

  - [x] 5.2 Create shared User model in PaperTrading backend
    - Create User mongoose schema matching BrokenTrade schema
    - Include fields: name, email, mobile, pan, dob, password, type, coins, etc.
    - _Requirements: 6.4_

  - [x] 5.3 Create authentication middleware
    - Create `paperTrading/backend/src/middleware/authMiddleware.js`
    - Implement `authenticateToken` function that extracts Bearer token from Authorization header
    - Verify JWT signature using shared JWT_SECRET
    - Fetch user from shared MongoDB database
    - Handle errors: MISSING_TOKEN, INVALID_TOKEN, TOKEN_EXPIRED, USER_NOT_FOUND
    - Attach user object to req.user
    - _Requirements: 2.5, 2.6, 2.7, 2.8, 5.4, 5.5, 5.6, 5.7, 5.8, 6.4_

  - [ ]* 5.4 Write unit tests for authentication middleware
    - Test valid token allows request to proceed
    - Test missing token returns MISSING_TOKEN error
    - Test invalid signature returns INVALID_TOKEN error
    - Test expired token returns TOKEN_EXPIRED error
    - Test non-existent user returns USER_NOT_FOUND error
    - _Requirements: 2.7, 5.7, 5.8_

  - [x] 5.5 Create authentication routes
    - Create `paperTrading/backend/src/routes/authRoutes.js`
    - Implement GET `/api/auth/verify` endpoint with authenticateToken middleware
    - Return user data when token is valid
    - Implement GET `/api/auth/health` endpoint without authentication
    - _Requirements: 2.6, 2.8, 10.3_

  - [ ]* 5.6 Write unit tests for authentication routes
    - Test `/api/auth/verify` with valid token returns user data
    - Test `/api/auth/verify` with invalid token returns 401
    - Test `/api/auth/health` returns status without auth
    - _Requirements: 2.6, 2.8_

  - [x] 5.7 Update PaperTrading backend environment configuration
    - Create/update `paperTrading/backend/.env` with JWT_SECRET, MongoDB URI, CORS origins
    - Ensure JWT_SECRET matches BrokenTrade backend
    - Ensure MongoDB URI matches shared database
    - _Requirements: 6.2, 7.2, 7.3_

  - [x] 5.8 Update CORS configuration in PaperTrading backend
    - Modify `paperTrading/backend/src/app.js` CORS settings
    - Allow origins from both frontend ports (5173, 5174)
    - Enable credentials in CORS configuration
    - _Requirements: 3.3, 3.4, 3.6_

  - [x] 5.9 Apply authentication middleware to protected routes
    - Update `paperTrading/backend/src/app.js` to use authenticateToken middleware
    - Protect routes: `/api/data-accessor`, `/api/indicator-api`, `/api`
    - Keep `/api/auth` routes public
    - _Requirements: 2.8, 10.2_

  - [x] 5.10 Update database service to use shared database
    - Modify `paperTrading/backend/src/services/dbService.js`
    - Ensure connection uses MONGODB_URI from environment
    - Remove any hardcoded database name overrides
    - _Requirements: 6.2, 6.4_

- [x] 6. Implement PaperTrading frontend authentication integration
  - [x] 6.1 Install Pinia for state management (if not already installed)
    - Add `pinia` to `paperTrading/frontend/package.json` dependencies
    - Run `npm install` in frontend directory
    - _Requirements: 2.4_

  - [x] 6.2 Create authentication store
    - Create `paperTrading/frontend/src/stores/auth.js` using Pinia
    - Implement `loadFromStorage` to retrieve token from localStorage
    - Implement `verifyToken` to call `/api/auth/verify` endpoint
    - Implement `logout` to clear localStorage and redirect to BrokenTrade login
    - Implement `checkBackendAvailability` to check if backend is running
    - Handle error codes: TOKEN_EXPIRED, INVALID_TOKEN, network errors
    - _Requirements: 2.4, 2.5, 4.5, 8.2, 9.1, 9.2, 10.3_

  - [x] 6.3 Write unit tests for authentication store
    - Test `loadFromStorage` retrieves token from localStorage
    - Test `verifyToken` calls backend with correct Authorization header
    - Test `logout` clears localStorage and redirects
    - Test `checkBackendAvailability` returns true when backend responds
    - _Requirements: 2.4, 8.2_

  - [x] 6.4 Update router with authentication guard
    - Modify `paperTrading/frontend/src/router/index.js`
    - Add `beforeEach` navigation guard
    - Check backend availability before verifying token
    - Call `verifyToken` for routes with `requiresAuth: true` meta
    - Redirect to BrokenTrade login if authentication fails
    - _Requirements: 4.4, 4.5, 10.3_

  - [x] 6.5 Initialize auth store in main.js
    - Update `paperTrading/frontend/src/main.js`
    - Create Pinia instance and register with app
    - Call `loadFromStorage` before mounting app
    - _Requirements: 2.4_

  - [x] 6.6 Create LogoutButton component
    - Create `paperTrading/frontend/src/components/LogoutButton.vue`
    - Implement button that calls auth store logout function
    - _Requirements: 8.2_

  - [x] 6.7 Add LogoutButton to PaperTrading UI
    - Import and render LogoutButton in appropriate layout component
    - _Requirements: 8.2_

  - [x] 6.8 Implement error message display
    - Add error message display in PaperTrading frontend
    - Show appropriate messages for TOKEN_EXPIRED, INVALID_TOKEN, network errors
    - Clear error messages on successful authentication
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 7. Checkpoint - Verify cross-service authentication works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Integration testing and validation
  - [ ]* 8.1 Write integration tests for end-to-end authentication flow
    - Test user logs in via BrokenTrade, token stored in localStorage
    - Test navigate to PaperTrading, token retrieved and validated
    - Test PaperTrading backend validates token against shared database
    - Test user data fetched from shared MongoDB
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ]* 8.2 Write integration tests for CORS configuration
    - Test BrokenTrade backend accepts requests from both frontends
    - Test PaperTrading backend accepts requests from both frontends
    - Test credentials included in cross-origin requests
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 8.3 Write integration tests for logout synchronization
    - Test logout from BrokenTrade clears token
    - Test accessing PaperTrading after logout redirects to login
    - Test logout from PaperTrading clears token
    - Test accessing protected routes after logout redirects to login
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 8.4 Write integration tests for error scenarios
    - Test expired token redirects to login with appropriate message
    - Test invalid token redirects to login with appropriate message
    - Test backend unavailable shows error message
    - Test network error shows connection error message
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 8.5 Manual testing checklist execution
    - Verify `npm run dev` starts all four services on correct ports
    - Verify login via BrokenTrade stores token in localStorage
    - Verify "Start Paper Trading" button navigates to PaperTrading
    - Verify PaperTrading loads with authenticated user interface
    - Verify logout from either platform clears token
    - Verify error messages display correctly for all error scenarios
    - Verify no CORS errors in browser console
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1-2.8, 3.1-3.6, 4.1-4.5, 8.1-8.4, 9.1-9.4_

- [ ] 9. Final checkpoint - Ensure all tests pass and system is fully integrated
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- The design document does not include correctness properties, so property-based tests are not applicable
- Testing focuses on integration tests and example-based unit tests
- Manual testing checklist covers all critical user flows and error scenarios
