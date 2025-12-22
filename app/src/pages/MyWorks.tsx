import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'

export default function MyWorks() {
  const navigate = useNavigate()

  return (
    <Layout>
      <Header title="我的作品" gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" />
      <div className="main-content">
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#718096'
        }}>
          <div style={{ fontSize: '80px', marginBottom: '24px' }}>📁</div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#2d3748', marginBottom: '12px' }}>
            我的作品
          </h2>
          <p style={{ fontSize: '16px', marginBottom: '32px', lineHeight: '1.6' }}>
            这里将展示你用AI创作的所有作品<br />
            包括绘画、音乐、故事和诗词
          </p>
          <button
            onClick={() => navigate('/create')}
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(240, 147, 251, 0.35)'
            }}
          >
            去创作 →
          </button>
        </div>
      </div>
    </Layout>
  )
}
