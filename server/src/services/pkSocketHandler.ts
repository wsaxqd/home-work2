import { Server as SocketServer } from 'socket.io'
import { logger } from '../utils/logger'

export function setupPKHandlers(io: SocketServer) {
  io.on('connection', (socket: any) => {
    socket.on('pk:join_room', (roomId: string) => {
      socket.join(`pk:${roomId}`)
      logger.info(`User ${socket.userId} joined PK room ${roomId}`)
    })

    socket.on('pk:leave_room', (roomId: string) => {
      socket.leave(`pk:${roomId}`)
      logger.info(`User ${socket.userId} left PK room ${roomId}`)
    })

    socket.on('pk:answer', (data: { roomId: string; questionNumber: number; answer: string }) => {
      io.to(`pk:${data.roomId}`).emit('pk:opponent_answered', {
        userId: socket.userId,
        questionNumber: data.questionNumber
      })
    })
  })
}

export function notifyPKRoomUpdate(io: SocketServer, roomId: string, data: any) {
  io.to(`pk:${roomId}`).emit('pk:room_update', data)
}

export function notifyPKGameStart(io: SocketServer, roomId: string, questions: any[]) {
  io.to(`pk:${roomId}`).emit('pk:game_start', { questions })
}

export function notifyPKGameEnd(io: SocketServer, roomId: string, result: any) {
  io.to(`pk:${roomId}`).emit('pk:game_end', result)
}
