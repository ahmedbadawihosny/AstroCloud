# App Service - Unified File Sharing Application

This is the unified app service that combines authentication, file management, and notifications into a single NestJS application with hybrid HTTP + NATS communication.

## 🏗️ Architecture Overview

### **Hybrid Communication Pattern**

- **HTTP Layer**: Direct API access for authentication and file operations
- **NATS Layer**: Event-driven communication for notifications and internal messaging
- **JWT Authentication**: Secure token-based authentication for HTTP endpoints

### **Service Components**

- 🔐 **Auth Module**: Complete authentication system with JWT, email verification, password reset
- 📁 **Files Module**: File upload/download, sharing, and metadata management
- 🔔 **Notifications Module**: Event-driven notification handlers
- 👤 **Account Module**: User account management
- 📋 **Waitlist Module**: Waitlist and promotional code management

## 🚀 Quick Start

### **Prerequisites**

- Node.js 18+
- Docker & Docker Compose
- MongoDB
- NATS Server

### **Development Setup**

```bash
# Install dependencies
pnpm install

# Run in development mode (both commands work)
pnpm run start:dev
# or
pnpm run dev

# Run tests
pnpm test

# Build for production
pnpm run build
```

### **Docker Deployment**

```bash
# Build and run with docker-compose
docker-compose up app

# Or build individually
docker build -t file-sharing-app .
docker run file-sharing-app  # NATS microservice only - no port mapping needed
```

## 📡 API Endpoints

### **Authentication (HTTP)**

```
POST /auth/register          - User registration
POST /auth/login             - User login
POST /auth/verify-email      - Email verification
POST /auth/request-reset    - Request password reset
POST /auth/reset-password    - Reset password
GET  /auth/current-user     - Get current user (JWT required)
POST /auth/refresh-token     - Refresh JWT token
POST /auth/logout           - User logout
```

### **Files (HTTP)**

```
POST /files/upload           - Upload file (JWT required)
GET  /files/list             - List user files (JWT required)
GET  /files/:id              - Get file details (JWT required)
DELETE /files/:id            - Delete file (JWT required)
POST /files/:id/share        - Create share link (JWT required)
```

### **Notifications (NATS)**

```
user_created                 - User registration event
file_uploaded                - File upload event
file_deleted                 - File deletion event
file_shared                  - File sharing event
```

## 🔧 Configuration

### **Environment Variables**

```bash
# Application - NATS microservice only (no HTTP server)
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/file_sharing_app

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# NATS
NATS_URL=nats://0.0.0.0:4222

# AWS S3 (for file storage and profile pictures)
AWS_S3_REGION=us-east-1
AWS_S3_ACCESS_KEY_ID=your-access-key
AWS_S3_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
```

### **Configuration Files**

- `tsconfig.json` - TypeScript configuration
- `jest.config.js` - Jest testing configuration
- `Dockerfile` - Docker build configuration

## 🧪 Testing

### **Test Structure**

```
src/
├── auth/
│   ├── auth.controller.spec.ts
│   ├── auth.service.spec.ts
│   └── account/
│       └── account.service.spec.ts
├── files/
│   ├── files.controller.spec.ts
│   └── files.service.spec.ts
└── notifications/
    ├── notifications.controller.spec.ts
    └── notifications.service.spec.ts
```

### **Running Tests**

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:cov

# Run specific test file
pnpm test auth/auth.service.spec.ts
```

### **Test Coverage**

- ✅ Authentication flows (register, login, verification)
- ✅ File operations (upload, download, sharing)
- ✅ Notification event handling
- ✅ Account management
- ✅ Error handling and edge cases

## 🔄 Communication Patterns

### **HTTP Communication**

Used for direct API access where immediate responses are required:

- Authentication operations
- File operations
- Account management

### **NATS Communication**

Used for event-driven and asynchronous operations:

- Notification events
- Internal service communication
- User activity tracking

### **Example Flow**

```
1. Client → HTTP POST /auth/login → App Service
2. App Service → NATS publish user_logged_in → Notifications
3. Notifications → NATS handle user_logged_in → Process event
```

## 🐳 Docker Configuration

### **Multi-stage Build**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
EXPOSE 4222
CMD ["pnpm", "run", "start:prod"]
```

### **Health Check**

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD nc -z nats 4222 || exit 1
```

## 📦 Dependencies

### **Core Dependencies**

- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`
- `@nestjs/microservices`, `@nestjs/mongoose`, `@nestjs/config`
- `@nestjs/jwt`, `@nestjs/axios`, `@nestjs/mapped-types`

### **Utility Libraries**

- `mongoose`, `class-validator`, `class-transformer`
- `uuid`, `bcrypt`, `aws-sdk`, `@aws-sdk/client-s3`
- `helmet`, `cookie-parser`, `morgan`

### **Development Dependencies**

- `@nestjs/testing`, `jest`, `ts-jest`, `eslint`
- `@types/*` packages for TypeScript support

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth with refresh tokens
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: class-validator for request validation
- **CORS Configuration**: Configurable CORS for API access
- **Security Headers**: Helmet middleware for security headers
- **File Upload Security**: File type and size validation

## 📈 Monitoring & Logging

- **Request Logging**: Morgan middleware for HTTP request logging
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Health Endpoints**: Health check endpoints for monitoring
- **Event Logging**: NATS event logging for audit trails

## 🔄 Migration Notes

This service was created by merging three separate microservices:

- `auth-service` → `src/auth/`
- `file-service` → `src/files/`
- `notification-service` → `src/notifications/`

### **Backward Compatibility**

- All NATS message patterns are preserved
- Existing client integrations continue to work
- API contracts remain unchanged

### **Performance Improvements**

- Direct HTTP calls eliminate NATS overhead for auth/files
- Reduced network hops for common operations
- Unified service reduces container overhead

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run `pnpm test` to ensure everything works
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the main project LICENSE file for details.
