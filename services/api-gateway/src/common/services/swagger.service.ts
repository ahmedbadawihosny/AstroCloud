import { INestApplication, Injectable } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

@Injectable()
export class SwaggerService {
  setupSwagger(app: INestApplication): void {
    const config = new DocumentBuilder()
      .setTitle('File Sharing Platform API')
      .setDescription('API Gateway for File Sharing Platform')
      .setVersion('2.0.0')
      .setContact('API Support Team', 'https://your-platform.com/support', 'api-support@your-platform.com')
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .addServer('http://localhost:3000', 'Local Development')
      .addServer('https://api-gateway-production-672e.up.railway.app', 'Production')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token (obtained from /auth/login)',
          name: 'Authorization',
          in: 'header',
        },
        'jwt-auth',
      )
      .addTag('Health', 'System health and status checks')
      .addTag('Authentication', 'User authentication and session management')
      .addTag('Account', 'User account and profile operations')
      .addTag('Files', 'File upload, download, and management')
      .addTag('Sharing', 'File sharing and link management')
      .addTag('Notifications', 'Real-time notifications and alerts')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        docExpansion: 'none',
        deepLinking: false,
        tagsSorter: 'alpha',
        operationsSorter: 'method',
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
        defaultModelsExpandDepth: -1,
        defaultModelExpandDepth: 1,
      },
    });

    console.log('Swagger documentation setup completed!');
  }
}
