import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';
import { difyAdapter } from './difyAdapter';

export interface StoryOptions {
  theme?: string;
  characters?: string[];
  setting?: string;
  plotType?: 'adventure' | 'mystery' | 'fantasy' | 'science' | 'friendship' | 'family';
  moralLesson?: string;
  length?: 'short' | 'medium' | 'long';
  ageGroup?: string;
}

export interface PoetryOptions {
  topic: string;
  style?: 'nursery-rhyme' | 'haiku' | 'free-verse' | 'acrostic';
  mood?: 'happy' | 'calm' | 'excited' | 'thoughtful';
  length?: number;
}

export interface ArtPromptOptions {
  subject: string;
  style?: 'cartoon' | 'watercolor' | 'pencil' | 'digital' | 'realistic';
  mood?: string;
  colors?: string[];
  details?: string[];
}

export interface CodeGenerationOptions {
  task: string;
  language?: 'scratch' | 'python' | 'javascript';
  difficulty?: number;
  includeComments?: boolean;
}

export class ContentGenerationService {
  /**
   * 生成增强版故事
   */
  async generateEnhancedStory(userId: string, options: StoryOptions) {
    const prompt = this.buildStoryPrompt(options);

    const response = await difyAdapter.completion(
      difyAdapter.getTutoringAppKey(), // 复用tutoring app key或创建新的
      userId,
      {
        prompt,
        theme: options.theme || '冒险',
        characters: (options.characters || []).join('、'),
        setting: options.setting || '神奇的世界',
        plotType: options.plotType || 'adventure',
        moralLesson: options.moralLesson || '',
        length: options.length || 'medium',
        ageGroup: options.ageGroup || '6-8岁',
      }
    );

    // 保存生成记录
    await this.saveGeneration(userId, 'story', options, response.answer);

    return {
      title: this.extractTitle(response.answer),
      content: this.extractContent(response.answer),
      characters: options.characters || [],
      theme: options.theme,
      moralLesson: options.moralLesson,
    };
  }

  /**
   * 生成诗歌/儿歌
   */
  async generatePoetry(userId: string, options: PoetryOptions) {
    const prompt = this.buildPoetryPrompt(options);

    const response = await difyAdapter.completion(
      difyAdapter.getTutoringAppKey(),
      userId,
      {
        prompt,
        topic: options.topic,
        style: options.style || 'nursery-rhyme',
        mood: options.mood || 'happy',
        length: options.length || 4,
      }
    );

    await this.saveGeneration(userId, 'poetry', options, response.answer);

    return {
      title: this.extractTitle(response.answer) || `关于${options.topic}的${this.getStyleName(options.style)}`,
      content: this.extractContent(response.answer),
      style: options.style,
      topic: options.topic,
    };
  }

  /**
   * 生成绘画提示词
   */
  async generateArtPrompt(userId: string, options: ArtPromptOptions) {
    const prompt = this.buildArtPromptText(options);

    const response = await difyAdapter.completion(
      difyAdapter.getTutoringAppKey(),
      userId,
      {
        prompt,
        subject: options.subject,
        style: options.style || 'cartoon',
        mood: options.mood || '快乐',
        colors: (options.colors || []).join('、'),
        details: (options.details || []).join('、'),
      }
    );

    await this.saveGeneration(userId, 'art_prompt', options, response.answer);

    return {
      promptText: response.answer,
      subject: options.subject,
      style: options.style,
      suggestedTools: this.getSuggestedArtTools(options.style),
      tips: this.getArtTips(options.style),
    };
  }

  /**
   * 生成简单编程代码
   */
  async generateCode(userId: string, options: CodeGenerationOptions) {
    const prompt = this.buildCodePrompt(options);

    const response = await difyAdapter.completion(
      difyAdapter.getTutoringAppKey(),
      userId,
      {
        prompt,
        task: options.task,
        language: options.language || 'scratch',
        difficulty: options.difficulty || 1,
        includeComments: options.includeComments !== false,
      }
    );

    await this.saveGeneration(userId, 'code', options, response.answer);

    return {
      code: this.extractCode(response.answer),
      explanation: this.extractExplanation(response.answer),
      language: options.language,
      difficulty: options.difficulty,
      nextSteps: this.getCodeNextSteps(options.language),
    };
  }

  /**
   * 生成学习卡片
   */
  async generateLearningCard(userId: string, topic: string, subject: string) {
    const prompt = `请创建一张关于"${topic}"的学习卡片，科目是${subject}。
要求：
1. 简单明了，适合6-12岁儿童
2. 包含3-5个关键知识点
3. 每个知识点配一个生动的例子或比喻
4. 添加1-2个趣味小测验
返回JSON格式：{"title": "...", "keyPoints": [...], "examples": [...], "quiz": [...]}`;

    const response = await difyAdapter.completion(
      difyAdapter.getTutoringAppKey(),
      userId,
      {
        prompt,
        topic,
        subject,
      }
    );

    await this.saveGeneration(userId, 'learning_card', { topic, subject }, response.answer);

    return this.parseLearningCard(response.answer);
  }

  /**
   * 生成互动故事（分支选择）
   */
  async generateInteractiveStory(userId: string, theme: string, currentChoice?: string) {
    const prompt = currentChoice
      ? `继续互动故事，用户选择了：${currentChoice}。请继续故事并提供新的选择。`
      : `创建一个${theme}主题的互动故事开头，提供2-3个选择让孩子决定故事走向。`;

    const response = await difyAdapter.completion(
      difyAdapter.getTutoringAppKey(),
      userId,
      {
        prompt,
        theme,
        currentChoice: currentChoice || '',
      }
    );

    await this.saveGeneration(userId, 'interactive_story', { theme, currentChoice }, response.answer);

    return this.parseInteractiveStory(response.answer);
  }

  /**
   * 获取用户的生成历史
   */
  async getGenerationHistory(userId: string, type?: string, limit: number = 20) {
    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];

    if (type) {
      whereClause += ' AND generation_type = $2';
      params.push(type);
    }

    const result = await query(
      `SELECT id, generation_type, input_data, output_data, created_at
       FROM ai_generations
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ${limit}`,
      params
    );

    return result.rows;
  }

  /**
   * 点赞生成的内容
   */
  async likeGeneration(userId: string, generationId: string) {
    await query(
      `UPDATE ai_generations
       SET likes = likes + 1
       WHERE id = $1 AND user_id = $2`,
      [generationId, userId]
    );
  }

  // ========== 私有辅助方法 ==========

  /**
   * 保存生成记录
   */
  private async saveGeneration(
    userId: string,
    type: string,
    inputData: any,
    outputData: any
  ) {
    await query(
      `INSERT INTO ai_generations
       (id, user_id, generation_type, input_data, output_data)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
      [userId, type, JSON.stringify(inputData), outputData]
    );
  }

  /**
   * 构建故事生成提示词
   */
  private buildStoryPrompt(options: StoryOptions): string {
    const parts = ['请创作一个儿童故事'];

    if (options.theme) parts.push(`主题是"${options.theme}"`);
    if (options.characters && options.characters.length > 0) {
      parts.push(`主角包括：${options.characters.join('、')}`);
    }
    if (options.setting) parts.push(`故事发生在${options.setting}`);
    if (options.plotType) parts.push(`情节类型是${this.getPlotTypeName(options.plotType)}`);
    if (options.moralLesson) parts.push(`要传达的道理是：${options.moralLesson}`);

    parts.push(`故事长度：${this.getLengthDescription(options.length)}`);
    parts.push(`适合年龄：${options.ageGroup || '6-8岁'}`);

    return parts.join('，') + '。请生成完整的故事，包括标题。';
  }

  /**
   * 构建诗歌生成提示词
   */
  private buildPoetryPrompt(options: PoetryOptions): string {
    return `请创作一首${this.getStyleName(options.style)}，主题是"${options.topic}"，
情感基调是${options.mood || '快乐'}的，
适合6-12岁儿童朗读和理解。
${options.style === 'haiku' ? '请遵循俳句的5-7-5音节格式。' : ''}
${options.length ? `大约${options.length}行。` : ''}`;
  }

  /**
   * 构建绘画提示词
   */
  private buildArtPromptText(options: ArtPromptOptions): string {
    const parts = [`请为儿童绘画创作生成一个详细的绘画提示，主题是"${options.subject}"`];

    if (options.style) parts.push(`风格：${options.style}`);
    if (options.mood) parts.push(`氛围：${options.mood}`);
    if (options.colors && options.colors.length > 0) {
      parts.push(`主要颜色：${options.colors.join('、')}`);
    }
    if (options.details && options.details.length > 0) {
      parts.push(`重要细节：${options.details.join('、')}`);
    }

    parts.push('请用简单易懂的语言描述，适合儿童理解和创作。');

    return parts.join('，');
  }

  /**
   * 构建代码生成提示词
   */
  private buildCodePrompt(options: CodeGenerationOptions): string {
    return `请帮助儿童完成以下编程任务："${options.task}"
编程语言：${options.language || 'Scratch'}
难度等级：${options.difficulty || 1}（1-5级）
${options.includeComments !== false ? '请添加详细的注释说明每一步。' : ''}
要求代码简单易懂，适合儿童学习编程。`;
  }

  /**
   * 提取标题
   */
  private extractTitle(text: string): string {
    const titleMatch = text.match(/^(?:标题|Title)[:：]\s*(.+?)[\n\r]/);
    if (titleMatch) return titleMatch[1].trim();

    // 尝试提取第一行作为标题
    const firstLine = text.split('\n')[0].trim();
    if (firstLine.length < 50) return firstLine;

    return '生成的内容';
  }

  /**
   * 提取内容
   */
  private extractContent(text: string): string {
    const titleMatch = text.match(/^(?:标题|Title)[:：]\s*.+?[\n\r]/);
    if (titleMatch) {
      return text.replace(titleMatch[0], '').trim();
    }
    return text.trim();
  }

  /**
   * 提取代码
   */
  private extractCode(text: string): string {
    const codeMatch = text.match(/```[\w]*\n([\s\S]*?)```/);
    if (codeMatch) return codeMatch[1].trim();

    // 如果没有代码块标记，尝试查找代码部分
    const codeSection = text.match(/(?:代码|Code)[:：]\s*([\s\S]*?)(?:\n\n|$)/);
    if (codeSection) return codeSection[1].trim();

    return text;
  }

  /**
   * 提取解释
   */
  private extractExplanation(text: string): string {
    const explanationMatch = text.match(/(?:解释|说明|Explanation)[:：]\s*([\s\S]*?)$/);
    if (explanationMatch) return explanationMatch[1].trim();

    return '这段代码完成了指定的任务。';
  }

  /**
   * 解析学习卡片
   */
  private parseLearningCard(text: string) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // JSON解析失败
    }

    return {
      title: this.extractTitle(text),
      keyPoints: [],
      examples: [],
      quiz: [],
    };
  }

  /**
   * 解析互动故事
   */
  private parseInteractiveStory(text: string) {
    return {
      content: this.extractContent(text),
      choices: this.extractChoices(text),
    };
  }

  /**
   * 提取选择项
   */
  private extractChoices(text: string): string[] {
    const choices: string[] = [];
    const choiceMatches = text.matchAll(/(?:选项|选择|Choice)\s*(\d+)[:：]\s*(.+?)(?:\n|$)/gi);

    for (const match of choiceMatches) {
      choices.push(match[2].trim());
    }

    return choices.length > 0 ? choices : ['继续阅读'];
  }

  /**
   * 获取情节类型名称
   */
  private getPlotTypeName(type?: string): string {
    const names: Record<string, string> = {
      adventure: '冒险探索',
      mystery: '神秘解谜',
      fantasy: '奇幻魔法',
      science: '科学探索',
      friendship: '友谊成长',
      family: '家庭温情',
    };
    return names[type || ''] || '冒险探索';
  }

  /**
   * 获取长度描述
   */
  private getLengthDescription(length?: string): string {
    const descriptions: Record<string, string> = {
      short: '300-500字',
      medium: '500-800字',
      long: '800-1200字',
    };
    return descriptions[length || 'medium'] || '500-800字';
  }

  /**
   * 获取诗歌风格名称
   */
  private getStyleName(style?: string): string {
    const names: Record<string, string> = {
      'nursery-rhyme': '儿歌',
      'haiku': '俳句',
      'free-verse': '自由诗',
      'acrostic': '藏头诗',
    };
    return names[style || 'nursery-rhyme'] || '儿歌';
  }

  /**
   * 获取推荐的绘画工具
   */
  private getSuggestedArtTools(style?: string): string[] {
    const tools: Record<string, string[]> = {
      cartoon: ['彩色铅笔', '马克笔', '水彩笔'],
      watercolor: ['水彩颜料', '水彩纸', '画笔'],
      pencil: ['铅笔', '橡皮', '素描纸'],
      digital: ['平板电脑', '绘画APP', '触控笔'],
      realistic: ['铅笔', '彩色铅笔', '细节笔'],
    };
    return tools[style || 'cartoon'] || ['彩色铅笔', '画纸'];
  }

  /**
   * 获取绘画技巧
   */
  private getArtTips(style?: string): string[] {
    const tips: Record<string, string[]> = {
      cartoon: ['用简单的形状开始', '大胆使用鲜艳的颜色', '夸张表情会更有趣'],
      watercolor: ['先画淡色，再加深', '等上一层干了再涂下一层', '留白也很重要'],
      pencil: ['轻轻画草稿', '用不同力度表现明暗', '注意阴影的方向'],
      digital: ['多用图层功能', '试试不同的笔刷', '善用撤销功能'],
      realistic: ['仔细观察细节', '注意光影关系', '慢慢来，不要着急'],
    };
    return tips[style || 'cartoon'] || ['慢慢来，享受创作的过程'];
  }

  /**
   * 获取编程下一步建议
   */
  private getCodeNextSteps(language?: string): string[] {
    const steps: Record<string, string[]> = {
      scratch: ['试试添加音效', '让角色动起来', '添加更多互动'],
      python: ['试试用循环简化代码', '添加更多功能', '学习使用函数'],
      javascript: ['在浏览器中运行试试', '添加按钮和交互', '学习DOM操作'],
    };
    return steps[language || 'scratch'] || ['继续练习', '尝试修改代码看看效果'];
  }
}

export const contentGenerationService = new ContentGenerationService();
