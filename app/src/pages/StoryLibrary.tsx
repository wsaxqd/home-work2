import { useState, useMemo, useRef, useEffect } from 'react';
import { Layout, Header } from '../components/layout';
import { UsageTracker } from '../services/usageTracking';
import { classicStories, getAllStoryCategories } from '../data/classicStories';
import type { Story } from '../data/classicStories';
import './StoryLibrary.css';

export default function StoryLibrary() {
  const [selectedOrigin, setSelectedOrigin] = useState<'all' | '中国' | '外国'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const usageTrackerRef = useRef<UsageTracker | null>(null);

  // 清理追踪器
  useEffect(() => {
    return () => {
      if (usageTrackerRef.current) {
        usageTrackerRef.current.end();
        usageTrackerRef.current = null;
      }
    };
  }, []);

  // 获取所有分类
  const categories = useMemo(() => getAllStoryCategories(), []);

  // 筛选故事
  const filteredStories = useMemo(() => {
    return classicStories.filter(story => {
      // 来源筛选
      if (selectedOrigin !== 'all' && story.origin !== selectedOrigin) {
        return false;
      }
      // 分类筛选
      if (selectedCategory !== 'all' && story.category !== selectedCategory) {
        return false;
      }
      // 关键词搜索
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        return (
          story.title.toLowerCase().includes(keyword) ||
          story.summary.toLowerCase().includes(keyword) ||
          story.keywords.some(k => k.toLowerCase().includes(keyword))
        );
      }
      return true;
    });
  }, [selectedOrigin, selectedCategory, searchKeyword]);

  const handleStoryClick = (story: Story) => {
    setSelectedStory(story);
    // 启动使用追踪
    usageTrackerRef.current = new UsageTracker('阅读', `故事-${story.title}`, {
      storyId: story.id,
      origin: story.origin,
      country: story.country,
      category: story.category,
      ageGroup: story.ageGroup,
      length: story.length,
      keywords: story.keywords
    });
    usageTrackerRef.current.start();
  };

  const handleCloseDetail = () => {
    // 记录阅读数据
    if (usageTrackerRef.current && selectedStory) {
      usageTrackerRef.current.end(undefined, {
        completed: true // 假设查看详情即为完成阅读
      });
      usageTrackerRef.current = null;
    }
    setSelectedStory(null);
  };

  return (
    <Layout>
      <Header title="故事宝库" gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" />

      <div className="main-content story-library">
        {/* 筛选栏 */}
        <div className="filter-section">
          <div className="filter-group">
            <label>故事来源：</label>
            <div className="filter-buttons">
              <button
                className={selectedOrigin === 'all' ? 'active' : ''}
                onClick={() => setSelectedOrigin('all')}
              >
                全部
              </button>
              <button
                className={selectedOrigin === '中国' ? 'active' : ''}
                onClick={() => setSelectedOrigin('中国')}
              >
                🇨🇳 中国故事
              </button>
              <button
                className={selectedOrigin === '外国' ? 'active' : ''}
                onClick={() => setSelectedOrigin('外国')}
              >
                🌍 外国故事
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label>故事分类：</label>
            <div className="filter-buttons">
              <button
                className={selectedCategory === 'all' ? 'active' : ''}
                onClick={() => setSelectedCategory('all')}
              >
                全部
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  className={selectedCategory === category ? 'active' : ''}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="搜索故事标题或关键词..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
        </div>

        {/* 故事统计 */}
        <div className="story-stats">
          <div className="stat-item">
            <span className="stat-number">{classicStories.length}</span>
            <span className="stat-label">总故事数</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{filteredStories.length}</span>
            <span className="stat-label">筛选结果</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{categories.length}</span>
            <span className="stat-label">故事分类</span>
          </div>
        </div>

        {/* 故事列表 */}
        <div className="stories-grid">
          {filteredStories.map(story => (
            <div
              key={story.id}
              className="story-card"
              onClick={() => handleStoryClick(story)}
            >
              <div className="story-card-header">
                <h3 className="story-title">{story.title}</h3>
                <span className={`origin-badge ${story.origin === '中国' ? 'china' : 'foreign'}`}>
                  {story.origin === '中国' ? '🇨🇳' : '🌍'} {story.origin}
                </span>
              </div>

              <div className="story-meta">
                <span className="category-tag">{story.category}</span>
                <span className="age-tag">{story.ageGroup}</span>
                <span className={`length-tag ${story.length}`}>
                  {story.length === 'short' ? '短篇' : story.length === 'medium' ? '中篇' : '长篇'}
                </span>
              </div>

              <p className="story-summary">{story.summary}</p>

              <div className="story-keywords">
                {story.keywords.slice(0, 3).map((keyword, index) => (
                  <span key={index} className="keyword">#{keyword}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredStories.length === 0 && (
          <div className="empty-state">
            <p>😢 没有找到符合条件的故事</p>
            <p>试试调整筛选条件或搜索其他关键词吧</p>
          </div>
        )}

        {/* 故事详情弹窗 */}
        {selectedStory && (
          <div className="story-detail-modal" onClick={handleCloseDetail}>
            <div className="story-detail-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={handleCloseDetail}>✕</button>

              <div className="detail-header">
                <h2>{selectedStory.title}</h2>
                <div className="detail-meta">
                  <span className="origin-info">
                    {selectedStory.origin === '中国' ? '🇨🇳' : '🌍'} {selectedStory.country || selectedStory.origin}
                  </span>
                  <span className="category-info">{selectedStory.category}</span>
                  <span className="age-info">适合年龄：{selectedStory.ageGroup}</span>
                </div>
              </div>

              <div className="detail-body">
                <div className="summary-section">
                  <h4>故事简介</h4>
                  <p>{selectedStory.summary}</p>
                </div>

                <div className="content-section">
                  <h4>故事内容</h4>
                  <div className="story-text">
                    {selectedStory.content.split('\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </div>

                {selectedStory.moral && (
                  <div className="moral-section">
                    <h4>故事寓意</h4>
                    <p className="moral-text">{selectedStory.moral}</p>
                  </div>
                )}

                <div className="keywords-section">
                  <h4>相关标签</h4>
                  <div className="keyword-list">
                    {selectedStory.keywords.map((keyword, index) => (
                      <span key={index} className="keyword-badge">#{keyword}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
