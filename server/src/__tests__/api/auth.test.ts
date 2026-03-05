import request from 'supertest'
import express from 'express'
import authRoutes from '../../routes/auth'

const app = express()
app.use(express.json())
app.use('/api/auth', authRoutes)

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should return 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ password: '123456' })

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/auth/login', () => {
    it('should return 400 when credentials are missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({})

      expect(res.status).toBe(400)
    })
  })
})
