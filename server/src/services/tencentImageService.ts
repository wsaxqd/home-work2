/**
 * 腾讯云图像识别服务
 * 支持物体识别、场景识别、表情识别等
 */

import crypto from 'crypto';
import axios from 'axios';

interface TencentImageConfig {
  secretId: string;
  secretKey: string;
  region?: string;
}

interface ImageRecognitionResult {
  success: boolean;
  objects?: string[];
  emotions?: string[];
  scenes?: string[];
  confidence?: number;
  description?: string;
  error?: string;
  details?: any;
}

export class TencentImageService {
  private secretId: string;
  private secretKey: string;
  private region: string;

  constructor(config: TencentImageConfig) {
    this.secretId = config.secretId;
    this.secretKey = config.secretKey;
    this.region = config.region || 'ap-guangzhou';
  }

  /**
   * 生成腾讯云API签名 (V3版本)
   */
  private generateSignatureV3(
    service: string,
    action: string,
    payload: string,
    timestamp: number,
    host: string
  ): string {
    const method = 'POST';
    const canonicalUri = '/';
    const canonicalQueryString = '';
    const canonicalHeaders = `content-type:application/json\nhost:${host}\n`;
    const signedHeaders = 'content-type;host';

    const hashedPayload = crypto
      .createHash('sha256')
      .update(payload)
      .digest('hex');

    const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedPayload}`;

    const date = new Date(timestamp * 1000).toISOString().split('T')[0];
    const credentialScope = `${date}/${service}/tc3_request`;
    const hashedCanonicalRequest = crypto
      .createHash('sha256')
      .update(canonicalRequest)
      .digest('hex');

    const stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`;

    const secretDate = crypto
      .createHmac('sha256', `TC3${this.secretKey}`)
      .update(date)
      .digest();
    const secretService = crypto
      .createHmac('sha256', secretDate)
      .update(service)
      .digest();
    const secretSigning = crypto
      .createHmac('sha256', secretService)
      .update('tc3_request')
      .digest();
    const signature = crypto
      .createHmac('sha256', secretSigning)
      .update(stringToSign)
      .digest('hex');

    return signature;
  }

  /**
   * 调用腾讯云API
   */
  private async callTencentAPI(
    service: string,
    action: string,
    params: any,
    host: string
  ): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify(params);

    const signature = this.generateSignatureV3(
      service,
      action,
      payload,
      timestamp,
      host
    );

    const date = new Date(timestamp * 1000).toISOString().split('T')[0];
    const authorization = `TC3-HMAC-SHA256 Credential=${this.secretId}/${date}/${service}/tc3_request, SignedHeaders=content-type;host, Signature=${signature}`;

    try {
      const response = await axios.post(`https://${host}`, params, {
        headers: {
          'Content-Type': 'application/json',
          'Host': host,
          'X-TC-Action': action,
          'X-TC-Version': '2018-03-01',
          'X-TC-Timestamp': timestamp.toString(),
          'X-TC-Region': this.region,
          'Authorization': authorization,
        },
        timeout: 30000,
      });

      return response.data;
    } catch (error: any) {
      console.error('Tencent API call error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * 物体识别
   * @param imageUrl 图片URL
   * @param imageBase64 图片Base64编码（与imageUrl二选一）
   */
  async recognizeObject(imageUrl?: string, imageBase64?: string): Promise<ImageRecognitionResult> {
    try {
      const params: any = {};

      if (imageUrl) {
        params.ImageUrl = imageUrl;
      } else if (imageBase64) {
        params.ImageBase64 = imageBase64;
      } else {
        return {
          success: false,
          error: '请提供图片URL或Base64编码',
        };
      }

      const response = await this.callTencentAPI(
        'tiia',
        'DetectLabel',
        params,
        'tiia.tencentcloudapi.com'
      );

      if (response.Response.Error) {
        return {
          success: false,
          error: response.Response.Error.Message,
        };
      }

      const labels = response.Response.Labels || [];
      const objects = labels.map((label: any) => label.Name);
      const confidence = labels.length > 0 ? labels[0].Confidence / 100 : 0;

      return {
        success: true,
        objects,
        confidence,
        description: objects.length > 0 ? `识别到：${objects.slice(0, 5).join('、')}` : '未识别到物体',
        details: labels,
      };
    } catch (error: any) {
      console.error('Object recognition error:', error);
      return {
        success: false,
        error: error.message || '物体识别失败',
      };
    }
  }

  /**
   * 表情识别
   * @param imageUrl 图片URL
   * @param imageBase64 图片Base64编码（与imageUrl二选一）
   */
  async recognizeEmotion(imageUrl?: string, imageBase64?: string): Promise<ImageRecognitionResult> {
    try {
      const params: any = {};

      if (imageUrl) {
        params.Url = imageUrl;
      } else if (imageBase64) {
        params.Image = imageBase64;
      } else {
        return {
          success: false,
          error: '请提供图片URL或Base64编码',
        };
      }

      const response = await this.callTencentAPI(
        'iai',
        'DetectFace',
        params,
        'iai.tencentcloudapi.com'
      );

      if (response.Response.Error) {
        return {
          success: false,
          error: response.Response.Error.Message,
        };
      }

      const faceInfos = response.Response.FaceInfos || [];

      if (faceInfos.length === 0) {
        return {
          success: true,
          emotions: [],
          confidence: 0,
          description: '未检测到人脸',
        };
      }

      // 获取第一个人脸的表情信息
      const faceInfo = faceInfos[0];
      const faceAttributesInfo = faceInfo.FaceAttributesInfo;

      const emotions: string[] = [];
      let mainEmotion = '中性';
      let confidence = 0;

      if (faceAttributesInfo) {
        // 表情分析
        const emotionMap: { [key: number]: string } = {
          0: '生气',
          1: '厌恶',
          2: '恐惧',
          3: '开心',
          4: '伤心',
          5: '惊讶',
          6: '中性',
        };

        if (faceAttributesInfo.Expression !== undefined) {
          mainEmotion = emotionMap[faceAttributesInfo.Expression] || '中性';
          emotions.push(mainEmotion);
        }

        // 微笑程度
        if (faceAttributesInfo.Smile !== undefined) {
          const smileLevel = faceAttributesInfo.Smile;
          if (smileLevel > 50) {
            emotions.push('微笑');
          }
        }

        confidence = faceInfo.FaceConfidence / 100;
      }

      return {
        success: true,
        emotions: emotions.length > 0 ? emotions : ['中性'],
        confidence,
        description: `检测到表情：${mainEmotion}`,
        details: faceInfos,
      };
    } catch (error: any) {
      console.error('Emotion recognition error:', error);
      return {
        success: false,
        error: error.message || '表情识别失败',
      };
    }
  }

  /**
   * 场景识别
   * @param imageUrl 图片URL
   * @param imageBase64 图片Base64编码（与imageUrl二选一）
   */
  async recognizeScene(imageUrl?: string, imageBase64?: string): Promise<ImageRecognitionResult> {
    try {
      const params: any = {};

      if (imageUrl) {
        params.ImageUrl = imageUrl;
      } else if (imageBase64) {
        params.ImageBase64 = imageBase64;
      } else {
        return {
          success: false,
          error: '请提供图片URL或Base64编码',
        };
      }

      const response = await this.callTencentAPI(
        'tiia',
        'RecognizeScene',
        params,
        'tiia.tencentcloudapi.com'
      );

      if (response.Response.Error) {
        return {
          success: false,
          error: response.Response.Error.Message,
        };
      }

      const sceneLabels = response.Response.SceneLabels || [];
      const scenes = sceneLabels.map((label: any) => label.Name);
      const confidence = sceneLabels.length > 0 ? sceneLabels[0].Confidence / 100 : 0;

      return {
        success: true,
        scenes,
        confidence,
        description: scenes.length > 0 ? `识别到场景：${scenes.slice(0, 3).join('、')}` : '未识别到场景',
        details: sceneLabels,
      };
    } catch (error: any) {
      console.error('Scene recognition error:', error);
      return {
        success: false,
        error: error.message || '场景识别失败',
      };
    }
  }

  /**
   * 通用图像识别（根据任务类型自动选择）
   */
  async recognize(
    taskType: 'object' | 'emotion' | 'scene',
    imageUrl?: string,
    imageBase64?: string
  ): Promise<ImageRecognitionResult> {
    switch (taskType) {
      case 'object':
        return this.recognizeObject(imageUrl, imageBase64);
      case 'emotion':
        return this.recognizeEmotion(imageUrl, imageBase64);
      case 'scene':
        return this.recognizeScene(imageUrl, imageBase64);
      default:
        return {
          success: false,
          error: '不支持的识别类型',
        };
    }
  }
}

/**
 * 获取腾讯云图像识别服务实例
 */
export function getTencentImageService(): TencentImageService {
  const secretId = process.env.TENCENT_SECRET_ID || '';
  const secretKey = process.env.TENCENT_SECRET_KEY || '';
  const region = process.env.TENCENT_REGION || 'ap-guangzhou';

  if (!secretId || !secretKey) {
    throw new Error('腾讯云密钥未配置，请在.env文件中配置TENCENT_SECRET_ID和TENCENT_SECRET_KEY');
  }

  return new TencentImageService({
    secretId,
    secretKey,
    region,
  });
}
