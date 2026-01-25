import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import { UsageTracker } from '../services/usageTracking'
import { favoritesApi } from '../services/api/favorites'
import { useToast } from '../components/Toast'
import './PictureBook.css'

interface Book {
  id: number
  title: string
  author: string
  cover: string
  ageGroup: string
  summary: string
  themes: string[]
  rating: number
}

// 0-3岁绘本
const books0to3: Book[] = [
  { id: 1, title: '小熊宝宝绘本系列', author: '蒲蒲兰', cover: '🐻', ageGroup: '0-3岁', summary: '培养生活习惯的启蒙绘本，包含《你好》《拉巴巴》《睡觉了》等15册', themes: ['生活习惯', '认知启蒙'], rating: 5 },
  { id: 2, title: '噼里啪啦系列', author: '佐佐木洋子', cover: '📖', ageGroup: '0-3岁', summary: '翻翻书，让宝宝了解日常生活，培养良好习惯', themes: ['翻翻书', '生活认知'], rating: 5 },
  { id: 3, title: '小玻翻翻书', author: '艾力克·希尔', cover: '🐶', ageGroup: '0-3岁', summary: '小狗波的冒险故事，培养宝宝动手能力', themes: ['互动游戏', '认知能力'], rating: 5 },
  { id: 4, title: '好饿的毛毛虫', author: '艾瑞·卡尔', cover: '🐛', ageGroup: '0-3岁', summary: '经典洞洞书，讲述毛毛虫变蝴蝶的故事', themes: ['自然科学', '成长故事'], rating: 5 },
  { id: 5, title: '棕色的熊', author: '比尔·马丁', cover: '🐻', ageGroup: '0-3岁', summary: '色彩鲜艳的动物认知绘本', themes: ['颜色认知', '动物认知'], rating: 5 },
  { id: 6, title: '小蓝和小黄', author: '李欧·李奥尼', cover: '🔵', ageGroup: '0-3岁', summary: '用颜色讲述友谊的故事', themes: ['友谊', '颜色认知'], rating: 5 },
  { id: 7, title: '抱抱', author: '杰兹·阿波罗', cover: '🤗', ageGroup: '0-3岁', summary: '几乎无字的温暖绘本，表达爱的拥抱', themes: ['情感表达', '亲子关系'], rating: 5 },
  { id: 8, title: '小金鱼逃走了', author: '五味太郎', cover: '🐠', ageGroup: '0-3岁', summary: '找找游戏，锻炼观察力', themes: ['视觉游戏', '观察力'], rating: 5 },
  { id: 9, title: '月亮的味道', author: '麦克·格雷涅茨', cover: '🌙', ageGroup: '0-3岁', summary: '动物们想尝尝月亮的味道', themes: ['想象力', '合作'], rating: 5 },
  { id: 10, title: '小鸡球球系列', author: '入山智', cover: '🐥', ageGroup: '0-3岁', summary: '可爱的小鸡球球的成长故事', themes: ['成长故事', '情感启蒙'], rating: 5 },
  { id: 11, title: '脸，脸，各种各样的脸', author: '柳原良平', cover: '😊', ageGroup: '0-3岁', summary: '认识各种表情和情绪', themes: ['情绪认知', '表情识别'], rating: 5 },
  { id: 12, title: '小手翻翻·认知', author: '巧巧兔', cover: '👋', ageGroup: '0-3岁', summary: '互动翻翻书，认知启蒙', themes: ['认知启蒙', '互动游戏'], rating: 4 },
  { id: 13, title: '小兔汤姆系列', author: '玛丽-阿丽娜·巴文', cover: '🐰', ageGroup: '0-3岁', summary: '小兔汤姆的日常生活故事', themes: ['生活教育', '情绪管理'], rating: 5 },
  { id: 14, title: '我爸爸', author: '安东尼·布朗', cover: '👨', ageGroup: '0-3岁', summary: '表达对爸爸的爱和崇拜', themes: ['亲子关系', '情感表达'], rating: 5 },
  { id: 15, title: '我妈妈', author: '安东尼·布朗', cover: '👩', ageGroup: '0-3岁', summary: '表达对妈妈的爱和感恩', themes: ['亲子关系', '情感表达'], rating: 5 },
  // 新增国内经典绘本
  { id: 16, title: '团圆', author: '余丽琼', cover: '🏮', ageGroup: '0-3岁', summary: '过年回家团圆的温情故事', themes: ['传统节日', '亲情'], rating: 5 },
  { id: 17, title: '一园青菜成了精', author: '北方童谣', cover: '🥬', ageGroup: '0-3岁', summary: '蔬菜们打架的有趣童谣', themes: ['传统文化', '趣味'], rating: 5 },
  { id: 18, title: '萝卜回来了', author: '方轶群', cover: '🥕', ageGroup: '0-3岁', summary: '分享与关爱的经典故事', themes: ['分享', '友爱'], rating: 5 },
  { id: 19, title: '小蝌蚪找妈妈', author: '方惠珍', cover: '🐸', ageGroup: '0-3岁', summary: '经典国产动画改编绘本', themes: ['成长', '亲情'], rating: 5 },
  { id: 20, title: '小黑鱼游大海', author: '曹文轩', cover: '🐟', ageGroup: '0-3岁', summary: '勇敢探索的小黑鱼', themes: ['勇气', '探索'], rating: 5 },
  { id: 21, title: '荷花镇的早市', author: '周翔', cover: '🌸', ageGroup: '0-3岁', summary: '中国传统市集的热闹场景', themes: ['传统文化', '生活'], rating: 5 },
  { id: 22, title: '小猪唏哩呼噜', author: '孙幼军', cover: '🐷', ageGroup: '0-3岁', summary: '憨厚可爱的小猪冒险记', themes: ['冒险', '幽默'], rating: 5 },
  { id: 23, title: '神笔马良', author: '洪汛涛', cover: '🖌️', ageGroup: '0-3岁', summary: '经典神话故事', themes: ['传统故事', '正义'], rating: 5 },
  { id: 24, title: '十二生肖的故事', author: '赖马', cover: '🐉', ageGroup: '0-3岁', summary: '生肖动物的有趣传说', themes: ['传统文化', '认知'], rating: 5 },
  { id: 25, title: '我有友情要出租', author: '方素珍', cover: '🐻', ageGroup: '0-3岁', summary: '大猩猩寻找朋友的故事', themes: ['友谊', '孤独'], rating: 5 },
  { id: 26, title: '云朵面包', author: '白希那', cover: '☁️', ageGroup: '0-3岁', summary: '奇幻温馨的早餐故事', themes: ['想象力', '家庭'], rating: 5 },
  { id: 27, title: '三个强盗', author: '汤米·温格尔', cover: '🎩', ageGroup: '0-3岁', summary: '强盗变好人的温情故事', themes: ['善良', '改变'], rating: 5 },
  { id: 28, title: '雪孩子', author: '嵇鸿', cover: '⛄', ageGroup: '0-3岁', summary: '感人至深的经典国产绘本', themes: ['友谊', '奉献'], rating: 5 },
]

// 3-6岁绘本
const books3to6: Book[] = [
  { id: 101, title: '猜猜我有多爱你', author: '山姆·麦克布雷尼', cover: '🐰', ageGroup: '3-6岁', summary: '大兔子和小兔子比赛谁更爱对方', themes: ['爱的表达', '亲子关系'], rating: 5 },
  { id: 102, title: '逃家小兔', author: '玛格丽特·怀兹·布朗', cover: '🐰', ageGroup: '3-6岁', summary: '小兔子想逃跑，妈妈总能找到他', themes: ['母爱', '安全感'], rating: 5 },
  { id: 103, title: '爷爷一定有办法', author: '菲比·吉尔曼', cover: '🧵', ageGroup: '3-6岁', summary: '爷爷把毯子变成各种有用的东西', themes: ['智慧', '环保'], rating: 5 },
  { id: 104, title: '花婆婆', author: '芭芭拉·库尼', cover: '🌸', ageGroup: '3-6岁', summary: '做一件让世界变美丽的事情', themes: ['梦想', '奉献'], rating: 5 },
  { id: 105, title: '失落的一角', author: '谢尔·希尔弗斯坦', cover: '⭕', ageGroup: '3-6岁', summary: '寻找失落的一角的旅程', themes: ['自我认知', '成长'], rating: 5 },
  { id: 106, title: '活了100万次的猫', author: '佐野洋子', cover: '🐱', ageGroup: '3-6岁', summary: '关于生命和爱的哲理故事', themes: ['生命意义', '爱'], rating: 5 },
  { id: 107, title: '小黑鱼', author: '李欧·李奥尼', cover: '🐟', ageGroup: '3-6岁', summary: '团结就是力量的故事', themes: ['勇气', '团结'], rating: 5 },
  { id: 108, title: '大卫，不可以', author: '大卫·香农', cover: '👦', ageGroup: '3-6岁', summary: '调皮的大卫总是闯祸', themes: ['规则教育', '成长'], rating: 5 },
  { id: 109, title: '菲菲生气了', author: '莫莉·卡', cover: '😠', ageGroup: '3-6岁', summary: '学会管理自己的情绪', themes: ['情绪管理', '自我调节'], rating: 5 },
  { id: 110, title: '鳄鱼怕怕牙医怕怕', author: '五味太郎', cover: '🐊', ageGroup: '3-6岁', summary: '鳄鱼和牙医的有趣故事', themes: ['换位思考', '看牙齿'], rating: 5 },
  { id: 111, title: '我的情绪小怪兽', author: '安娜·耶纳斯', cover: '👾', ageGroup: '3-6岁', summary: '帮助孩子认识和管理情绪', themes: ['情绪认知', '情绪管理'], rating: 5 },
  { id: 112, title: '勇气', author: '伯纳德·韦伯', cover: '💪', ageGroup: '3-6岁', summary: '什么是真正的勇气', themes: ['勇气', '成长'], rating: 5 },
  { id: 113, title: '阿莫的生病日', author: '菲利普·斯蒂德', cover: '🤒', ageGroup: '3-6岁', summary: '朋友之间的关爱', themes: ['友谊', '关爱'], rating: 5 },
  { id: 114, title: '母鸡萝丝去散步', author: '佩特·哈群斯', cover: '🐔', ageGroup: '3-6岁', summary: '幽默有趣的追逐故事', themes: ['幽默', '观察力'], rating: 5 },
  { id: 115, title: '彩虹色的花', author: '麦克·格雷涅茨', cover: '🌈', ageGroup: '3-6岁', summary: '分享与奉献的美丽故事', themes: ['分享', '友善'], rating: 5 },
  { id: 116, title: '石头汤', author: '琼·穆特', cover: '🥘', ageGroup: '3-6岁', summary: '分享带来快乐的禅意故事', themes: ['分享', '智慧'], rating: 5 },
  { id: 117, title: '野兽国', author: '莫里斯·桑达克', cover: '👹', ageGroup: '3-6岁', summary: '小男孩的想象世界冒险', themes: ['想象力', '情绪释放'], rating: 5 },
  { id: 118, title: '子儿，吐吐', author: '李瑾伦', cover: '🍉', ageGroup: '3-6岁', summary: '小猪吞下西瓜籽的担心', themes: ['想象力', '幽默'], rating: 5 },
  { id: 119, title: '下雨了', author: '汤姆牛', cover: '☔', ageGroup: '3-6岁', summary: '雨天的奇妙冒险', themes: ['想象力', '自然'], rating: 5 },
  { id: 120, title: '11只猫做苦工', author: '马场登', cover: '🐱', ageGroup: '3-6岁', summary: '11只猫的有趣冒险', themes: ['团队合作', '幽默'], rating: 5 },
  // 新增国内经典绘本
  { id: 121, title: '安的种子', author: '王早早', cover: '🌱', ageGroup: '3-6岁', summary: '用心等待生命成长的智慧', themes: ['耐心', '生命'], rating: 5 },
  { id: 122, title: '不一样的卡梅拉', author: '克利斯提昂·约里波瓦', cover: '🐔', ageGroup: '3-6岁', summary: '勇敢追梦的小鸡卡梅拉', themes: ['梦想', '勇气'], rating: 5 },
  { id: 123, title: '小威向前冲', author: '尼古拉斯·艾伦', cover: '🏊', ageGroup: '3-6岁', summary: '生命起源的有趣故事', themes: ['生命教育', '知识'], rating: 5 },
  { id: 124, title: '北京的春节', author: '于大武', cover: '🧧', ageGroup: '3-6岁', summary: '老北京春节习俗', themes: ['传统文化', '节日'], rating: 5 },
  { id: 125, title: '桃花源的故事', author: '蔡皋', cover: '🌺', ageGroup: '3-6岁', summary: '桃花源记的美丽诠释', themes: ['传统文化', '美好'], rating: 5 },
  { id: 126, title: '中国年', author: '罗嘉吉', cover: '🎆', ageGroup: '3-6岁', summary: '过年习俗大集合', themes: ['传统节日', '文化'], rating: 5 },
  { id: 127, title: '叶子小屋', author: '保冬妮', cover: '🍂', ageGroup: '3-6岁', summary: '爷爷与孙女的温情故事', themes: ['亲情', '自然'], rating: 5 },
  { id: 128, title: '门神贴哪里', author: '孙立新', cover: '🚪', ageGroup: '3-6岁', summary: '传统门神的故事', themes: ['传统文化', '节日'], rating: 5 },
  { id: 129, title: '盘中餐', author: '于虹呈', cover: '🌾', ageGroup: '3-6岁', summary: '粒粒皆辛苦的深刻体验', themes: ['珍惜', '劳动'], rating: 5 },
  { id: 130, title: '灶王爷', author: '熊亮', cover: '🔥', ageGroup: '3-6岁', summary: '灶王爷上天的传说', themes: ['传统文化', '民俗'], rating: 5 },
  { id: 131, title: '荷花', author: '叶圣陶', cover: '🪷', ageGroup: '3-6岁', summary: '经典散文改编绘本', themes: ['自然', '美好'], rating: 5 },
  { id: 132, title: '老虎外婆', author: '杨永青', cover: '🐯', ageGroup: '3-6岁', summary: '经典民间故事', themes: ['传统故事', '智慧'], rating: 5 },
  { id: 133, title: '月光男孩', author: '余丽琼', cover: '🌙', ageGroup: '3-6岁', summary: '中秋节的美丽传说', themes: ['传统节日', '想象'], rating: 5 },
  { id: 134, title: '二十四节气的故事', author: '保冬妮', cover: '☀️', ageGroup: '3-6岁', summary: '中国传统节气科普', themes: ['传统文化', '自然'], rating: 5 },
]

// 6-12岁绘本
const books6to12: Book[] = [
  { id: 201, title: '神奇飞书', author: '威廉·乔伊斯', cover: '📚', ageGroup: '6-12岁', summary: '关于书籍和阅读的魔幻故事', themes: ['阅读', '想象力'], rating: 5 },
  { id: 202, title: '市场街最后一站', author: '马特·德拉佩尼亚', cover: '🚌', ageGroup: '6-12岁', summary: '教会孩子感恩和发现美好', themes: ['感恩', '美好'], rating: 5 },
  { id: 203, title: '图书馆狮子', author: '米歇尔·努森', cover: '🦁', ageGroup: '6-12岁', summary: '规则与友谊的温暖故事', themes: ['规则', '友谊'], rating: 5 },
  { id: 204, title: '獾的礼物', author: '苏珊·华莱', cover: '🦡', ageGroup: '6-12岁', summary: '关于死亡和怀念的温柔故事', themes: ['生命教育', '怀念'], rating: 5 },
  { id: 205, title: '爱心树', author: '谢尔·希尔弗斯坦', cover: '🌳', ageGroup: '6-12岁', summary: '无私奉献的大树和男孩', themes: ['爱', '奉献'], rating: 5 },
  { id: 206, title: '犟龟', author: '米切尔·恩德', cover: '🐢', ageGroup: '6-12岁', summary: '坚持就会有收获', themes: ['坚持', '梦想'], rating: 5 },
  { id: 207, title: '勇敢的克兰西', author: '露西·贝尔', cover: '🐄', ageGroup: '6-12岁', summary: '克服恐惧，勇敢做自己', themes: ['勇气', '自信'], rating: 5 },
  { id: 208, title: '小房子', author: '维吉尼亚·李·伯顿', cover: '🏠', ageGroup: '6-12岁', summary: '时代变迁中的小房子', themes: ['环保', '变化'], rating: 5 },
  { id: 209, title: '极地特快', author: '克里斯·范·奥尔斯伯格', cover: '🚂', ageGroup: '6-12岁', summary: '相信圣诞节魔法的旅程', themes: ['相信', '魔法'], rating: 5 },
  { id: 210, title: '疯狂星期二', author: '大卫·威斯纳', cover: '🐸', ageGroup: '6-12岁', summary: '无字书，青蛙飞上天的奇幻故事', themes: ['想象力', '幽默'], rating: 5 },
  { id: 211, title: '阿文的小毯子', author: '凯文·汉克斯', cover: '🧸', ageGroup: '6-12岁', summary: '如何克服依赖心理', themes: ['成长', '独立'], rating: 5 },
  { id: 212, title: '生气的亚瑟', author: '海文·欧瑞', cover: '😤', ageGroup: '6-12岁', summary: '理解和管理愤怒情绪', themes: ['情绪管理', '理解'], rating: 5 },
  { id: 213, title: '嘉嘉', author: '汤米·温格尔', cover: '🦎', ageGroup: '6-12岁', summary: '变色龙寻找自我的故事', themes: ['自我认同', '接纳'], rating: 5 },
  { id: 214, title: '小鲁的池塘', author: '伊芙·邦廷', cover: '🌊', ageGroup: '6-12岁', summary: '面对失去和怀念', themes: ['生命教育', '纪念'], rating: 5 },
  { id: 215, title: '先左脚再右脚', author: '汤米·狄波拉', cover: '👴', ageGroup: '6-12岁', summary: '祖孙情深的感人故事', themes: ['亲情', '陪伴'], rating: 5 },
  // 新增国内经典绘本
  { id: 216, title: '草房子', author: '曹文轩', cover: '🏡', ageGroup: '6-12岁', summary: '乡村少年的成长故事', themes: ['成长', '友情'], rating: 5 },
  { id: 217, title: '西游记绘本', author: '吴承恩', cover: '🐵', ageGroup: '6-12岁', summary: '四大名著经典改编', themes: ['传统文化', '冒险'], rating: 5 },
  { id: 218, title: '三国演义绘本', author: '罗贯中', cover: '⚔️', ageGroup: '6-12岁', summary: '英雄豪杰的智慧故事', themes: ['传统文化', '历史'], rating: 5 },
  { id: 219, title: '水浒传绘本', author: '施耐庵', cover: '🦸', ageGroup: '6-12岁', summary: '梁山好汉的侠义故事', themes: ['传统文化', '正义'], rating: 5 },
  { id: 220, title: '红楼梦绘本', author: '曹雪芹', cover: '🏮', ageGroup: '6-12岁', summary: '古典名著少儿版', themes: ['传统文化', '诗意'], rating: 5 },
  { id: 221, title: '大闹天宫', author: '李慕白', cover: '👑', ageGroup: '6-12岁', summary: '孙悟空大闹天宫的故事', themes: ['传统故事', '勇敢'], rating: 5 },
  { id: 222, title: '哪吒闹海', author: '包蕾', cover: '🔱', ageGroup: '6-12岁', summary: '哪吒除恶扬善的传说', themes: ['传统故事', '正义'], rating: 5 },
  { id: 223, title: '愚公移山', author: '田原', cover: '⛰️', ageGroup: '6-12岁', summary: '坚持不懈的精神', themes: ['传统故事', '毅力'], rating: 5 },
  { id: 224, title: '精卫填海', author: '熊亮', cover: '🌊', ageGroup: '6-12岁', summary: '中国古代神话', themes: ['传统故事', '坚持'], rating: 5 },
  { id: 225, title: '盘古开天辟地', author: '刘兴诗', cover: '🌍', ageGroup: '6-12岁', summary: '创世神话故事', themes: ['传统故事', '神话'], rating: 5 },
  { id: 226, title: '女娲补天', author: '梁培龙', cover: '🪨', ageGroup: '6-12岁', summary: '女娲拯救世界的传说', themes: ['传统故事', '勇敢'], rating: 5 },
  { id: 227, title: '后羿射日', author: '阿英', cover: '🌞', ageGroup: '6-12岁', summary: '英雄后羿的故事', themes: ['传统故事', '英雄'], rating: 5 },
  { id: 228, title: '嫦娥奔月', author: '王早早', cover: '🌕', ageGroup: '6-12岁', summary: '中秋节传说故事', themes: ['传统故事', '节日'], rating: 5 },
  { id: 229, title: '牛郎织女', author: '叶限', cover: '🌌', ageGroup: '6-12岁', summary: '七夕节的爱情传说', themes: ['传统故事', '爱情'], rating: 5 },
  { id: 230, title: '白蛇传', author: '田螺姑娘', cover: '🐍', ageGroup: '6-12岁', summary: '白娘子与许仙的故事', themes: ['传统故事', '爱情'], rating: 5 },
]

export default function PictureBook() {
  const toast = useToast()
  const navigate = useNavigate()
  const [selectedAge, setSelectedAge] = useState<'0-3' | '3-6' | '6-12'>('0-3')
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [isFavoriting, setIsFavoriting] = useState(false)
  const usageTrackerRef = useRef<UsageTracker | null>(null)

  const getCurrentBooks = () => {
    switch (selectedAge) {
      case '0-3': return books0to3
      case '3-6': return books3to6
      case '6-12': return books6to12
      default: return books0to3
    }
  }

  const books = getCurrentBooks()

  // 清理追踪器
  useEffect(() => {
    return () => {
      if (usageTrackerRef.current) {
        usageTrackerRef.current.end()
        usageTrackerRef.current = null
      }
    }
  }, [])

  // 开始阅读书籍
  const handleBookClick = (book: Book) => {
    setSelectedBook(book)
    // 启动使用追踪
    usageTrackerRef.current = new UsageTracker('阅读', `绘本-${book.title}`, {
      bookId: book.id,
      ageGroup: book.ageGroup,
      author: book.author,
      themes: book.themes
    })
    usageTrackerRef.current.start()
  }

  // 关闭书籍详情
  const handleCloseBook = () => {
    // 记录阅读数据
    if (usageTrackerRef.current && selectedBook) {
      usageTrackerRef.current.end(undefined, {
        completed: false // 未完成阅读
      })
      usageTrackerRef.current = null
    }
    setSelectedBook(null)
  }

  // 开始阅读按钮
  const handleStartReading = () => {
    if (!selectedBook) return

    // 记录进入阅读
    if (usageTrackerRef.current) {
      usageTrackerRef.current.end(undefined, {
        action: 'enter_reader'
      })
      usageTrackerRef.current = null
    }

    // 跳转到绘本阅读器
    navigate('/picture-book-reader', {
      state: {
        bookId: selectedBook.id,
        bookTitle: selectedBook.title
      }
    })
  }

  // 收藏绘本
  const handleFavorite = async () => {
    if (!selectedBook || isFavoriting) return

    setIsFavoriting(true)

    try {
      if (isFavorited) {
        // 取消收藏
        setIsFavorited(false)
        toast.success('已取消收藏')
      } else {
        // 添加收藏
        await favoritesApi.addFavorite({
          itemType: 'picture_book',
          itemId: `book_${selectedBook.id}`,
          itemTitle: selectedBook.title,
          itemContent: `${selectedBook.author} | ${selectedBook.summary.substring(0, 100)}`,
        })
        setIsFavorited(true)
        toast.success('收藏成功!')
      }
    } catch (err: any) {
      console.error('Favorite error:', err)
      toast.info(err.message || '操作失败，请重试')
    } finally {
      setIsFavoriting(false)
    }
  }

  return (
    <Layout>
      <Header title="绘本阅读" gradient="linear-gradient(135deg, #3498db 0%, #2ecc71 100%)" />

      <div className="main-content">
        {/* 阅读专区快捷入口 */}
        <div className="reading-tools">
          <div
            className="tool-card classics"
            onClick={() => navigate('/chinese-classics')}
          >
            <div className="tool-icon">📜</div>
            <div className="tool-info">
              <div className="tool-title">国学经典</div>
              <div className="tool-desc">唐诗宋词·论语三字经</div>
            </div>
            <div className="tool-arrow">→</div>
          </div>
          <div
            className="tool-card four-classics"
            onClick={() => navigate('/four-classics')}
          >
            <div className="tool-icon">📚</div>
            <div className="tool-info">
              <div className="tool-title">四大名著</div>
              <div className="tool-desc">西游·三国·水浒·红楼</div>
            </div>
            <div className="tool-arrow">→</div>
          </div>
          <div
            className="tool-card english"
            onClick={() => navigate('/english-book')}
          >
            <div className="tool-icon">🌍</div>
            <div className="tool-info">
              <div className="tool-title">英语绘本</div>
              <div className="tool-desc">快乐学英语</div>
            </div>
            <div className="tool-arrow">→</div>
          </div>
        </div>

        {/* 年龄段选择 */}
        <div className="age-selector">
          <button
            className={`age-btn ${selectedAge === '0-3' ? 'active' : ''}`}
            onClick={() => setSelectedAge('0-3')}
          >
            <span className="age-icon">👶</span>
            <span className="age-label">0-3岁</span>
            <span className="age-count">{books0to3.length}本</span>
          </button>
          <button
            className={`age-btn ${selectedAge === '3-6' ? 'active' : ''}`}
            onClick={() => setSelectedAge('3-6')}
          >
            <span className="age-icon">🧒</span>
            <span className="age-label">3-6岁</span>
            <span className="age-count">{books3to6.length}本</span>
          </button>
          <button
            className={`age-btn ${selectedAge === '6-12' ? 'active' : ''}`}
            onClick={() => setSelectedAge('6-12')}
          >
            <span className="age-icon">👦</span>
            <span className="age-label">6-12岁</span>
            <span className="age-count">{books6to12.length}本</span>
          </button>
        </div>

        {/* 绘本列表 */}
        <div className="books-grid">
          {books.map((book) => (
            <div
              key={book.id}
              className="book-card"
              onClick={() => handleBookClick(book)}
            >
              <div className="book-cover">{book.cover}</div>
              <div className="book-info">
                <h3 className="book-title">{book.title}</h3>
                <p className="book-author">作者：{book.author}</p>
                <div className="book-rating">
                  {'⭐'.repeat(book.rating)}
                </div>
                <div className="book-themes">
                  {book.themes.slice(0, 2).map((theme, idx) => (
                    <span key={idx} className="theme-tag">{theme}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 绘本详情弹窗 */}
        {selectedBook && (
          <div className="book-detail-modal" onClick={handleCloseBook}>
            <div className="book-detail-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={handleCloseBook}>✕</button>

              <div className="detail-header">
                <div className="detail-cover">{selectedBook.cover}</div>
                <div className="detail-info">
                  <h2>{selectedBook.title}</h2>
                  <p className="detail-author">作者：{selectedBook.author}</p>
                  <p className="detail-age">适合年龄：{selectedBook.ageGroup}</p>
                  <div className="detail-rating">
                    {'⭐'.repeat(selectedBook.rating)}
                  </div>
                </div>
              </div>

              <div className="detail-body">
                <h4>内容简介</h4>
                <p className="detail-summary">{selectedBook.summary}</p>

                <h4>主题标签</h4>
                <div className="detail-themes">
                  {selectedBook.themes.map((theme, idx) => (
                    <span key={idx} className="theme-badge">{theme}</span>
                  ))}
                </div>

                <div className="action-buttons">
                  <button className="btn-primary" onClick={handleStartReading}>开始阅读</button>
                  <button
                    className={`btn-secondary ${isFavorited ? 'favorited' : ''}`}
                    onClick={handleFavorite}
                    disabled={isFavoriting}
                  >
                    {isFavorited ? '❤️ 已收藏' : '🤍 收藏'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
