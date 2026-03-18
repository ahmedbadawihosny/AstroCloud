/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import expressBasicAuth from 'express-basic-auth';

@Injectable()
export class SwaggerService {
  createSwaggerDocument(app: INestApplication) {
    const isProduction = process.env.NODE_ENV === 'production';
    const swaggerUser = process.env.SWAGGER_USER?.trim();
    const swaggerPassword = process.env.SWAGGER_PASSWORD?.trim();
    const localServer =
      process.env.SWAGGER_SERVER_LOCAL || `http://localhost:${process.env.PORT ?? 4000}`;
    const productionServer =
      process.env.SWAGGER_SERVER_PRODUCTION || 'http://localhost:4000';
    if (!productionServer) {
      throw new Error('SWAGGER_SERVER_PRODUCTION is not set');
    }
    if (isProduction && (!swaggerUser || !swaggerPassword)) {
      throw new Error('SWAGGER_USER and SWAGGER_PASSWORD are required in production');
    }

    let swaggerConfig = new DocumentBuilder()
      .setTitle('File Sharing Platform API Gateway')
      .setDescription(
        'API Gateway for File Sharing Platform microservices platform. ' +
        'This gateway provides a single entry point for all microservices, handling authentication, ' +
        'routing, and request proxying. The platform includes authentication, file sharing services, ',
      )
      .setVersion('1.0.0')
      .setContact(
        'File Sharing Platform API',
        'https://file-sharing-platform.io',
        'file-sharing-platform@gmail.com',
      )
      .setLicense('CC-BY-4.0', 'https://creativecommons.org/licenses/by/4.0/')
      .addTag('Gateway', 'API Gateway')
      .addTag('Authentication', 'User authentication and session management')
      .addTag('Account', 'User account and profile operations')
      .addTag('Files', 'File upload, download, and management')
      .addTag('Sharing', 'File sharing and link management')
      .addTag('Notifications', 'Real-time notifications and alerts')
      // Cookie-based authentication (primary method)
      .addApiKey(
        {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description:
            'JWT access token stored in HTTP-only cookie. Set automatically after login.',
        },
        'cookie',
      )
      // Bearer token authentication (alternative)
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'JWT access token (alternative to cookie-based auth). Use Authorization: Bearer <token> header.',
        },
        'bearer',
      );

    // Register servers: in production, put production server first so it becomes default in Swagger UI
    if (isProduction) {
      swaggerConfig = swaggerConfig
        .addServer(productionServer, 'Production Server')
        .addServer(localServer, 'Local Development Server');
    } else {
      swaggerConfig = swaggerConfig
        .addServer(localServer, 'Local Development Server')
        .addServer(productionServer, 'Production Server');
    }

    // Add basic auth for production Swagger UI protection
    if (swaggerUser && swaggerPassword) {
      swaggerConfig.addBasicAuth(
        {
          type: 'http',
          scheme: 'basic',
          description: 'Basic authentication for Swagger UI access',
        },
        'basic',
      );
    }

    return swaggerConfig.build();
  }

  setupSwagger(app: INestApplication) {
    const config = this.createSwaggerDocument(app);
    const document = SwaggerModule.createDocument(app, config);
    const swaggerUser = process.env.SWAGGER_USER?.trim();
    const swaggerPassword = process.env.SWAGGER_PASSWORD?.trim();

    // Swagger UI options
    const swaggerOptions: any = {
      customSiteTitle: 'File Sharing API Gateway Documentation',
      customfavIcon: '/favicon.ico',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        requestInterceptor: (request: any) => {
          request.credentials = 'include';
          return request;
        },
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        docExpansion: 'list',
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
      },
    };

    // Add basic auth middleware for production
    if (swaggerUser && swaggerPassword) {
      app.use(
        '/api-docs',
        expressBasicAuth({
          users: {
            [swaggerUser]: swaggerPassword,
          },
          challenge: true,
          realm: 'File Sharing API Gateway',
        }),
      );
    }

    SwaggerModule.setup('api-docs', app, document, swaggerOptions);

    const isProduction = process.env.NODE_ENV === 'production';
    const localServer =
      process.env.SWAGGER_SERVER_LOCAL || `http://localhost:${process.env.PORT ?? 4000}`;
    const productionServer =
      process.env.SWAGGER_SERVER_PRODUCTION || 'http://localhost:4000';
    if (!productionServer) {
      throw new Error('SWAGGER_SERVER_PRODUCTION is not set');
    }

    const swaggerBaseUrl = isProduction
      ? `${productionServer}/api-docs`
      : `${localServer}/api-docs`;

    // eslint-disable-next-line no-console
    console.log(`📚 Swagger docs available at ${swaggerBaseUrl}`);
    if (swaggerUser && swaggerPassword) {
      // eslint-disable-next-line no-console
      console.log(`🔐 Swagger UI protected with basic authentication`);
    }
  }
}