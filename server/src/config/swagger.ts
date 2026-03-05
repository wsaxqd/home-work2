import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '启蒙之光 API',
      version: '1.0.0',
      description: '儿童教育平台 API 文档'
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: '开发环境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.ts']
}

export const swaggerSpec = swaggerJsdoc(options)
