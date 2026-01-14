import { useState, useRef, useEffect } from 'react'
import { Layout, Header } from '../components/layout'
import { UsageTracker } from '../services/usageTracking'
import './FourClassics.css'

interface Chapter {
  id: number
  title: string
  summary: string
  keyPoints: string[]
}

interface Classic {
  id: string
  title: string
  author: string
  cover: string
  color: string
  bgColor: string
  intro: string
  mainCharacters: string[]
  chapters: Chapter[]
}

const classics: Classic[] = [
  {
    id: 'xiyouji',
    title: '西游记',
    author: '吴承恩',
    cover: '🐵',
    color: '#e74c3c',
    bgColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    intro: '讲述了唐僧师徒四人去西天取经，历经九九八十一难，最终取得真经的故事。',
    mainCharacters: ['孙悟空', '唐僧', '猪八戒', '沙僧', '白龙马'],
    chapters: [
      { id: 1, title: '石猴出世', summary: '花果山上一块仙石孕育出石猴，石猴成为美猴王', keyPoints: ['花果山水帘洞', '美猴王称号', '天生灵性'] },
      { id: 2, title: '大闹天宫', summary: '孙悟空学艺归来，大闹天宫，被如来佛祖压在五行山下', keyPoints: ['齐天大圣', '蟠桃盛会', '五行山'] },
      { id: 3, title: '三打白骨精', summary: '白骨精三次变化欺骗唐僧，孙悟空火眼金睛识破妖怪', keyPoints: ['火眼金睛', '师徒误会', '正邪对抗'] },
      { id: 4, title: '车迟国斗法', summary: '师徒四人在车迟国与三位国师斗法，揭穿妖怪真面目', keyPoints: ['求雨比赛', '砍头复原', '智斗妖道'] },
      { id: 5, title: '真假美猴王', summary: '六耳猕猴变成孙悟空模样，如来佛祖识破真假', keyPoints: ['两个悟空', '如来辨真', '真假难分'] },
      { id: 6, title: '三借芭蕉扇', summary: '为过火焰山，孙悟空三次向铁扇公主借芭蕉扇', keyPoints: ['火焰山', '铁扇公主', '牛魔王'] },
      { id: 7, title: '女儿国奇遇', summary: '师徒路过女儿国，唐僧被女王看中要招为驸马', keyPoints: ['女儿国', '子母河', '情感考验'] },
      { id: 8, title: '盘丝洞历险', summary: '七个蜘蛛精在盘丝洞抓住唐僧，悟空救师父脱险', keyPoints: ['蜘蛛精', '盘丝洞', '团结协作'] },
    ]
  },
  {
    id: 'sanguo',
    title: '三国演义',
    author: '罗贯中',
    cover: '⚔️',
    color: '#3498db',
    bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    intro: '描写了东汉末年到西晋初年，魏、蜀、吴三国之间的政治和军事斗争。',
    mainCharacters: ['刘备', '关羽', '张飞', '诸葛亮', '曹操', '孙权'],
    chapters: [
      { id: 1, title: '桃园三结义', summary: '刘备、关羽、张飞三人结拜为兄弟，共同起兵', keyPoints: ['桃园结义', '不求同年同月同日生', '患难与共'] },
      { id: 2, title: '三顾茅庐', summary: '刘备三次拜访诸葛亮，请他出山相助', keyPoints: ['礼贤下士', '诚心感动', '隆中对'] },
      { id: 3, title: '火烧赤壁', summary: '周瑜和诸葛亮联手，用火攻大败曹操', keyPoints: ['联吴抗曹', '借东风', '连环计'] },
      { id: 4, title: '草船借箭', summary: '诸葛亮巧用大雾天气，从曹操处借来十万支箭', keyPoints: ['智谋过人', '借箭妙计', '知天文'] },
      { id: 5, title: '关羽过五关斩六将', summary: '关羽保护刘备家眷，过五关斩六将寻找大哥', keyPoints: ['忠义无双', '武艺高强', '千里寻兄'] },
      { id: 6, title: '空城计', summary: '诸葛亮城中无兵，大开城门，弹琴退司马懿', keyPoints: ['临危不惧', '心理战术', '智慧退兵'] },
      { id: 7, title: '七擒孟获', summary: '诸葛亮七次擒获孟获又七次释放，最终收服南蛮', keyPoints: ['攻心为上', '以德服人', '智取人心'] },
      { id: 8, title: '失街亭', summary: '马谡违背诸葛亮部署，失守街亭，诸葛亮挥泪斩马谡', keyPoints: ['军令如山', '用人失误', '自责担当'] },
    ]
  },
  {
    id: 'shuihu',
    title: '水浒传',
    author: '施耐庵',
    cover: '🦸',
    color: '#27ae60',
    bgColor: 'linear-gradient(135deg, #81fbb8 0%, #28c76f 100%)',
    intro: '描写了北宋末年一百零八位好汉聚义梁山泊，反抗朝廷的故事。',
    mainCharacters: ['宋江', '林冲', '武松', '鲁智深', '李逵', '吴用'],
    chapters: [
      { id: 1, title: '鲁智深拳打镇关西', summary: '鲁智深为金翠莲父女打抱不平，三拳打死镇关西', keyPoints: ['见义勇为', '力大无穷', '疾恶如仇'] },
      { id: 2, title: '林冲风雪山神庙', summary: '林冲遭陷害发配，在风雪中火烧山神庙，杀死仇人', keyPoints: ['忍辱负重', '被逼上梁山', '复仇雪恨'] },
      { id: 3, title: '武松打虎', summary: '武松在景阳冈赤手空拳打死一只老虎，成为打虎英雄', keyPoints: ['勇猛过人', '武艺高强', '为民除害'] },
      { id: 4, title: '武松血溅鸳鸯楼', summary: '武松为兄长报仇，血溅鸳鸯楼，杀死西门庆等人', keyPoints: ['兄弟情深', '快意恩仇', '武艺超群'] },
      { id: 5, title: '智取生辰纲', summary: '吴用等人设计劫取生辰纲，展现智慧与团结', keyPoints: ['智谋出众', '团队协作', '义劫不义财'] },
      { id: 6, title: '李逵沂岭杀四虎', summary: '李逵为救母亲，在沂岭连杀四虎', keyPoints: ['孝心感人', '勇猛无比', '赤胆忠心'] },
      { id: 7, title: '宋江私放晁盖', summary: '宋江冒险私放晁盖等人，展现义气', keyPoints: ['重情重义', '舍己救人', '结交豪杰'] },
      { id: 8, title: '三打祝家庄', summary: '梁山好汉三次攻打祝家庄，最终攻破', keyPoints: ['坚持不懈', '智勇双全', '团结一致'] },
    ]
  },
  {
    id: 'hongloumeng',
    title: '红楼梦',
    author: '曹雪芹',
    cover: '🏮',
    color: '#e91e63',
    bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    intro: '讲述了贾宝玉、林黛玉、薛宝钗之间的爱情故事，以及贾府由盛转衰的过程。',
    mainCharacters: ['贾宝玉', '林黛玉', '薛宝钗', '王熙凤', '贾母', '史湘云'],
    chapters: [
      { id: 1, title: '宝玉初会黛玉', summary: '林黛玉进贾府，第一次见到贾宝玉，两人似曾相识', keyPoints: ['前世今生', '一见如故', '命中注定'] },
      { id: 2, title: '宝钗扑蝶', summary: '薛宝钗在花园中扑蝶，展现大家闺秀风范', keyPoints: ['温柔贤淑', '大度宽容', '善解人意'] },
      { id: 3, title: '黛玉葬花', summary: '林黛玉在花园中葬花，感伤身世，吟诵葬花词', keyPoints: ['多愁善感', '才华横溢', '孤独寂寞'] },
      { id: 4, title: '宝玉挨打', summary: '贾宝玉因结交戏子被父亲毒打，众人心疼', keyPoints: ['父子冲突', '个性叛逆', '真情流露'] },
      { id: 5, title: '刘姥姥进大观园', summary: '乡下的刘姥姥来到贾府，见识了豪华生活', keyPoints: ['城乡对比', '人情冷暖', '幽默诙谐'] },
      { id: 6, title: '金钏投井', summary: '丫鬟金钏因王夫人责骂投井自尽', keyPoints: ['悲剧命运', '阶级矛盾', '人性冷漠'] },
      { id: 7, title: '晴雯撕扇', summary: '晴雯为取悦宝玉撕扇子取乐', keyPoints: ['率真可爱', '主仆情深', '任性洒脱'] },
      { id: 8, title: '黛玉焚稿', summary: '林黛玉听闻宝玉要娶宝钗，气急之下焚烧诗稿', keyPoints: ['悲痛欲绝', '爱情悲剧', '才情尽毁'] },
    ]
  }
]

export default function FourClassics() {
  const [selectedClassic, setSelectedClassic] = useState<Classic | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  const usageTrackerRef = useRef<UsageTracker | null>(null)

  // 清理追踪器
  useEffect(() => {
    return () => {
      if (usageTrackerRef.current) {
        usageTrackerRef.current.end()
        usageTrackerRef.current = null
      }
    }
  }, [])

  const handleClassicClick = (classic: Classic) => {
    setSelectedClassic(classic)
    setSelectedChapter(null)
  }

  const handleChapterClick = (chapter: Chapter) => {
    setSelectedChapter(chapter)
    // 启动使用追踪
    if (selectedClassic) {
      usageTrackerRef.current = new UsageTracker('阅读', `${selectedClassic.title}-${chapter.title}`, {
        classicId: selectedClassic.id,
        classicTitle: selectedClassic.title,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        author: selectedClassic.author
      })
      usageTrackerRef.current.start()
    }
  }

  const handleBack = () => {
    // 如果正在阅读章节,记录数据
    if (selectedChapter && usageTrackerRef.current) {
      usageTrackerRef.current.end(undefined, {
        completed: false // 未完成阅读
      })
      usageTrackerRef.current = null
    }

    if (selectedChapter) {
      setSelectedChapter(null)
    } else {
      setSelectedClassic(null)
    }
  }

  return (
    <Layout>
      <Header
        title={selectedClassic ? selectedClassic.title : '四大名著'}
        gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        showBack={!selectedClassic}
      />

      <div className="main-content">
        {selectedClassic && (
          <button
            onClick={handleBack}
            style={{
              position: 'absolute',
              top: '70px',
              left: '20px',
              zIndex: 100,
              background: 'rgba(255,255,255,0.9)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '20px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            ←
          </button>
        )}

        {!selectedClassic ? (
          // 名著列表
          <div className="classics-grid">
            {classics.map((classic) => (
              <div
                key={classic.id}
                className="classic-card"
                style={{ background: classic.bgColor }}
                onClick={() => handleClassicClick(classic)}
              >
                <div className="classic-cover">{classic.cover}</div>
                <div className="classic-info">
                  <h3 className="classic-title">{classic.title}</h3>
                  <p className="classic-author">作者：{classic.author}</p>
                  <p className="classic-intro">{classic.intro}</p>
                  <div className="classic-action">
                    <span>开始阅读</span>
                    <span className="arrow">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !selectedChapter ? (
          // 章节列表
          <div className="chapters-view">
            <div className="classic-header" style={{ background: selectedClassic.bgColor }}>
              <div className="header-cover">{selectedClassic.cover}</div>
              <div className="header-info">
                <h2>{selectedClassic.title}</h2>
                <p className="author">作者：{selectedClassic.author}</p>
                <p className="intro">{selectedClassic.intro}</p>
              </div>
            </div>

            <div className="characters-section">
              <h3>📖 主要人物</h3>
              <div className="characters-list">
                {selectedClassic.mainCharacters.map((char, idx) => (
                  <span key={idx} className="character-tag">{char}</span>
                ))}
              </div>
            </div>

            <div className="chapters-section">
              <h3>📚 精彩章节</h3>
              <div className="chapters-list">
                {selectedClassic.chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="chapter-item"
                    onClick={() => handleChapterClick(chapter)}
                  >
                    <div className="chapter-number">{chapter.id}</div>
                    <div className="chapter-content">
                      <div className="chapter-title">{chapter.title}</div>
                      <div className="chapter-summary">{chapter.summary}</div>
                    </div>
                    <div className="chapter-arrow">→</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // 章节详情
          <div className="chapter-detail">
            <div className="detail-header">
              <h2>{selectedChapter.title}</h2>
              <div className="detail-badge">
                第{selectedChapter.id}回
              </div>
            </div>

            <div className="detail-summary">
              <h3>📖 故事梗概</h3>
              <p>{selectedChapter.summary}</p>
            </div>

            <div className="detail-points">
              <h3>✨ 重点内容</h3>
              <ul className="points-list">
                {selectedChapter.keyPoints.map((point, idx) => (
                  <li key={idx} className="point-item">
                    <span className="point-icon">🔸</span>
                    <span className="point-text">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="detail-actions">
              <button className="btn-primary" onClick={handleBack}>
                返回章节列表
              </button>
              <button className="btn-secondary">
                下一章
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
