import { useState, useEffect, useRef } from 'react'
import './VoiceInput.css'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  onError?: (error: string) => void
  placeholder?: string
}

export default function VoiceInput({ onTranscript, onError, placeholder = '点击麦克风开始语音输入' }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(true)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // 检查浏览器是否支持Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setIsSupported(false)
      onError?.('您的浏览器不支持语音识别功能')
      return
    }

    // 初始化语音识别
    const recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN' // 设置为中文
    recognition.continuous = false // 单次识别
    recognition.interimResults = true // 显示中间结果

    recognition.onstart = () => {
      setIsListening(true)
      setTranscript('')
    }

    recognition.onresult = (event: any) => {
      let currentTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          currentTranscript += result[0].transcript
        } else {
          currentTranscript += result[0].transcript
        }
      }
      setTranscript(currentTranscript)
    }

    recognition.onend = () => {
      setIsListening(false)
      if (transcript) {
        onTranscript(transcript)
        setTranscript('')
      }
    }

    recognition.onerror = (event: any) => {
      setIsListening(false)
      console.error('语音识别错误:', event.error)

      let errorMessage = '语音识别失败'
      switch (event.error) {
        case 'no-speech':
          errorMessage = '未检测到语音，请重试'
          break
        case 'audio-capture':
          errorMessage = '无法访问麦克风，请检查权限'
          break
        case 'not-allowed':
          errorMessage = '麦克风权限被拒绝'
          break
        case 'network':
          errorMessage = '网络错误，请检查连接'
          break
        default:
          errorMessage = `语音识别错误: ${event.error}`
      }
      onError?.(errorMessage)
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [transcript])

  const toggleListening = () => {
    if (!isSupported) {
      onError?.('您的浏览器不支持语音识别功能')
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
    } else {
      recognitionRef.current?.start()
    }
  }

  if (!isSupported) {
    return (
      <div className="voice-input-unsupported">
        <span className="voice-icon">🎤</span>
        <span className="voice-text">浏览器不支持语音输入</span>
      </div>
    )
  }

  return (
    <div className="voice-input-container">
      <button
        className={`voice-input-btn ${isListening ? 'listening' : ''}`}
        onClick={toggleListening}
        aria-label={isListening ? '停止录音' : '开始语音输入'}
        title={isListening ? '点击停止' : placeholder}
      >
        {isListening ? (
          <>
            <span className="voice-icon recording">🎤</span>
            <span className="voice-wave">
              <span className="wave-bar"></span>
              <span className="wave-bar"></span>
              <span className="wave-bar"></span>
            </span>
          </>
        ) : (
          <span className="voice-icon">🎤</span>
        )}
      </button>

      {transcript && (
        <div className="voice-transcript">
          <span className="transcript-icon">💬</span>
          <span className="transcript-text">{transcript}</span>
        </div>
      )}
    </div>
  )
}
