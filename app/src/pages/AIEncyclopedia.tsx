// src/pages/AIEncyclopedia.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AIEncyclopedia.css';

interface Question {
  id: number;
  question: string;
  answer: string;
  category: '基础' | '技术' | '应用' | '未来' | '趣味';
  difficulty: '简单' | '中等' | '挑战';
  liked: boolean;
  voiceExplanation?: string;
}

const AIEncyclopedia: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 1,
      question: 'AI是什么？',
      answer: 'AI就像你的超级聪明小伙伴！它能学习、思考、玩游戏，还能帮你画画写故事呢！',
      category: '基础',
      difficulty: '简单',
      liked: true,
      voiceExplanation: 'ai_intro.mp3'
    },
    {
      id: 2,
      question: '机器人就是AI吗？',
      answer: '不完全是哦！机器人是身体，AI是大脑。有些机器人有AI大脑，有些没有。',
      category: '基础',
      difficulty: '中等',
      liked: false
    },
    {
      id: 3,
      question: 'AI怎么认识小猫小狗？',
      answer: 'AI看了好多好多猫咪和狗狗的照片，就像你认朋友一样，看多了就记住啦！',
      category: '技术',
      difficulty: '简单',
      liked: true
    },
    {
      id: 4,
      question: 'AI会做梦吗？',
      answer: 'AI不会像我们一样做梦，但它能创造奇妙的梦境画面！试试绘画创作就知道了！',
      category: '趣味',
      difficulty: '中等',
      liked: false
    },
    {
      id: 5,
      question: 'AI能成为我的朋友吗？',
      answer: '当然可以！我就是你的AI朋友小光，随时陪你聊天、学习和玩游戏！',
      category: '应用',
      difficulty: '简单',
      liked: true
    },
    {
      id: 6,
      question: 'AI比人类聪明吗？',
      answer: 'AI在某些方面很厉害（比如计算），但没有感情和创造力。我们各有各的聪明！',
      category: '未来',
      difficulty: '挑战',
      liked: false
    },
    {
      id: 7,
      question: 'AI怎么听懂我说话？',
      answer: '通过语音识别技术，AI把你的声音变成文字，就像翻译小精灵！',
      category: '技术',
      difficulty: '中等',
      liked: true
    },
    {
      id: 8,
      question: 'AI会画画吗？',
      answer: '会的！AI学习了无数张画，能创造出全新的艺术作品。试试"绘画创作"功能吧！',
      category: '应用',
      difficulty: '简单',
      liked: false
    },
    {
      id: 9,
      question: 'AI会犯错吗？',
      answer: '会的，就像小朋友学习一样，AI也需要不断练习和改进才能做得更好。',
      category: '基础',
      difficulty: '简单',
      liked: true
    },
    {
      id: 10,
      question: 'AI能预测未来吗？',
      answer: 'AI能根据过去的数据猜测可能发生的事，但不能像魔法一样预知未来哦！',
      category: '未来',
      difficulty: '中等',
      liked: false
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('全部');
  const [expandedId, setExpandedId] = useState<number | null>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showVoiceAssistant, setShowVoiceAssistant] = useState<boolean>(false);
  const [currentVoiceQuestion, setCurrentVoiceQuestion] = useState<string>('');

  const categories = ['全部', '基础', '技术', '应用', '未来', '趣味'];
  const difficulties = ['全部', '简单', '中等', '挑战'];

  const filteredQuestions = questions.filter(q => {
    const matchesCategory = selectedCategory === '全部' || q.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === '全部' || q.difficulty === selectedDifficulty;
    const matchesSearch = searchTerm === '' || 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  const toggleLike = (id: number) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, liked: !q.liked } : q
    ));
  };

  const toggleQuestion = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const askQuestionToAI = () => {
    setShowVoiceAssistant(true);
    // 这里可以集成语音识别API
  };

  const difficultyColors = {
    '简单': '#4ecdc4',
    '中等': '#feca57',
    '挑战': '#ff6b6b'
  };

  const categoryColors = {
    '基础': '#a29bfe',
    '技术': '#48dbfb',
    '应用': '#4ecdc4',
    '未来': '#fd79a8',
    '趣味': '#feca57'
  };

  return (
    <div className="encyclopedia-container">
      {/* 顶部导航 */}
      <header className="encyclopedia-header">
        <button className="back-button" onClick={() => navigate('/home')}>
          <span className="icon">←</span>
        </button>
        <h1 className="page-title">AI十万个为什么</h1>
        <button className="voice-assistant-btn" onClick={askQuestionToAI}>
          <span className="icon">🎤</span>
        </button>
      </header>

      {/* 小光机器人助手 */}
      <div className="ai-assistant-banner">
        <div className="assistant-avatar">
          <div className="robot-face">
            <div className="eye left"></div>
            <div className="eye right"></div>
            <div className="smile"></div>
          </div>
        </div>
        <div className="assistant-info">
          <h3>我是小光 🤖</h3>
          <p>有什么关于AI的好奇问题，尽管问我吧！</p>
          <button className="talk-to-me-btn" onClick={askQuestionToAI}>
            <span className="icon">💬</span> 和我聊天
          </button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="filter-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="搜索AI问题..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label>分类：</label>
            <div className="filter-tags">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`filter-tag ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    backgroundColor: selectedCategory === cat ? 
                      (categoryColors[cat as keyof typeof categoryColors] || '#667eea') : '#f0f2f5'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>难度：</label>
            <div className="filter-tags">
              {difficulties.map(diff => (
                <button
                  key={diff}
                  className={`filter-tag ${selectedDifficulty === diff ? 'active' : ''}`}
                  onClick={() => setSelectedDifficulty(diff)}
                  style={{
                    backgroundColor: selectedDifficulty === diff ? 
                      (difficultyColors[diff as keyof typeof difficultyColors] || '#667eea') : '#f0f2f5',
                    color: selectedDifficulty === diff ? 'white' : '#666'
                  }}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 问题列表 */}
      <div className="questions-list">
        <div className="questions-header">
          <h2>发现 {filteredQuestions.length} 个有趣问题</h2>
          <div className="questions-stats">
            <span className="stat">
              <span className="icon">⭐</span> 收藏了 {questions.filter(q => q.liked).length} 个
            </span>
          </div>
        </div>

        {filteredQuestions.map(question => (
          <div 
            key={question.id} 
            className={`question-card ${expandedId === question.id ? 'expanded' : ''}`}
          >
            <div className="question-header" onClick={() => toggleQuestion(question.id)}>
              <div className="question-meta">
                <span 
                  className="category-badge"
                  style={{ backgroundColor: categoryColors[question.category] }}
                >
                  {question.category}
                </span>
                <span 
                  className="difficulty-badge"
                  style={{ backgroundColor: difficultyColors[question.difficulty] }}
                >
                  {question.difficulty}
                </span>
              </div>
              
              <h3 className="question-title">
                <span className="q-mark">Q{question.id}.</span> {question.question}
              </h3>
              
              <div className="question-actions">
                <button 
                  className={`like-btn ${question.liked ? 'liked' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(question.id);
                  }}
                >
                  <span className="icon">{question.liked ? '❤️' : '🤍'}</span>
                </button>
                <span className="expand-icon">
                  {expandedId === question.id ? '▲' : '▼'}
                </span>
              </div>
            </div>
            
            {expandedId === question.id && (
              <div className="answer-content">
                <div className="answer-text">
                  <span className="a-mark">小光说：</span> {question.answer}
                </div>
                
                <div className="answer-actions">
                  {question.voiceExplanation && (
                    <button className="voice-btn">
                      <span className="icon">🔊</span> 听语音讲解
                    </button>
                  )}
                  <button className="related-btn">
                    <span className="icon">🎮</span> 玩相关游戏
                  </button>
                  <button className="ask-more-btn" onClick={askQuestionToAI}>
                    <span className="icon">💭</span> 继续提问
                  </button>
                </div>
                
                <div className="fun-fact">
                  <span className="icon">💡</span>
                  <strong>你知道吗？</strong> 这个问题被 {Math.floor(Math.random() * 100) + 1} 个小朋友问过！
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 语音助手弹出层 */}
      {showVoiceAssistant && (
        <div className="voice-assistant-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>和小光语音对话</h3>
              <button className="close-modal" onClick={() => setShowVoiceAssistant(false)}>
                ✕
              </button>
            </div>
            
            <div className="voice-interface">
              <div className="voice-animation">
                <div className="sound-wave"></div>
                <div className="sound-wave"></div>
                <div className="sound-wave"></div>
              </div>
              
              <p className="voice-prompt">
                {currentVoiceQuestion || "点击按钮开始说话，问我任何关于AI的问题！"}
              </p>
              
              <div className="voice-controls">
                <button className="voice-record-btn">
                  <span className="icon">🎤</span> 按住说话
                </button>
                <button className="voice-example-btn">
                  示例问题
                </button>
              </div>
              
              <div className="example-questions">
                <p>试试问我：</p>
                <div className="example-tags">
                  <span className="example-tag" onClick={() => setCurrentVoiceQuestion('AI能帮我写作业吗？')}>
                    AI能帮我写作业吗？
                  </span>
                  <span className="example-tag" onClick={() => setCurrentVoiceQuestion('AI会感到孤独吗？')}>
                    AI会感到孤独吗？
                  </span>
                  <span className="example-tag" onClick={() => setCurrentVoiceQuestion('AI是怎么学习的？')}>
                    AI是怎么学习的？
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 底部操作栏 */}
      <div className="bottom-actions">
        <button className="ask-question-btn" onClick={askQuestionToAI}>
          <span className="icon">+</span> 我要提问
        </button>
        <button 
          className="history-link-btn"
          onClick={() => navigate('/ai-history')}
        >
          <span className="icon">📜</span> 看AI发展史
        </button>
        <Link to="/games" className="games-link-btn">
          <span className="icon">🎮</span> 玩AI游戏
        </Link>
      </div>
    </div>
  );
};

export default AIEncyclopedia;