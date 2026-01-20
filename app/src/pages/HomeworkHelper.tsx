import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UsageTracker } from '../services/usageTracking';
import './HomeworkHelper.css';

// 小学主要课程
const PRIMARY_SUBJECTS = [
  { id: 'chinese', name: '语文', icon: '📖', color: '#ff6b6b' },
  { id: 'math', name: '数学', icon: '🔢', color: '#4ecdc4' },
  { id: 'english', name: '英语', icon: '🔤', color: '#45b7d1' },
  { id: 'science', name: '科学', icon: '🔬', color: '#96ceb4' },
];

// 初中主要课程
const MIDDLE_SUBJECTS = [
  { id: 'chinese', name: '语文', icon: '📖', color: '#ff6b6b' },
  { id: 'math', name: '数学', icon: '🔢', color: '#4ecdc4' },
  { id: 'english', name: '英语', icon: '🔤', color: '#45b7d1' },
  { id: 'physics', name: '物理', icon: '⚡', color: '#f7b731' },
  { id: 'chemistry', name: '化学', icon: '🧪', color: '#5f27cd' },
  { id: 'biology', name: '生物', icon: '🌱', color: '#00d2d3' },
  { id: 'history', name: '历史', icon: '📜', color: '#ee5a6f' },
  { id: 'geography', name: '地理', icon: '🌍', color: '#0fb9b1' },
  { id: 'politics', name: '政治', icon: '⚖️', color: '#c44569' },
];

// 年级选项
const GRADE_LEVELS = {
  primary: [
    { value: '小学1年级', label: '一年级' },
    { value: '小学2年级', label: '二年级' },
    { value: '小学3年级', label: '三年级' },
    { value: '小学4年级', label: '四年级' },
    { value: '小学5年级', label: '五年级' },
    { value: '小学6年级', label: '六年级' },
  ],
  middle: [
    { value: '初中1年级', label: '初一' },
    { value: '初中2年级', label: '初二' },
    { value: '初中3年级', label: '初三' },
  ],
};

const HomeworkHelper: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const usageTrackerRef = useRef<UsageTracker | null>(null);

  const [stage, setStage] = useState<'primary' | 'middle'>('primary');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const subjects = stage === 'primary' ? PRIMARY_SUBJECTS : MIDDLE_SUBJECTS;
  const grades = stage === 'primary' ? GRADE_LEVELS.primary : GRADE_LEVELS.middle;

  // 启动使用追踪
  useEffect(() => {
    usageTrackerRef.current = new UsageTracker('学习', 'AI作业助手', {
      stage,
      subject: selectedSubject,
      grade: selectedGrade,
    });
    usageTrackerRef.current.start();

    return () => {
      if (usageTrackerRef.current) {
        usageTrackerRef.current.end(undefined, {
          stage,
          subject: selectedSubject,
          grade: selectedGrade,
          uploaded: !!uploadedImage,
        });
      }
    };
  }, []);

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 预览图片
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 上传到服务器
    await uploadImage(file);
  };

  // 上传图片
  const uploadImage = async (file: File) => {
    if (!selectedSubject || !selectedGrade) {
      alert('请先选择科目和年级');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('subject', subjects.find(s => s.id === selectedSubject)?.name || '');
      formData.append('gradeLevel', selectedGrade);
      formData.append('questionType', selectedSubject);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/homework/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // 跳转到解答页面
        navigate(`/homework/answer/${data.data.questionId}`, {
          state: {
            questionId: data.data.questionId,
            ocrText: data.data.ocrText,
            confidence: data.data.confidence,
            image: uploadedImage,
          },
        });
      } else {
        alert(data.message || '上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败,请重试');
    } finally {
      setUploading(false);
    }
  };

  // 拍照
  const handleTakePhoto = () => {
    cameraInputRef.current?.click();
  };

  // 选择图片
  const handleChooseImage = () => {
    fileInputRef.current?.click();
  };

  // 查看历史记录
  const viewHistory = () => {
    navigate('/homework/history');
  };

  return (
    <div className="homework-container">
      {/* 顶部导航 */}
      <header className="homework-header">
        <button className="back-button" onClick={() => navigate('/home')}>
          <span className="icon">←</span>
        </button>
        <h1 className="page-title">AI作业助手</h1>
        <button className="history-button" onClick={viewHistory}>
          <span className="icon">📝</span>
        </button>
      </header>

      {/* AI助手横幅 */}
      <div className="ai-assistant-banner">
        <div className="assistant-avatar">
          <div className="robot-face">
            <div className="eye left"></div>
            <div className="eye right"></div>
            <div className="smile"></div>
          </div>
        </div>
        <div className="assistant-info">
          <h3>我是启启 🤖</h3>
          <p>拍照搜题，秒出答案！支持小学初中全科目</p>
        </div>
      </div>

      {/* 学段和年级选择 */}
      <div className="selection-section">
        <div className="stage-selector">
          <label className="section-label">学段选择</label>
          <div className="stage-buttons">
            <button
              className={`stage-btn ${stage === 'primary' ? 'active' : ''}`}
              onClick={() => {
                setStage('primary');
                setSelectedSubject('');
                setSelectedGrade('');
              }}
            >
              <span className="stage-icon">🎒</span>
              <span className="stage-text">小学</span>
            </button>
            <button
              className={`stage-btn ${stage === 'middle' ? 'active' : ''}`}
              onClick={() => {
                setStage('middle');
                setSelectedSubject('');
                setSelectedGrade('');
              }}
            >
              <span className="stage-icon">🎓</span>
              <span className="stage-text">初中</span>
            </button>
          </div>
        </div>

        <div className="grade-selector">
          <label className="section-label">年级选择</label>
          <div className="grade-options">
            {grades.map((grade) => (
              <button
                key={grade.value}
                className={`grade-btn ${selectedGrade === grade.value ? 'active' : ''}`}
                onClick={() => setSelectedGrade(grade.value)}
              >
                {grade.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 科目选择 */}
      <div className="subject-selector">
        <label className="section-label">科目选择</label>
        <div className="subject-grid">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              className={`subject-card ${selectedSubject === subject.id ? 'active' : ''}`}
              style={{
                backgroundColor: selectedSubject === subject.id ? subject.color : '#f0f2f5',
                color: selectedSubject === subject.id ? 'white' : '#666'
              }}
              onClick={() => setSelectedSubject(subject.id)}
            >
              <span className="subject-icon">{subject.icon}</span>
              <span className="subject-name">{subject.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 图片预览 */}
      {uploadedImage && (
        <div className="image-preview">
          <img src={uploadedImage} alt="上传的题目" />
          {uploading && (
            <div className="uploading-overlay">
              <div className="spinner"></div>
              <p>正在识别题目...</p>
            </div>
          )}
        </div>
      )}

      {/* 上传按钮 */}
      <div className="upload-actions">
        <button
          className="action-btn camera-btn"
          onClick={handleTakePhoto}
          disabled={!selectedSubject || !selectedGrade || uploading}
        >
          📸 拍照搜题
        </button>
        <button
          className="action-btn gallery-btn"
          onClick={handleChooseImage}
          disabled={!selectedSubject || !selectedGrade || uploading}
        >
          🖼️ 相册选择
        </button>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* 使用说明 */}
      <div className="usage-tips">
        <h3>💡 使用说明</h3>
        <ul>
          <li>1. 选择您的年级和科目</li>
          <li>2. 拍照或上传作业题目图片</li>
          <li>3. AI自动识别并给出详细解答</li>
          <li>4. 查看解题步骤和知识点讲解</li>
        </ul>
      </div>
    </div>
  );
};

export default HomeworkHelper;
