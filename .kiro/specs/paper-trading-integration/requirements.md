# Requirements Document

## Introduction

This document specifies the requirements for integrating the BrokenTrade.com educational trading platform with the paperTrading algorithmic paper trading feature. The integration will unify the development experience, authentication system, and user navigation between the two previously independent projects.

## Glossary

- **BrokenTrade_Backend**: The Node.js/Express backend server for BrokenTrade.com running on port 5000
- **BrokenTrade_Frontend**: The React/Vite frontend application for BrokenTrade.com running on port 5173
- **PaperTrading_Backend**: The Node.js/Express backend server for paperTrading running on port 5001
- **PaperTrading_Frontend**: The Vue 3/Vite frontend application for paperTrading running on port 5174
- **Root_Dev_Command**: The single `npm run dev` command executed at the workspace root directory
- **Authenticated_Session**: A user session where the user has successfully logged in through BrokenTrade.com
- **Session_Token**: A JWT token or session identifier that represents an authenticated user
- **Cross_Origin_Request**: An HTTP request made from one origin (domain:port) to another origin
- **Monorepo_Workspace**: The root directory containing both BrokenTrade.com and paperTrading projects
- **Concurrent_Process_Manager**: A tool or script that runs multiple development servers simultaneously

## Requirements

### Requirement 1: Unified Development Environment

**User Story:** As a developer, I want to start all services with a single command, so that I can quickly begin development without managing multiple terminal windows.

#### Acceptance Criteria

1. WHEN the developer executes the Root_Dev_Command, THE Monorepo_Workspace SHALL start the BrokenTrade_Backend on port 5000
2. WHEN the developer executes the Root_Dev_Command, THE Monorepo_Workspace SHALL start the BrokenTrade_Frontend on port 5173
3. WHEN the developer executes the Root_Dev_Command, THE Monorepo_Workspace SHALL start the PaperTrading_Backend on port 5001
4. WHEN the developer executes the Root_Dev_Command, THE Monorepo_Workspace SHALL start the PaperTrading_Frontend on port 5174
5. WHEN any of the four services fail to start, THE Monorepo_Workspace SHALL display an error message indicating which service failed
6. WHEN the developer terminates the Root_Dev_Command, THE Monorepo_Workspace SHALL stop all four running services

### Requirement 2: Shared Authentication System

**User Story:** As a user, I want to log in once through BrokenTrade.com and access paperTrading without logging in again, so that I have a seamless experience across both platforms.

#### Acceptance Criteria

1. WHEN a user successfully logs in through BrokenTrade_Frontend, THE BrokenTrade_Backend SHALL create an Authenticated_Session
2. WHEN an Authenticated_Session is created, THE BrokenTrade_Backend SHALL generate a Session_Token
3. WHEN a Session_Token is generated, THE BrokenTrade_Frontend SHALL store the Session_Token in browser storage
4. WHEN the user navigates to PaperTrading_Frontend, THE PaperTrading_Frontend SHALL retrieve the Session_Token from browser storage
5. WHEN PaperTrading_Frontend makes a Cross_Origin_Request to PaperTrading_Backend, THE PaperTrading_Frontend SHALL include the Session_Token in the request
6. WHEN PaperTrading_Backend receives a Session_Token, THE PaperTrading_Backend SHALL validate the Session_Token against the shared authentication database
7. IF the Session_Token is invalid or expired, THEN THE PaperTrading_Backend SHALL return an authentication error with status code 401
8. WHEN the Session_Token is valid, THE PaperTrading_Backend SHALL authorize the request and return the requested data

### Requirement 3: Cross-Origin Resource Sharing Configuration

**User Story:** As a developer, I want both backends to accept requests from both frontends, so that the integrated system can communicate across different ports.

#### Acceptance Criteria

1. THE BrokenTrade_Backend SHALL accept Cross_Origin_Request from http://localhost:5173
2. THE BrokenTrade_Backend SHALL accept Cross_Origin_Request from http://localhost:5174
3. THE PaperTrading_Backend SHALL accept Cross_Origin_Request from http://localhost:5173
4. THE PaperTrading_Backend SHALL accept Cross_Origin_Request from http://localhost:5174
5. WHEN a Cross_Origin_Request includes credentials, THE BrokenTrade_Backend SHALL allow credentials in the response
6. WHEN a Cross_Origin_Request includes credentials, THE PaperTrading_Backend SHALL allow credentials in the response

### Requirement 4: Navigation Integration

**User Story:** As a user, I want to navigate from BrokenTrade.com to paperTrading through a button, so that I can easily access the paper trading feature.

#### Acceptance Criteria

1. THE BrokenTrade_Frontend SHALL display a "Start Paper Trading" button on the homepage
2. WHEN the user clicks the "Start Paper Trading" button, THE BrokenTrade_Frontend SHALL navigate to http://localhost:5174
3. WHEN the user is not authenticated and clicks the "Start Paper Trading" button, THE BrokenTrade_Frontend SHALL display a login prompt
4. WHEN the user navigates to PaperTrading_Frontend with a valid Session_Token, THE PaperTrading_Frontend SHALL display the authenticated user interface
5. WHEN the user navigates to PaperTrading_Frontend without a valid Session_Token, THE PaperTrading_Frontend SHALL redirect to the BrokenTrade.com login page

### Requirement 5: Authentication Token Format Standardization

**User Story:** As a developer, I want both systems to use the same token format and validation logic, so that authentication works seamlessly across both platforms.

#### Acceptance Criteria

1. THE BrokenTrade_Backend SHALL generate Session_Token using JWT format
2. THE Session_Token SHALL include user identifier, email, and expiration timestamp
3. THE Session_Token SHALL expire after 24 hours from creation
4. THE PaperTrading_Backend SHALL validate Session_Token using the same JWT secret as BrokenTrade_Backend
5. WHEN validating a Session_Token, THE PaperTrading_Backend SHALL verify the token signature matches the shared JWT secret
6. WHEN validating a Session_Token, THE PaperTrading_Backend SHALL verify the token has not expired
7. IF the Session_Token signature is invalid, THEN THE PaperTrading_Backend SHALL return an authentication error with code "INVALID_TOKEN"
8. IF the Session_Token has expired, THEN THE PaperTrading_Backend SHALL return an authentication error with code "TOKEN_EXPIRED"

### Requirement 6: Shared User Database

**User Story:** As a system administrator, I want both applications to use the same MongoDB database for user data, so that user accounts are consistent across both platforms.

#### Acceptance Criteria

1. THE BrokenTrade_Backend SHALL connect to a MongoDB database using a connection string from environment configuration
2. THE PaperTrading_Backend SHALL connect to the same MongoDB database as BrokenTrade_Backend
3. WHEN a user registers through BrokenTrade_Frontend, THE BrokenTrade_Backend SHALL create a user record in the shared database
4. WHEN PaperTrading_Backend validates a Session_Token, THE PaperTrading_Backend SHALL query the shared database for user information
5. WHEN a user updates their profile through BrokenTrade_Frontend, THE changes SHALL be visible to PaperTrading_Backend immediately

### Requirement 7: Development Environment Configuration

**User Story:** As a developer, I want environment variables to be properly configured for both projects, so that the integration works correctly in development mode.

#### Acceptance Criteria

1. THE Monorepo_Workspace SHALL provide a root-level environment configuration file
2. THE root-level environment configuration SHALL specify the MongoDB connection string
3. THE root-level environment configuration SHALL specify the shared JWT secret
4. THE root-level environment configuration SHALL specify all four service ports (5000, 5173, 5001, 5174)
5. WHEN the Root_Dev_Command starts, THE Monorepo_Workspace SHALL load environment variables from the root configuration
6. WHEN the Root_Dev_Command starts, THE Monorepo_Workspace SHALL pass environment variables to all four services

### Requirement 8: Logout Synchronization

**User Story:** As a user, I want to be logged out of both systems when I log out from either platform, so that my session is properly terminated everywhere.

#### Acceptance Criteria

1. WHEN a user logs out from BrokenTrade_Frontend, THE BrokenTrade_Frontend SHALL remove the Session_Token from browser storage
2. WHEN a user logs out from PaperTrading_Frontend, THE PaperTrading_Frontend SHALL remove the Session_Token from browser storage
3. WHEN the Session_Token is removed, THE user SHALL be logged out of both BrokenTrade_Frontend and PaperTrading_Frontend
4. WHEN a logged-out user attempts to access protected routes in PaperTrading_Frontend, THE PaperTrading_Frontend SHALL redirect to the BrokenTrade.com login page

### Requirement 9: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages when authentication fails, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN authentication fails due to an invalid Session_Token, THE PaperTrading_Frontend SHALL display an error message "Your session has expired. Please log in again."
2. WHEN authentication fails due to network errors, THE PaperTrading_Frontend SHALL display an error message "Unable to connect to the server. Please check your connection."
3. WHEN the user is redirected to login due to missing authentication, THE BrokenTrade_Frontend SHALL display a message "Please log in to access Paper Trading."
4. WHEN authentication succeeds after a failure, THE PaperTrading_Frontend SHALL clear all error messages

### Requirement 10: Integrated Dependency

**User Story:** As a developer, I want both projects to be fully integrated and dependent on each other, so that the system functions as a unified platform.

#### Acceptance Criteria

1. THE paperTrading project SHALL NOT function independently without BrokenTrade.com authentication
2. THE paperTrading SHALL require a valid Session_Token from BrokenTrade.com to access any protected routes
3. WHEN paperTrading is accessed without BrokenTrade.com running, THE PaperTrading_Frontend SHALL display an error message "Main platform is not available"
4. THE Root_Dev_Command SHALL be the primary method for starting the integrated system
5. THE system SHALL be designed as a unified platform where paperTrading is a feature module of BrokenTrade.com
