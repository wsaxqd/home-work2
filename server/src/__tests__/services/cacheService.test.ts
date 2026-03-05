import { cacheService } from '../../services/cacheService'
import redis from '../../config/redis'

jest.mock('../../config/redis')

describe('CacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('get', () => {
    it('should return parsed data when cache exists', async () => {
      const mockData = { id: 1, name: 'test' }
      ;(redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockData))

      const result = await cacheService.get('test-key')

      expect(result).toEqual(mockData)
      expect(redis.get).toHaveBeenCalledWith('test-key')
    })

    it('should return null when cache does not exist', async () => {
      ;(redis.get as jest.Mock).mockResolvedValue(null)

      const result = await cacheService.get('test-key')

      expect(result).toBeNull()
    })
  })

  describe('set', () => {
    it('should set cache with TTL', async () => {
      const data = { id: 1, name: 'test' }
      ;(redis.setex as jest.Mock).mockResolvedValue('OK')

      await cacheService.set('test-key', data, 300)

      expect(redis.setex).toHaveBeenCalledWith('test-key', 300, JSON.stringify(data))
    })
  })

  describe('del', () => {
    it('should delete cache key', async () => {
      ;(redis.del as jest.Mock).mockResolvedValue(1)

      await cacheService.del('test-key')

      expect(redis.del).toHaveBeenCalledWith('test-key')
    })
  })
})
