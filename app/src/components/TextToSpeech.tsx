import { useState, useEffect, useRef } from 'react'
import './TextToSpeech.css'

interface TextToSpeechProps {
  text: string
  autoPlay?: boolean
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: string) => void
}

export default function TextToSpeech({
  text,
  autoPlay = false,
  onStart,
  onEnd,
  onError
}: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    // 检查浏览器是否支持语音合成
    if (!('speechSynthesis' in window)) {
      setIsSupported(false)
      onError?.('您的浏览器不支持语音播报功能')
      return
    }

    // 创建语音合成实例
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN' // 设置为中文
    utterance.rate = 0.9 // 语速（0.1-10，默认1）
    utterance.pitch = 1 // 音调（0-2，默认1）
    utterance.volume = 1 // 音量（0-1，默认1）

    utterance.onstart = () => {
      setIsPlaying(true)
      setIsPaused(false)
      onStart?.()
    }

    utterance.onend = () => {
      setIsPlaying(false)
      setIsPaused(false)
      onEnd?.()
    }

    utterance.onerror = (event) => {
      console.error('语音播报错误:', event)
      setIsPlaying(false)
      setIsPaused(false)
      onError?.('语音播报失败，请重试')
    }

    utteranceRef.current = utterance

    // 自动播放
    if (autoPlay && text) {
      window.speechSynthesis.speak(utterance)
    }

    return () => {
      // 清理：停止播放
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel()
      }
    }
  }, [text])

  const handlePlay = () => {
    if (!isSupported || !utteranceRef.current) return

    if (isPaused) {
      // 继续播放
      window.speechSynthesis.resume()
      setIsPaused(false)
      setIsPlaying(true)
    } else {
      // 开始播放
      window.speechSynthesis.cancel() // 先取消之前的播放
      window.speechSynthesis.speak(utteranceRef.current)
    }
  }

  const handlePause = () => {
    if (!isSupported) return

    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause()
      setIsPaused(true)
      setIsPlaying(false)
    }
  }

  const handleStop = () => {
    if (!isSupported) return

    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
  }

  if (!isSupported) {
    return (
      <div className="tts-unsupported">
        <span className="tts-icon">🔇</span>
        <span className="tts-text">浏览器不支持语音播报</span>
      </div>
    )
  }

  return (
    <div className="tts-container">
      {!isPlaying && !isPaused && (
        <button
          className="tts-btn tts-play"
          onClick={handlePlay}
          aria-label="播放"
          title="播放语音"
        >
          <span className="tts-icon">🔊</span>
          <span className="tts-label">播放</span>
        </button>
      )}

      {isPlaying && (
        <button
          className="tts-btn tts-pause"
          onClick={handlePause}
          aria-label="暂停"
          title="暂停播放"
        >
          <span className="tts-icon">⏸️</span>
          <span className="tts-label">暂停</span>
        </button>
      )}

      {isPaused && (
        <button
          className="tts-btn tts-resume"
          onClick={handlePlay}
          aria-label="继续"
          title="继续播放"
        >
          <span className="tts-icon">▶️</span>
          <span className="tts-label">继续</span>
        </button>
      )}

      {(isPlaying || isPaused) && (
        <button
          className="tts-btn tts-stop"
          onClick={handleStop}
          aria-label="停止"
          title="停止播放"
        >
          <span className="tts-icon">⏹️</span>
          <span className="tts-label">停止</span>
        </button>
      )}
    </div>
  )
}
