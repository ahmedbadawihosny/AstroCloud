import { INestApplication, Injectable } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

@Injectable()
export class SwaggerService {
  setupSwagger(app: INestApplication): void {
    const config = new DocumentBuilder()
      .setTitle('File Sharing API')
      .setDescription('API Gateway for the file-sharing app')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }
}
