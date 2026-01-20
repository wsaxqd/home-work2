/**
 * 腾讯云OCR服务
 * 支持通用文字识别、数学公式识别、作业题目识别
 */

import crypto from 'crypto';
import axios from 'axios';

interface TencentOCRConfig {
  secretId: string;
  secretKey: string;
  region?: string;
}

interface OCRResult {
  success: boolean;
  text: string;
  confidence: number;
  details?: any;
  error?: string;
}

export class TencentOCRService {
  private secretId: string;
  private secretKey: string;
  private region: string;
  private endpoint: string;

  constructor(config: TencentOCRConfig) {
    this.secretId = config.secretId;
    this.secretKey = config.secretKey;
    this.region = config.region || 'ap-guangzhou';
    this.endpoint = 'ocr.tencentcloudapi.com';
  }

  /**
   * 生成腾讯云API签名
   */
  private generateSignature(
    action: string,
    params: any,
    timestamp: number
  ): string {
    const method = 'POST';
    const canonicalUri = '/';
    const canonicalQueryString = '';
    const canonicalHeaders = `content-type:application/json\nhost:${this.endpoint}\n`;
    const signedHeaders = 'content-type;host';
    const payload = JSON.stringify(params);
    const hashedPayload = crypto
      .createHash('sha256')
      .update(payload)
      .digest('hex');

    const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedPayload}`;

    const date = new Date(timestamp * 1000).toISOString().split('T')[0];
    const credentialScope = `${date}/ocr/tc3_request`;
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
      .update('ocr')
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
   * 通用文字识别(高精度版)
   */
  async recognizeGeneral(imageBase64: string): Promise<OCRResult> {
    try {
      const action = 'GeneralAccurateOCR';
      const timestamp = Math.floor(Date.now() / 1000);
      const params = {
        ImageBase64: imageBase64,
      };

      const signature = this.generateSignature(action, params, timestamp);
      const authorization = `TC3-HMAC-SHA256 Credential=${this.secretId}/${new Date(timestamp * 1000).toISOString().split('T')[0]}/ocr/tc3_request, SignedHeaders=content-type;host, Signature=${signature}`;

      const response = await axios.post(
        `https://${this.endpoint}`,
        params,
        {
          headers: {
            'Content-Type': 'application/json',
            'Host': this.endpoint,
            'X-TC-Action': action,
            'X-TC-Version': '2018-11-19',
            'X-TC-Region': this.region,
            'X-TC-Timestamp': timestamp.toString(),
            'Authorization': authorization,
          },
        }
      );

      if (response.data.Response.Error) {
        throw new Error(response.data.Response.Error.Message);
      }

      const textDetections = response.data.Response.TextDetections || [];
      const fullText = textDetections.map((item: any) => item.DetectedText).join('\n');
      const avgConfidence = textDetections.length > 0
        ? textDetections.reduce((sum: number, item: any) => sum + item.Confidence, 0) / textDetections.length
        : 0;

      return {
        success: true,
        text: fullText,
        confidence: avgConfidence,
        details: response.data.Response,
      };
    } catch (error: any) {
      console.error('❌ 腾讯云OCR识别失败:', error.message);
      return {
        success: false,
        text: '',
        confidence: 0,
        error: error.message,
      };
    }
  }

  /**
   * 数学公式识别
   */
  async recognizeMath(imageBase64: string): Promise<OCRResult> {
    try {
      const action = 'EduPaperOCR';
      const timestamp = Math.floor(Date.now() / 1000);
      const params = {
        ImageBase64: imageBase64,
      };

      const signature = this.generateSignature(action, params, timestamp);
      const authorization = `TC3-HMAC-SHA256 Credential=${this.secretId}/${new Date(timestamp * 1000).toISOString().split('T')[0]}/ocr/tc3_request, SignedHeaders=content-type;host, Signature=${signature}`;

      const response = await axios.post(
        `https://${this.endpoint}`,
        params,
        {
          headers: {
            'Content-Type': 'application/json',
            'Host': this.endpoint,
            'X-TC-Action': action,
            'X-TC-Version': '2018-11-19',
            'X-TC-Region': this.region,
            'X-TC-Timestamp': timestamp.toString(),
            'Authorization': authorization,
          },
        }
      );

      if (response.data.Response.Error) {
        throw new Error(response.data.Response.Error.Message);
      }

      const itemList = response.data.Response.ItemList || [];
      const fullText = itemList.map((item: any) => item.DetectedText).join('\n');

      return {
        success: true,
        text: fullText,
        confidence: 95,
        details: response.data.Response,
      };
    } catch (error: any) {
      console.error('❌ 数学公式识别失败:', error.message);
      // 降级到通用识别
      return this.recognizeGeneral(imageBase64);
    }
  }

  /**
   * 智能识别(自动选择最佳识别方式)
   */
  async recognizeSmart(imageBase64: string, questionType?: string): Promise<OCRResult> {
    // 如果是数学题,使用数学公式识别
    if (questionType === 'math' || questionType === 'physics') {
      return this.recognizeMath(imageBase64);
    }

    // 默认使用通用识别
    return this.recognizeGeneral(imageBase64);
  }
}

// 导出单例
let tencentOCRService: TencentOCRService | null = null;

export function getTencentOCRService(): TencentOCRService {
  if (!tencentOCRService) {
    const secretId = process.env.TENCENT_SECRET_ID || '';
    const secretKey = process.env.TENCENT_SECRET_KEY || '';
    const region = process.env.TENCENT_REGION || 'ap-guangzhou';

    if (!secretId || !secretKey) {
      throw new Error('腾讯云OCR配置缺失,请设置 TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY');
    }

    tencentOCRService = new TencentOCRService({
      secretId,
      secretKey,
      region,
    });
  }

  return tencentOCRService;
}
