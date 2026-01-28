import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import * as skillTreeApi from '../services/api/skillTree'
import './SkillTree.css'

interface SkillNode {
  id: string
  name: string
  description: string
  subject: string
  node_type: 'root' | 'branch' | 'leaf'
  difficulty: number
  points_reward: number
  icon?: string
  position_x?: number
  position_y?: number
}

interface UserProgress {
  node_id: string
  is_unlocked: boolean
  is_completed: boolean
  mastery_percentage: number
  star_rating?: number
}

interface SkillTreeStats {
  total_nodes: number
  unlocked_nodes: number
  completed_nodes: number
  total_points_earned: number
  mastery_percentage: number
  subjects: { subject: string; unlocked: number; completed: number; total: number }[]
}

export default function SkillTree() {
  const navigate = useNavigate()
  const [nodes, setNodes] = useState<SkillNode[]>([])
  const [progress, setProgress] = useState<Map<string, UserProgress>>(new Map())
  const [stats, setStats] = useState<SkillTreeStats | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<string>('数学')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null)

  const subjects = ['数学', '语文', '英语', '科学']

  useEffect(() => {
    fetchData()
  }, [selectedSubject])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [nodesRes, progressRes, statsRes] = await Promise.all([
        skillTreeApi.getSkillNodes(selectedSubject),
        skillTreeApi.getMyProgress(selectedSubject),
        skillTreeApi.getSkillTreeStats()
      ])

      setNodes(nodesRes.data || [])

      const progressMap = new Map()
      if (progressRes.data) {
        progressRes.data.forEach((p: any) => {
          progressMap.set(p.node_id, p)
        })
      }
      setProgress(progressMap)
      setStats(statsRes.data)
    } catch (error) {
      console.error('获取技能树数据失败:', error)
      setNodes([])
    } finally {
      setIsLoading(false)
    }
  }

  const unlockNode = async (nodeId: string) => {
    try {
      await skillTreeApi.unlockNode(nodeId)
      fetchData()
      setSelectedNode(null)
    } catch (error: any) {
      alert(error.response?.data?.message || '解锁失败')
    }
  }

  const getNodeStatus = (node: SkillNode) => {
    const p = progress.get(node.id)
    if (!p) return 'locked'
    if (p.is_completed) return 'completed'
    if (p.is_unlocked) return 'unlocked'
    return 'locked'
  }

  const getNodeColor = (node: SkillNode) => {
    const status = getNodeStatus(node)
    if (status === 'completed') return '#4CAF50'
    if (status === 'unlocked') return '#2196F3'
    return '#9E9E9E'
  }

  const getNodeIcon = (node: SkillNode) => {
    if (node.icon) return node.icon
    const status = getNodeStatus(node)
    if (status === 'completed') return '✓'
    if (status === 'unlocked') return '○'
    return '🔒'
  }

  // 简化的树形布局(三层结构)
  const renderTreeNodes = () => {
    const rootNodes = nodes.filter(n => n.node_type === 'root')
    const branchNodes = nodes.filter(n => n.node_type === 'branch')
    const leafNodes = nodes.filter(n => n.node_type === 'leaf')

    return (
      <div className="tree-container">
        {/* 根节点层 */}
        <div className="tree-layer root-layer">
          {rootNodes.map(node => (
            <div
              key={node.id}
              className={`tree-node ${getNodeStatus(node)}`}
              style={{ borderColor: getNodeColor(node) }}
              onClick={() => setSelectedNode(node)}
            >
              <div className="node-icon" style={{ background: getNodeColor(node) }}>
                {getNodeIcon(node)}
              </div>
              <div className="node-name">{node.name}</div>
              {progress.get(node.id)?.mastery_percentage && (
                <div className="node-progress">
                  {progress.get(node.id)?.mastery_percentage}%
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 分支节点层 */}
        {branchNodes.length > 0 && (
          <div className="tree-layer branch-layer">
            {branchNodes.map(node => (
              <div
                key={node.id}
                className={`tree-node ${getNodeStatus(node)}`}
                style={{ borderColor: getNodeColor(node) }}
                onClick={() => setSelectedNode(node)}
              >
                <div className="node-icon" style={{ background: getNodeColor(node) }}>
                  {getNodeIcon(node)}
                </div>
                <div className="node-name">{node.name}</div>
                {progress.get(node.id)?.mastery_percentage && (
                  <div className="node-progress">
                    {progress.get(node.id)?.mastery_percentage}%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 叶子节点层 */}
        {leafNodes.length > 0 && (
          <div className="tree-layer leaf-layer">
            {leafNodes.map(node => (
              <div
                key={node.id}
                className={`tree-node ${getNodeStatus(node)}`}
                style={{ borderColor: getNodeColor(node) }}
                onClick={() => setSelectedNode(node)}
              >
                <div className="node-icon" style={{ background: getNodeColor(node) }}>
                  {getNodeIcon(node)}
                </div>
                <div className="node-name">{node.name}</div>
                {progress.get(node.id)?.mastery_percentage && (
                  <div className="node-progress">
                    {progress.get(node.id)?.mastery_percentage}%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Layout>
      <Header
        title="技能树"
        gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        showBack={true}
      />

      <div className="main-content">
        {/* 统计卡片 */}
        {stats && (
          <div className="skill-stats-banner">
            <div className="stat-circle">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#f0f0f0" strokeWidth="6" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#skillGradient)"
                  strokeWidth="6"
                  strokeDasharray={`${stats.mastery_percentage * 2.827} 282.7`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                <defs>
                  <linearGradient id="skillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f093fb" />
                    <stop offset="100%" stopColor="#f5576c" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="circle-text">
                <div className="circle-value">{stats.mastery_percentage}%</div>
                <div className="circle-label">掌握度</div>
              </div>
            </div>

            <div className="stat-details">
              <div className="detail-item">
                <span className="detail-label">已解锁</span>
                <span className="detail-value">{stats.unlocked_nodes}/{stats.total_nodes}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">已完成</span>
                <span className="detail-value">{stats.completed_nodes}/{stats.total_nodes}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">获得积分</span>
                <span className="detail-value highlight">+{stats.total_points_earned}</span>
              </div>
            </div>
          </div>
        )}

        {/* 学科选择 */}
        <div className="subject-tabs">
          {subjects.map(subject => (
            <button
              key={subject}
              className={`subject-tab ${selectedSubject === subject ? 'active' : ''}`}
              onClick={() => setSelectedSubject(subject)}
            >
              {subject}
            </button>
          ))}
        </div>

        {/* 技能树可视化 */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p className="loading-text">加载中...</p>
          </div>
        ) : nodes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌳</div>
            <p className="empty-text">该学科暂无技能树</p>
          </div>
        ) : (
          renderTreeNodes()
        )}

        {/* 快捷入口 */}
        <div className="quick-actions">
          <button
            className="action-btn paths-btn"
            onClick={() => navigate('/skill-tree/paths')}
          >
            <div className="action-icon">🗺️</div>
            <div className="action-label">学习路径</div>
          </button>
          <button
            className="action-btn stats-btn"
            onClick={() => navigate('/skill-tree/my-progress')}
          >
            <div className="action-icon">📊</div>
            <div className="action-label">我的进度</div>
          </button>
        </div>
      </div>

      {/* 节点详情弹窗 */}
      {selectedNode && (
        <div className="node-detail-overlay" onClick={() => setSelectedNode(null)}>
          <div className="node-detail-card" onClick={(e) => e.stopPropagation()}>
            <button className="detail-close" onClick={() => setSelectedNode(null)}>×</button>

            <div className="detail-header">
              <div className="detail-icon" style={{ background: getNodeColor(selectedNode) }}>
                {getNodeIcon(selectedNode)}
              </div>
              <h3 className="detail-title">{selectedNode.name}</h3>
            </div>

            <p className="detail-description">{selectedNode.description}</p>

            <div className="detail-info">
              <div className="info-row">
                <span className="info-label">难度:</span>
                <span className="info-value">{'⭐'.repeat(selectedNode.difficulty)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">奖励:</span>
                <span className="info-value reward">+{selectedNode.points_reward} 积分</span>
              </div>
            </div>

            {progress.get(selectedNode.id) && (
              <div className="progress-info">
                <div className="progress-row">
                  <span>掌握度:</span>
                  <span>{progress.get(selectedNode.id)?.mastery_percentage}%</span>
                </div>
                {progress.get(selectedNode.id)?.star_rating && (
                  <div className="progress-row">
                    <span>评价:</span>
                    <span>{'⭐'.repeat(progress.get(selectedNode.id)?.star_rating || 0)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="detail-actions">
              {getNodeStatus(selectedNode) === 'locked' ? (
                <button
                  className="unlock-btn"
                  onClick={() => unlockNode(selectedNode.id)}
                >
                  🔓 解锁节点
                </button>
              ) : getNodeStatus(selectedNode) === 'unlocked' ? (
                <button
                  className="practice-btn"
                  onClick={() => navigate(`/skill-tree/practice/${selectedNode.id}`)}
                >
                  📝 开始练习
                </button>
              ) : (
                <button className="completed-btn" disabled>
                  ✓ 已完成
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
