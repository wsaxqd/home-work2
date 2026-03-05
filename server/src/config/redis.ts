import Redis from 'ioredis'
import { logger } from '../utils/logger'

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  maxRetriesPerRequest: 3
}

export const redis = new Redis(redisConfig)

redis.on('connect', () => {
  logger.info('Redis connected successfully')
})

redis.on('error', (err) => {
  logger.error('Redis connection error:', err)
})

export default redis
