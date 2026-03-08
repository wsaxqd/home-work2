import { Server as SocketServer, Socket } from 'socket.io'
import { Server as HttpServer } from 'http'
import { logger } from '../utils/logger'
import jwt from 'jsonwebtoken'

interface AuthSocket extends Socket {
  userId?: string
  userInfo?: any
}

export class SocketService {
  private io: SocketServer
  private userSockets: Map<string, string> = new Map()

  constructor(httpServer: HttpServer) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true
      }
    })

    this.setupMiddleware()
    this.setupEventHandlers()
  }

  private setupMiddleware() {
    this.io.use((socket: any, next) => {
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new Error('Authentication error'))
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
        socket.userId = decoded.userId
        socket.userInfo = decoded
        next()
      } catch (err) {
        next(new Error('Authentication error'))
      }
    })
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: any) => {
      logger.info(`User connected: ${socket.userId}`)
      this.userSockets.set(socket.userId, socket.id)

      socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.userId}`)
        this.userSockets.delete(socket.userId)
      })
    })
  }

  emitToUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId)
    if (socketId) {
      this.io.to(socketId).emit(event, data)
    }
  }

  emitToRoom(room: string, event: string, data: any) {
    this.io.to(room).emit(event, data)
  }

  getIO() {
    return this.io
  }
}

export let socketService: SocketService

export function initSocketService(httpServer: HttpServer) {
  socketService = new SocketService(httpServer)
  return socketService
}
