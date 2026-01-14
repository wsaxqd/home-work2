import { useState, useEffect, useRef } from 'react'
import { Layout, Header } from '../components/layout'
import { UsageTracker } from '../services/usageTracking'
import './JigsawPuzzle.css'

interface Piece {
  id: number
  currentPosition: number
  correctPosition: number
}

const images = [
  { id: 1, emoji: '🌈', name: '彩虹', color: '#ff6b6b' },
  { id: 2, emoji: '🦄', name: '独角兽', color: '#4ecdc4' },
  { id: 3, emoji: '🌸', name: '樱花', color: '#ff6b9d' },
  { id: 4, emoji: '🎨', name: '调色板', color: '#95e1d3' },
  { id: 5, emoji: '🎪', name: '马戏团', color: '#f38181' },
]

export default function JigsawPuzzle() {
  const [pieces, setPieces] = useState<Piece[]>([])
  const [selectedImage, setSelectedImage] = useState(images[0])
  const [moves, setMoves] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSolved, setIsSolved] = useState(false)
  const [showImageSelect, setShowImageSelect] = useState(true)
  const usageTrackerRef = useRef<UsageTracker | null>(null)

  // 组件卸载时清理追踪器
  useEffect(() => {
    return () => {
      if (usageTrackerRef.current) {
        usageTrackerRef.current.cancel()
      }
    }
  }, [])

  // 初始化拼图
  const initPuzzle = (image: typeof images[0]) => {
    setSelectedImage(image)
    const newPieces: Piece[] = Array.from({ length: 9 }, (_, i) => ({
      id: i,
      currentPosition: i,
      correctPosition: i,
    }))

    // 打乱拼图
    const shuffled = [...newPieces]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i].currentPosition, shuffled[j].currentPosition] = [
        shuffled[j].currentPosition,
        shuffled[i].currentPosition,
      ]
    }

    setPieces(shuffled)
    setMoves(0)
    setIsPlaying(true)
    setIsSolved(false)
    setShowImageSelect(false)

    // 启动使用追踪
    usageTrackerRef.current = new UsageTracker('游戏', '拼图游戏', {
      imageName: image.name
    })
    usageTrackerRef.current.start()
  }

  // 检查是否完成
  const checkSolved = (currentPieces: Piece[]): boolean => {
    return currentPieces.every(piece => piece.currentPosition === piece.correctPosition)
  }

  // 交换拼图块
  const swapPieces = (index1: number, index2: number) => {
    if (!isPlaying || isSolved) return

    const newPieces = [...pieces]
    const piece1 = newPieces.find(p => p.currentPosition === index1)
    const piece2 = newPieces.find(p => p.currentPosition === index2)

    if (piece1 && piece2) {
      ;[piece1.currentPosition, piece2.currentPosition] = [
        piece2.currentPosition,
        piece1.currentPosition,
      ]

      setPieces(newPieces)
      setMoves(moves + 1)

      if (checkSolved(newPieces)) {
        setIsSolved(true)
        setIsPlaying(false)

        // 记录使用数据
        if (usageTrackerRef.current) {
          const finalMoves = moves + 1
          const score = Math.max(0, 100 - finalMoves * 2)
          usageTrackerRef.current.end(score, {
            moves: finalMoves,
            imageName: selectedImage.name,
            success: true
          })
          usageTrackerRef.current = null
        }
      }
    }
  }

  const [selectedPiece, setSelectedPiece] = useState<number | null>(null)

  const handlePieceClick = (position: number) => {
    if (!isPlaying || isSolved) return

    if (selectedPiece === null) {
      setSelectedPiece(position)
    } else {
      swapPieces(selectedPiece, position)
      setSelectedPiece(null)
    }
  }

  const handleBackToSelect = () => {
    setShowImageSelect(true)
    setIsPlaying(false)
    setIsSolved(false)
    setPieces([])
  }

  return (
    <Layout>
      <Header
        title="拼图游戏"
        gradient="linear-gradient(135deg, #81fbb8 0%, #28c76f 100%)"
        showBack={true}
      />
      <div className="main-content">
        {showImageSelect ? (
          <div className="image-select">
            <div className="select-title">选择一个图案开始拼图</div>
            <div className="images-grid">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="image-option"
                  style={{ backgroundColor: image.color }}
                  onClick={() => initPuzzle(image)}
                >
                  <div className="image-emoji">{image.emoji}</div>
                  <div className="image-name">{image.name}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="puzzle-header">
              <div className="header-info">
                <div className="current-image" style={{ backgroundColor: selectedImage.color }}>
                  <span>{selectedImage.emoji}</span>
                </div>
                <div className="header-text">
                  <div className="image-title">{selectedImage.name}</div>
                  <div className="moves-count">步数: {moves}</div>
                </div>
              </div>
              <button className="change-image-btn" onClick={handleBackToSelect}>
                换图
              </button>
            </div>

            <div className="jigsaw-board">
              {Array.from({ length: 9 }).map((_, position) => {
                const piece = pieces.find(p => p.currentPosition === position)
                if (!piece) return null

                const row = Math.floor(piece.id / 3)
                const col = piece.id % 3

                return (
                  <div
                    key={position}
                    className={`jigsaw-piece ${selectedPiece === position ? 'selected' : ''}`}
                    style={{
                      backgroundColor: selectedImage.color,
                    }}
                    onClick={() => handlePieceClick(position)}
                  >
                    <div
                      className="piece-content"
                      style={{
                        fontSize: '48px',
                        transform: `translate(${-col * 100}%, ${-row * 100}%)`,
                      }}
                    >
                      {selectedImage.emoji}
                    </div>
                    <div className="piece-number">{piece.id + 1}</div>
                  </div>
                )
              })}
            </div>

            {isSolved && (
              <div className="success-message">
                <div className="success-title">🎉 拼图完成!</div>
                <div className="success-moves">用了 {moves} 步</div>
                <button className="play-again-button" onClick={handleBackToSelect}>
                  选择新图案
                </button>
              </div>
            )}

            <div className="game-tips">
              <div className="tips-title">💡 游戏说明</div>
              <div className="tips-content">
                点击两个拼图块交换位置，将图案拼完整即可获胜！
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
