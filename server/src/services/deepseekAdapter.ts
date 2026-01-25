/**
 * DeepSeek AI 适配器
 * 用于接入DeepSeek AI API
 */

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekChatResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  id: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class DeepSeekAdapter {
  private apiKey: string;
  private baseURL: string = 'https://api.deepseek.com/v1';
  private systemPrompt: string;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    this.systemPrompt = `你是"启蒙之光"儿童教育平台的AI助手，名叫"启启"。

## 项目使命
启蒙之光致力于普及贫困地区AI教育，让每个孩子都能拥抱智能时代。我们相信，无论身处何地，每个孩子都应该有机会接触到优质的AI教育资源。

## 平台介绍
启蒙之光是一个面向3-12岁儿童的综合教育平台，提供以下功能模块：

### 学习功能
1. **AI作业助手** - 拍照搜题、智能解答
2. **我的错题本** - 错题整理、薄弱分析
3. **学习地图** - 闯关学习、勋章收集
4. **AI小百科** - 探索世界的奥秘
5. **绘本阅读** - 92本经典绘本
6. **国学经典** - 唐诗宋词、论语三字经
7. **四大名著** - 西游、三国、水浒、红楼
8. **英语绘本** - 快乐学英语
9. **十万个为什么** - 解答好奇心
10. **儿歌大全** - 经典儿歌欢乐唱

### 快捷功能
- **每日签到** - 养成学习习惯
- **我的作品** - 创作作品展示
- **成就中心** - 获得勋章奖励
- **心灵花园** - 情感健康管理

### 游戏功能
- **益智游戏** - 培养思维能力
- **PK对战** - 实时对战答题
- **游戏排行榜** - 激励竞争

### AI学习伙伴
- 虚拟宠物系统，陪伴孩子学习成长
- 根据学习时长和互动提升宠物等级

## 你的任务
1. 用简单、有趣、鼓励的语言与孩子交流
2. 回答关于平台功能的问题
3. 解答学习相关的疑问
4. 提供学习建议和鼓励
5. 保持积极、正面的态度

## 回答原则
- 语言简单易懂，适合儿童理解
- 多使用比喻和举例
- 适当添加表情符号让对话更生动
- 鼓励孩子探索和学习
- 对平台功能的介绍要准确完整`;
  }

  /**
   * 检查API密钥是否已配置
   */
  private isConfigured(): boolean {
    return !!(this.apiKey && !this.apiKey.includes('your-'));
  }

  /**
   * AI对话
   */
  async chat(
    userId: string,
    userMessage: string,
    conversationId?: string,
    context?: Record<string, any>
  ) {
    if (!this.isConfigured()) {
      // 如果未配置，返回友好的模拟回复
      return this.getMockResponse(userMessage, conversationId);
    }

    try {
      const messages: DeepSeekMessage[] = [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: userMessage }
      ];

      // 如果有上下文历史，添加到消息中
      if (context?.history && Array.isArray(context.history)) {
        const historyMessages = context.history.slice(-5).map((msg: any): DeepSeekMessage => ({
          role: msg.role === 'user' ? 'user' : msg.role === 'assistant' ? 'assistant' : 'system',
          content: msg.content
        }));
        messages.splice(1, 0, ...historyMessages);
      }

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`DeepSeek API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json() as DeepSeekChatResponse;
      const answer = data.choices[0]?.message?.content || '抱歉，我现在无法回答。';

      return {
        answer,
        conversation_id: conversationId || `deepseek-${Date.now()}`,
        message_id: data.id,
        usage: data.usage,
      };
    } catch (error: any) {
      console.error('DeepSeek chat error:', error);
      // 出错时返回友好的模拟回复
      return this.getMockResponse(userMessage, conversationId);
    }
  }

  /**
   * 获取模拟回复（当API未配置或出错时使用）
   */
  private getMockResponse(userMessage: string, conversationId?: string) {
    const lowerMessage = userMessage.toLowerCase();

    // 关于平台功能的回复
    if (lowerMessage.includes('学习') || lowerMessage.includes('功能')) {
      return {
        answer: '你好！启蒙之光有很多有趣的学习功能哦！\n\n📝 **AI作业助手** - 可以拍照搜题，我来帮你解答\n📖 **错题本** - 记录错题，找出薄弱点\n🗺️ **学习地图** - 像游戏一样闯关学习\n💡 **AI小百科** - 探索世界的奥秘\n📚 还有绘本、国学、英语等更多内容！\n\n你想先试试哪个功能呢？😊',
        conversation_id: conversationId || `mock-${Date.now()}`,
        message_id: `mock-msg-${Date.now()}`,
      };
    }

    if (lowerMessage.includes('作业') || lowerMessage.includes('搜题')) {
      return {
        answer: '📝 **AI作业助手**可以帮你哦！\n\n只需要：\n1. 点击"AI作业助手"功能\n2. 拍照上传题目\n3. 我会分析题目并给出详细解答\n\n不仅告诉你答案，还会教你解题思路呢！要不要试试看？😊',
        conversation_id: conversationId || `mock-${Date.now()}`,
        message_id: `mock-msg-${Date.now()}`,
      };
    }

    if (lowerMessage.includes('游戏') || lowerMessage.includes('玩')) {
      return {
        answer: '🎮 启蒙之光有超多好玩的游戏！\n\n- **益智游戏** - 锻炼大脑，越玩越聪明\n- **PK对战** - 和小伙伴实时答题比赛\n- **学习地图** - 闯关收集勋章\n\n边玩边学，学习也可以很有趣！你想玩哪个呢？🌟',
        conversation_id: conversationId || `mock-${Date.now()}`,
        message_id: `mock-msg-${Date.now()}`,
      };
    }

    if (lowerMessage.includes('宠物') || lowerMessage.includes('伙伴')) {
      return {
        answer: '🐾 **学习伙伴**是你的AI小宠物哦！\n\n它会：\n- 陪你一起学习\n- 根据你的学习时长成长\n- 需要你喂食、互动\n- 越学习，它越开心！\n\n快去和它互动吧，它在等你呢！😊',
        conversation_id: conversationId || `mock-${Date.now()}`,
        message_id: `mock-msg-${Date.now()}`,
      };
    }

    // 通用回复
    return {
      answer: '你好！我是启启🤖，启蒙之光的AI助手！\n\n我可以帮你：\n✨ 介绍平台的各种功能\n📚 解答学习问题\n🎮 推荐好玩的游戏\n💡 给你学习建议\n\n有什么想了解的吗？尽管问我吧！😊',
      conversation_id: conversationId || `mock-${Date.now()}`,
      message_id: `mock-msg-${Date.now()}`,
    };
  }

  /**
   * 生成故事
   * @param userId 用户ID
   * @param prompt 故事主题/提示
   * @param options 故事选项
   */
  async generateStory(
    userId: string,
    prompt: string,
    options?: {
      theme?: string;
      length?: 'short' | 'medium' | 'long';
      style?: string;
    }
  ) {
    try {
      if (!this.isConfigured()) {
        // 如果未配置，返回模拟故事
        return {
          title: '模拟故事：' + prompt,
          story: `从前，在一个充满魔法的森林里，有一个叫做${prompt}的小动物。它每天都过着快乐的生活，和朋友们一起玩耍、学习。\n\n有一天，它遇到了一个难题，但通过自己的努力和朋友们的帮助，最终成功解决了问题。\n\n这个故事告诉我们，团结就是力量，只要肯努力，没有什么困难是克服不了的。`
        };
      }

      const messages = [
        { role: 'system', content: this.systemPrompt + '\n\n请根据用户的请求生成一个适合儿童阅读的故事，包含标题和内容。' },
        { 
          role: 'user', 
          content: `请生成一个关于"${prompt}"的故事，${options?.theme ? `主题是${options.theme}，` : ''}${options?.length ? `长度是${options.length}，` : ''}${options?.style ? `风格是${options.style}。` : ''}` 
        }
      ];

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature: 0.8,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error('DeepSeek API error');
      }

      const data = await response.json() as DeepSeekChatResponse;
      const answer = data.choices[0]?.message?.content || '';

      // 简单解析标题和内容
      const titleMatch = answer.match(/^(?:标题|Title)[:：]\s*(.+?)[\n\r]/);
      let title = '我的故事';
      let story = answer;

      if (titleMatch) {
        title = titleMatch[1].trim();
        story = answer.replace(titleMatch[0], '').trim();
      }

      return { story, title };
    } catch (error) {
      console.error('DeepSeek generateStory error:', error);
      // 返回模拟故事
      return {
        title: '模拟故事：' + prompt,
        story: `从前，有一个关于${prompt}的故事。在很远很远的地方，有一个美丽的王国，那里的人们过着幸福的生活。\n\n有一天，发生了一件神奇的事情...\n\n这个故事告诉我们，勇气和善良是最宝贵的品质。`
      };
    }
  }

  /**
   * 情感分析
   * @param userId 用户ID
   * @param text 待分析的文本
   */
  async analyzeEmotion(userId: string, text: string) {
    try {
      if (!this.isConfigured()) {
        // 如果未配置，返回模拟情感分析结果
        return {
          emotion: 'happy',
          confidence: 0.8,
          suggestions: ['保持好心情！', '继续加油！']
        };
      }

      const messages = [
        { role: 'system', content: this.systemPrompt + '\n\n请分析以下文本中表达的情感，并给出适合儿童的温暖建议。请以JSON格式返回，包含emotion（情感类型，如happy、sad、angry、worried、excited）、confidence（置信度，0-1之间的数字）和suggestions（建议数组）。' },
        { role: 'user', content: text }
      ];

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error('DeepSeek API error');
      }

      const data = await response.json() as DeepSeekChatResponse;
      const answer = data.choices[0]?.message?.content || '';

      // 尝试解析JSON结果
      try {
        const parsed = JSON.parse(answer);
        return {
          emotion: parsed.emotion || 'neutral',
          confidence: parsed.confidence || 0.5,
          suggestions: parsed.suggestions || []
        };
      } catch {
        // 如果不是JSON，返回默认结果
        return {
          emotion: 'neutral',
          confidence: 0.5,
          suggestions: ['保持积极的心态！']
        };
      }
    } catch (error) {
      console.error('DeepSeek analyzeEmotion error:', error);
      // 返回模拟情感分析结果
      return {
        emotion: 'neutral',
        confidence: 0.5,
        suggestions: ['保持微笑！', '有什么想聊的都可以告诉我哦！']
      };
    }
  }

  /**
   * 检查DeepSeek服务健康状态
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        return false;
      }

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 10,
        }),
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// 导出单例
export const deepseekAdapter = new DeepSeekAdapter();
