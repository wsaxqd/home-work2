import { useState, useRef, useEffect } from 'react'
import { Layout, Header } from '../components/layout'
import { UsageTracker } from '../services/usageTracking'
import './ChineseClassics.css'

interface Chapter {
  id: number
  title: string
  content: string
  translation?: string
}

interface Classic {
  id: string
  title: string
  author: string
  period: string
  cover: string
  color: string
  bgColor: string
  intro: string
  chapters: Chapter[]
}

const classics: Classic[] = [
  {
    id: 'lunyu',
    title: '论语',
    author: '孔子及其弟子',
    period: '春秋时期',
    cover: '📖',
    color: '#c0392b',
    bgColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    intro: '《论语》是儒家经典著作,记录了孔子及其弟子的言行,是中国古代思想文化的重要典籍。',
    chapters: [
      { id: 1, title: '学而第一', content: '子曰:"学而时习之,不亦说乎?有朋自远方来,不亦乐乎?人不知而不愠,不亦君子乎?"', translation: '孔子说:"学了知识并经常温习,不是很高兴吗?有朋友从远方来,不是很快乐吗?别人不了解自己也不生气,不就是君子吗?"' },
      { id: 2, title: '为政第二', content: '子曰:"温故而知新,可以为师矣。"', translation: '孔子说:"温习旧知识能有新收获,就可以当老师了。"' },
      { id: 3, title: '里仁第四', content: '子曰:"德不孤,必有邻。"', translation: '孔子说:"有道德的人不会孤单,一定会有志同道合的人。"' },
      { id: 4, title: '述而第七', content: '子曰:"三人行,必有我师焉。择其善者而从之,其不善者而改之。"', translation: '孔子说:"三个人一起走,其中必定有我的老师。我选择他们的优点学习,看到他们的缺点就改正自己。"' },
      { id: 5, title: '泰伯第八', content: '曾子曰:"士不可以不弘毅,任重而道远。"', translation: '曾子说:"读书人不能不心胸宽广、意志坚强,因为责任重大而路途遥远。"' },
      { id: 6, title: '子罕第九', content: '子曰:"岁寒,然后知松柏之后凋也。"', translation: '孔子说:"到了寒冷的冬天,才知道松树和柏树最后才凋谢。"' },
      { id: 7, title: '颜渊第十二', content: '子曰:"己所不欲,勿施于人。"', translation: '孔子说:"自己不想要的,不要强加给别人。"' },
      { id: 8, title: '卫灵公第十五', content: '子曰:"工欲善其事,必先利其器。"', translation: '孔子说:"工匠想要做好工作,一定要先磨快工具。"' },
    ]
  },
  {
    id: 'daxue',
    title: '大学',
    author: '曾子',
    period: '春秋时期',
    cover: '📚',
    color: '#2980b9',
    bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    intro: '《大学》是儒家经典"四书"之一,阐述了修身、齐家、治国、平天下的道理。',
    chapters: [
      { id: 1, title: '三纲领', content: '大学之道,在明明德,在亲民,在止于至善。', translation: '大学的宗旨,在于彰显光明正大的品德,在于使人弃旧图新,在于达到最完善的境界。' },
      { id: 2, title: '八条目(一)', content: '古之欲明明德于天下者,先治其国;欲治其国者,先齐其家;欲齐其家者,先修其身。', translation: '古代想要在天下彰显光明品德的人,先要治理好自己的国家;想治理好国家的人,先要整顿好自己的家庭;想整顿好家庭的人,先要修养自身。' },
      { id: 3, title: '八条目(二)', content: '欲修其身者,先正其心;欲正其心者,先诚其意;欲诚其意者,先致其知;致知在格物。', translation: '想修养自身的人,先要端正自己的心思;想端正心思的人,先要使自己的意念真诚;想使意念真诚的人,先要获得知识;获得知识在于探究事物的道理。' },
      { id: 4, title: '本末', content: '物有本末,事有终始,知所先后,则近道矣。', translation: '事物有根本有枝节,事情有开始有终结,知道先做什么后做什么,就接近道理了。' },
      { id: 5, title: '修身为本', content: '自天子以至于庶人,壹是皆以修身为本。', translation: '从天子到平民,都要以修养自身为根本。' },
      { id: 6, title: '诚意', content: '所谓诚其意者,毋自欺也。如恶恶臭,如好好色,此之谓自谦。', translation: '所谓使意念真诚,就是不要自己欺骗自己。就像厌恶臭味一样,就像喜欢美色一样,这就叫做自我满足。' },
      { id: 7, title: '正心', content: '心不在焉,视而不见,听而不闻,食而不知其味。', translation: '心思不在这里,看了也看不见,听了也听不到,吃了也不知道味道。' },
      { id: 8, title: '齐家', content: '欲齐其家者,先修其身。身修而后家齐,家齐而后国治,国治而后天下平。', translation: '想要整顿家庭的人,先要修养自身。自身修养好了家庭才能整顿,家庭整顿好了国家才能治理,国家治理好了天下才能太平。' },
    ]
  },
  {
    id: 'zhongyong',
    title: '中庸',
    author: '子思',
    period: '春秋时期',
    cover: '⚖️',
    color: '#27ae60',
    bgColor: 'linear-gradient(135deg, #81fbb8 0%, #28c76f 100%)',
    intro: '《中庸》是儒家经典之一,强调"中庸之道",即不偏不倚、无过无不及的处世态度。',
    chapters: [
      { id: 1, title: '天命之谓性', content: '天命之谓性,率性之谓道,修道之谓教。', translation: '上天赋予的叫做本性,遵循本性叫做道,修习道叫做教化。' },
      { id: 2, title: '中庸之道', content: '中也者,天下之大本也;和也者,天下之达道也。致中和,天地位焉,万物育焉。', translation: '中,是天下的根本;和,是天下通行的道理。达到中和的境界,天地就各得其位,万物就生长发育了。' },
      { id: 3, title: '君子之道', content: '君子之道,造端乎夫妇,及其至也,察乎天地。', translation: '君子的道,开始于夫妇关系,推到极致,可以观察天地万物。' },
      { id: 4, title: '诚者天之道', content: '诚者,天之道也;诚之者,人之道也。', translation: '真诚,是天的法则;追求真诚,是人应该遵循的法则。' },
      { id: 5, title: '博学之', content: '博学之,审问之,慎思之,明辨之,笃行之。', translation: '广泛地学习,详细地询问,慎重地思考,明确地分辨,切实地实行。' },
      { id: 6, title: '不愠不火', content: '喜怒哀乐之未发,谓之中;发而皆中节,谓之和。', translation: '喜怒哀乐没有表现出来,叫做中;表现出来都符合节度,叫做和。' },
      { id: 7, title: '慎独', content: '莫见乎隐,莫显乎微,故君子慎其独也。', translation: '没有比隐蔽的地方更容易显露的,没有比细微的事情更容易显著的,所以君子在独处时要谨慎。' },
      { id: 8, title: '至诚之道', content: '至诚之道,可以前知。国家将兴,必有祯祥;国家将亡,必有妖孽。', translation: '达到至诚的境界,就可以预知未来。国家将要兴盛,一定有吉祥的征兆;国家将要衰亡,一定有不祥的预兆。' },
    ]
  },
  {
    id: 'mengzi',
    title: '孟子',
    author: '孟子及其弟子',
    period: '战国时期',
    cover: '👨‍🏫',
    color: '#8e44ad',
    bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    intro: '《孟子》是儒家经典著作,记录了孟子的思想言论,提出了"性善论"和"仁政"思想。',
    chapters: [
      { id: 1, title: '恻隐之心', content: '人皆有不忍人之心。所以谓人皆有不忍人之心者,今人乍见孺子将入于井,皆有怵惕恻隐之心。', translation: '人人都有同情心。说人人都有同情心,是因为现在有人突然看见小孩将要掉进井里,都会有惊惧同情的心理。' },
      { id: 2, title: '性善论', content: '人性之善也,犹水之就下也。人无有不善,水无有不下。', translation: '人性向善,就像水向低处流一样。人没有不善的,水没有不往下流的。' },
      { id: 3, title: '四端之心', content: '恻隐之心,仁之端也;羞恶之心,义之端也;辞让之心,礼之端也;是非之心,智之端也。', translation: '同情心是仁的开端;羞耻心是义的开端;谦让心是礼的开端;是非心是智的开端。' },
      { id: 4, title: '鱼我所欲也', content: '鱼,我所欲也;熊掌,亦我所欲也。二者不可得兼,舍鱼而取熊掌者也。生,亦我所欲也;义,亦我所欲也。二者不可得兼,舍生而取义者也。', translation: '鱼是我想要的;熊掌也是我想要的。两样不能同时得到,就舍弃鱼而选择熊掌。生命是我想要的;正义也是我想要的。两样不能同时得到,就舍弃生命而选择正义。' },
      { id: 5, title: '民为贵', content: '民为贵,社稷次之,君为轻。', translation: '人民最重要,国家其次,君主最轻。' },
      { id: 6, title: '得道多助', content: '得道者多助,失道者寡助。寡助之至,亲戚畔之;多助之至,天下顺之。', translation: '行道义的人帮助的人多,不行道义的人帮助的人少。帮助少到极点,连亲戚都背叛他;帮助多到极点,天下人都顺从他。' },
      { id: 7, title: '富贵不能淫', content: '富贵不能淫,贫贱不能移,威武不能屈,此之谓大丈夫。', translation: '富贵不能使他迷惑,贫贱不能使他改变,威武不能使他屈服,这才叫大丈夫。' },
      { id: 8, title: '生于忧患', content: '生于忧患,死于安乐。', translation: '忧患使人生存,安乐使人死亡。' },
    ]
  },
  {
    id: 'sanzi',
    title: '三字经',
    author: '王应麟',
    period: '宋朝',
    cover: '📜',
    color: '#e67e22',
    bgColor: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
    intro: '《三字经》是中国传统启蒙教材,以三字一句的韵文形式,教育儿童做人做事的道理。',
    chapters: [
      { id: 1, title: '人之初', content: '人之初,性本善。性相近,习相远。', translation: '人刚出生时,本性都是善良的。天性相差不多,后天习惯却相差很远。' },
      { id: 2, title: '教之道', content: '苟不教,性乃迁。教之道,贵以专。', translation: '如果不好好教育,善良的本性就会改变。教育的方法,贵在专心致志。' },
      { id: 3, title: '三才者', content: '三才者,天地人。三光者,日月星。', translation: '三才是指天、地、人。三光是指太阳、月亮、星星。' },
      { id: 4, title: '为人子', content: '为人子,方少时。亲师友,习礼仪。', translation: '做子女的,从小时候起,就要亲近老师和朋友,学习礼仪。' },
      { id: 5, title: '融四岁', content: '融四岁,能让梨。弟于长,宜先知。', translation: '孔融四岁时,就知道把大梨让给哥哥。对待兄长要尊敬,这是应该先知道的道理。' },
      { id: 6, title: '首孝悌', content: '首孝悌,次见闻。知某数,识某文。', translation: '首先要孝顺父母、友爱兄弟,其次要增长见闻。学会一些数字,认识一些文字。' },
      { id: 7, title: '幼不学', content: '幼不学,老何为。玉不琢,不成器。', translation: '年轻时不学习,老了能做什么呢?玉不雕琢,就不能成为器物。' },
      { id: 8, title: '勤有功', content: '勤有功,戏无益。戒之哉,宜勉力。', translation: '勤奋有收获,玩耍没有益处。要警戒啊,应该努力。' },
    ]
  },
  {
    id: 'tangshi',
    title: '唐诗三百首',
    author: '多位诗人',
    period: '唐朝',
    cover: '🎋',
    color: '#e74c3c',
    bgColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    intro: '《唐诗三百首》收录了唐代优秀诗歌,是中国古典诗歌的瑰宝。',
    chapters: [
      { id: 1, title: '静夜思·李白', content: '床前明月光,疑是地上霜。举头望明月,低头思故乡。', translation: '明亮的月光洒在床前,好像地上的霜一样。抬头看明月,低头思念故乡。' },
      { id: 2, title: '春晓·孟浩然', content: '春眠不觉晓,处处闻啼鸟。夜来风雨声,花落知多少。', translation: '春天睡觉不知不觉天亮了,到处都能听到鸟叫声。昨夜风雨的声音,不知道有多少花落了。' },
      { id: 3, title: '登鹳雀楼·王之涣', content: '白日依山尽,黄河入海流。欲穷千里目,更上一层楼。', translation: '太阳依着山落下,黄河流向大海。想要看到更远的地方,就要登上更高的楼层。' },
      { id: 4, title: '悯农·李绅', content: '锄禾日当午,汗滴禾下土。谁知盘中餐,粒粒皆辛苦。', translation: '中午在烈日下锄地,汗水滴落在禾苗下的土里。谁知道盘子里的粮食,每一粒都是辛苦得来的。' },
      { id: 5, title: '咏鹅·骆宾王', content: '鹅鹅鹅,曲项向天歌。白毛浮绿水,红掌拨清波。', translation: '鹅鹅鹅,弯着脖子向天歌唱。白色的羽毛漂浮在绿水上,红色的脚掌拨动清澈的水波。' },
      { id: 6, title: '望庐山瀑布·李白', content: '日照香炉生紫烟,遥看瀑布挂前川。飞流直下三千尺,疑是银河落九天。', translation: '阳光照在香炉峰上升起紫色的烟雾,远看瀑布像挂在山前的大河。流水飞泻而下三千尺,好像银河从天上落下来。' },
      { id: 7, title: '春夜喜雨·杜甫', content: '好雨知时节,当春乃发生。随风潜入夜,润物细无声。', translation: '好雨知道下雨的时节,在春天来临的时候降临。随着春风在夜里悄悄落下,无声地滋润着万物。' },
      { id: 8, title: '江雪·柳宗元', content: '千山鸟飞绝,万径人踪灭。孤舟蓑笠翁,独钓寒江雪。', translation: '所有的山上都看不到鸟飞,所有的路上都没有人的踪迹。只有一只小船上,一位披着蓑衣戴着斗笠的老翁,独自在寒冷的江上钓鱼。' },
    ]
  },
]

export default function ChineseClassics() {
  const [selectedClassic, setSelectedClassic] = useState<Classic | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  const usageTrackerRef = useRef<UsageTracker | null>(null)

  useEffect(() => {
    // 开始追踪使用时间
    usageTrackerRef.current = new UsageTracker('阅读', '国学经典')
    usageTrackerRef.current.start()

    return () => {
      // 组件卸载时结束追踪
      if (usageTrackerRef.current) {
        usageTrackerRef.current.end()
      }
    }
  }, [])

  const handleClassicSelect = (classic: Classic) => {
    setSelectedClassic(classic)
    setSelectedChapter(null)
  }

  const handleChapterSelect = (chapter: Chapter) => {
    setSelectedChapter(chapter)
  }

  const handleBack = () => {
    if (selectedChapter) {
      setSelectedChapter(null)
    } else if (selectedClassic) {
      setSelectedClassic(null)
    }
  }

  return (
    <Layout>
      <Header
        title={selectedChapter ? selectedChapter.title : selectedClassic ? selectedClassic.title : '国学经典'}
        gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
        showBack={!!(selectedClassic || selectedChapter)}
      />

      <div className="main-content chinese-classics-container">
        {!selectedClassic && (
          <>
            {/* 介绍横幅 */}
            <div className="classics-intro">
              <div className="intro-icon">🏮</div>
              <h2 className="intro-title">国学经典</h2>
              <p className="intro-desc">传承千年的智慧结晶,培养品德修养的宝典</p>
            </div>

            {/* 经典列表 */}
            <div className="classics-grid">
              {classics.map((classic) => (
                <div
                  key={classic.id}
                  className="classic-card"
                  style={{ background: classic.bgColor }}
                  onClick={() => handleClassicSelect(classic)}
                >
                  <div className="classic-cover">{classic.cover}</div>
                  <div className="classic-info">
                    <div className="classic-title">{classic.title}</div>
                    <div className="classic-meta">
                      <span className="classic-author">{classic.author}</span>
                      <span className="classic-period">{classic.period}</span>
                    </div>
                    <div className="classic-intro-text">{classic.intro}</div>
                  </div>
                  <div className="classic-action">
                    <span className="action-text">开始阅读</span>
                    <span className="action-arrow">→</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {selectedClassic && !selectedChapter && (
          <>
            {/* 经典详情 */}
            <div className="classic-detail">
              <div className="detail-header" style={{ background: selectedClassic.bgColor }}>
                <div className="detail-cover">{selectedClassic.cover}</div>
                <div className="detail-info">
                  <h2 className="detail-title">{selectedClassic.title}</h2>
                  <div className="detail-meta">
                    <span>作者:{selectedClassic.author}</span>
                    <span>时期:{selectedClassic.period}</span>
                  </div>
                </div>
              </div>

              <div className="detail-intro">
                <h3 className="section-title">📖 作品简介</h3>
                <p className="intro-content">{selectedClassic.intro}</p>
              </div>

              {/* 章节列表 */}
              <div className="chapters-section">
                <h3 className="section-title">📚 章节目录</h3>
                <div className="chapters-grid">
                  {selectedClassic.chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="chapter-card"
                      onClick={() => handleChapterSelect(chapter)}
                    >
                      <div className="chapter-number">{chapter.id}</div>
                      <div className="chapter-title">{chapter.title}</div>
                      <div className="chapter-arrow">→</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {selectedChapter && (
          <>
            {/* 章节内容 */}
            <div className="chapter-content">
              <div className="content-card">
                <h3 className="content-title">📜 原文</h3>
                <div className="content-text original">{selectedChapter.content}</div>
              </div>

              {selectedChapter.translation && (
                <div className="content-card">
                  <h3 className="content-title">💬 译文</h3>
                  <div className="content-text translation">{selectedChapter.translation}</div>
                </div>
              )}

              {/* 导航按钮 */}
              {selectedClassic && (
                <div className="chapter-nav">
                  {selectedClassic.chapters.findIndex(c => c.id === selectedChapter.id) > 0 && (
                    <button
                      className="nav-btn prev"
                      onClick={() => {
                        const prevIndex = selectedClassic.chapters.findIndex(c => c.id === selectedChapter.id) - 1
                        handleChapterSelect(selectedClassic.chapters[prevIndex])
                      }}
                    >
                      ← 上一章
                    </button>
                  )}
                  {selectedClassic.chapters.findIndex(c => c.id === selectedChapter.id) < selectedClassic.chapters.length - 1 && (
                    <button
                      className="nav-btn next"
                      onClick={() => {
                        const nextIndex = selectedClassic.chapters.findIndex(c => c.id === selectedChapter.id) + 1
                        handleChapterSelect(selectedClassic.chapters[nextIndex])
                      }}
                    >
                      下一章 →
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
