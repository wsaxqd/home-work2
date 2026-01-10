import './Loading.css'

interface LoadingProps {
  size?: 'small' | 'medium' | 'large'
  text?: string
  fullScreen?: boolean
  color?: string
}

export default function Loading({
  size = 'medium',
  text = '加载中...',
  fullScreen = false,
  color = '#667eea'
}: LoadingProps) {
  const sizeMap = {
    small: '30px',
    medium: '50px',
    large: '70px'
  }

  const containerClass = fullScreen ? 'loading-container fullscreen' : 'loading-container'

  return (
    <div className={containerClass}>
      <div className="loading-content">
        <div
          className="loading-spinner"
          style={{
            width: sizeMap[size],
            height: sizeMap[size],
            borderTopColor: color
          }}
        />
        {text && <div className="loading-text">{text}</div>}
      </div>
    </div>
  )
}
