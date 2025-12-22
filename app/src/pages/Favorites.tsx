import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'

export default function Favorites() {
  const navigate = useNavigate()

  return (
    <Layout>
      <Header title="我的收藏" gradient="linear-gradient(135deg, #fdcb6e 0%, #ffeaa7 100%)" />
      <div className="main-content">
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#718096'
        }}>
          <div style={{ fontSize: '80px', marginBottom: '24px' }}>❤️</div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#2d3748', marginBottom: '12px' }}>
            我的收藏
          </h2>
          <p style={{ fontSize: '16px', marginBottom: '32px', lineHeight: '1.6' }}>
            这里将展示你收藏的所有作品<br />
            喜欢的作品都会保存在这里
          </p>
          <button
            onClick={() => navigate('/home')}
            style={{
              background: 'linear-gradient(135deg, #fdcb6e 0%, #ffeaa7 100%)',
              color: '#2d3748',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(253, 203, 110, 0.35)'
            }}
          >
            返回首页 →
          </button>
        </div>
      </div>
    </Layout>
  )
}
