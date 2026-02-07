import { Layout, Header } from '../components/layout'
import './About.css'

export default function About() {
  return (
    <Layout>
      <Header
        title="关于我们"
        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        showBack={true}
      />

      <div className="main-content about-page">
        {/* 应用介绍 */}
        <div className="about-section">
          <div className="app-logo">🌟</div>
          <h1 className="app-name">启蒙之光</h1>
          <p className="app-version">版本 1.0.0</p>
          <p className="app-slogan">让每个孩子都能享受优质的AI教育</p>
        </div>

        {/* 应用简介 */}
        <div className="intro-section">
          <h3 className="section-title">应用简介</h3>
          <p className="intro-text">
            启蒙之光是一款专为6-12岁儿童设计的AI教育平台。我们致力于通过人工智能技术,为孩子们提供个性化、趣味化的学习体验,激发他们的学习兴趣,培养良好的学习习惯。
          </p>
          <p className="intro-text">
            平台集成了AI作业助手、智能学习地图、创作工具、益智游戏等多种功能,全方位支持孩子的学习成长。同时,我们也为家长提供了完善的监控和管理功能,让家长能够更好地了解和陪伴孩子的成长。
          </p>
        </div>

        {/* 核心功能 */}
        <div className="features-section">
          <h3 className="section-title">核心功能</h3>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <div className="feature-name">AI作业助手</div>
              <div className="feature-desc">智能辅导,详细解题</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🗺️</div>
              <div className="feature-name">学习地图</div>
              <div className="feature-desc">个性化学习路径</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <div className="feature-name">AI创作</div>
              <div className="feature-desc">激发创造力</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎮</div>
              <div className="feature-name">益智游戏</div>
              <div className="feature-desc">寓教于乐</div>
            </div>
          </div>
        </div>

        {/* 开发团队 */}
        <div className="team-section">
          <h3 className="section-title">开发团队</h3>
          <p className="team-text">
            我们是一支充满激情的教育科技团队,致力于用技术改变教育,让每个孩子都能享受到优质的教育资源。
          </p>
        </div>

        {/* 联系方式 */}
        <div className="contact-section">
          <h3 className="section-title">联系我们</h3>
          <div className="contact-item">
            <span className="contact-label">官方网站:</span>
            <span className="contact-value">www.qmzg.com</span>
          </div>
          <div className="contact-item">
            <span className="contact-label">客服邮箱:</span>
            <span className="contact-value">support@qmzg.com</span>
          </div>
          <div className="contact-item">
            <span className="contact-label">客服电话:</span>
            <span className="contact-value">400-123-4567</span>
          </div>
        </div>

        {/* 版权信息 */}
        <div className="copyright-section">
          <p className="copyright-text">© 2026 启蒙之光 版权所有</p>
          <p className="copyright-text">All Rights Reserved</p>
        </div>
      </div>
    </Layout>
  )
}
