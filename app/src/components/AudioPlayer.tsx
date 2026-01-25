import { useState, useRef, useEffect } from 'react'
import './AudioPlayer.css'

interface AudioPlayerProps {
  title: string
  audioUrl?: string  // 音频URL（实际项目中使用）
  description?: string
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
}

export default function AudioPlayer({
  title,
  audioUrl,
  description,
  onPlay,
  onPause,
  onEnded
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  // 使用TTS API生成音频URL的示例
  const generateTTSAudio = async (text: string): Promise<string> => {
    // 这里可以对接真实的TTS API
    // 例如：讯飞语音、百度TTS、微软Azure TTS等
    // 暂时返回模拟URL
    return `https://example.com/tts?text=${encodeURIComponent(text)}`
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      onEnded?.()
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [onEnded])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      onPause?.()
    } else {
      audio.play()
      setIsPlaying(true)
      onPlay?.()
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const time = parseFloat(e.target.value)
    audio.currentTime = time
    setCurrentTime(time)
  }

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="audio-player">
      <div className="audio-info">
        <div className="audio-title">{title}</div>
        {description && <div className="audio-description">{description}</div>}
      </div>

      <div className="audio-controls">
        <button className="play-button" onClick={togglePlay}>
          {isPlaying ? '⏸️' : '▶️'}
        </button>

        <div className="progress-container">
          <span className="time-label">{formatTime(currentTime)}</span>
          <input
            type="range"
            className="progress-bar"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
          />
          <span className="time-label">{formatTime(duration)}</span>
        </div>
      </div>

      {/* 实际音频元素（隐藏） */}
      <audio
        ref={audioRef}
        src={audioUrl || ''}
        preload="metadata"
      />

      {/* 如果没有音频URL，显示提示 */}
      {!audioUrl && (
        <div className="audio-placeholder">
          <div className="placeholder-icon">🎵</div>
          <div className="placeholder-text">
            音频功能演示
            <br />
            <small>实际项目中可对接TTS语音合成API</small>
          </div>
        </div>
      )}
    </div>
  )
}
