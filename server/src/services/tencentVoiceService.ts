/**
 * 腾讯云语音服务
 * 支持语音识别(ASR)和语音合成(TTS)
 */

import crypto from 'crypto';
import axios from 'axios';
import fs from 'fs';

interface TencentVoiceConfig {
  secretId: string;
  secretKey: string;
  region?: string;
}

interface ASRResult {
  success: boolean;
  text: string;
  duration?: number;
  error?: string;
}

interface TTSResult {
  success: boolean;
  audioUrl?: string;
  audioBase64?: string;
  duration?: number;
  error?: string;
}

export class TencentVoiceService {
  private secretId: string;
  private secretKey: string;
  private region: string;

  constructor(config: TencentVoiceConfig) {
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
   * 语音识别 - 一句话识别
   * @param audioBase64 音频文件的Base64编码(支持wav、mp3、m4a等格式)
   * @param format 音频格式(wav/mp3/m4a等)
   * @param sampleRate 采样率(8000/16000)
   */
  async speechToText(
    audioBase64: string,
    format: string = 'mp3',
    sampleRate: number = 16000
  ): Promise<ASRResult> {
    try {
      const service = 'asr';
      const action = 'SentenceRecognition';
      const host = 'asr.tencentcloudapi.com';
      const timestamp = Math.floor(Date.now() / 1000);

      const params = {
        ProjectId: 0,
        SubServiceType: 2,
        EngSerViceType: '16k_zh',
        SourceType: 1,
        VoiceFormat: format,
        UsrAudioKey: `audio_${Date.now()}`,
        Data: audioBase64,
        DataLen: audioBase64.length,
      };

      const payload = JSON.stringify(params);
      const signature = this.generateSignatureV3(service, action, payload, timestamp, host);
      const date = new Date(timestamp * 1000).toISOString().split('T')[0];
      const authorization = `TC3-HMAC-SHA256 Credential=${this.secretId}/${date}/${service}/tc3_request, SignedHeaders=content-type;host, Signature=${signature}`;

      const response = await axios.post(
        `https://${host}`,
        params,
        {
          headers: {
            'Content-Type': 'application/json',
            'Host': host,
            'X-TC-Action': action,
            'X-TC-Version': '2019-06-14',
            'X-TC-Region': this.region,
            'X-TC-Timestamp': timestamp.toString(),
            'Authorization': authorization,
          },
          timeout: 30000,
        }
      );

      if (response.data.Response.Error) {
        throw new Error(response.data.Response.Error.Message);
      }

      const result = response.data.Response;

      return {
        success: true,
        text: result.Result || '',
        duration: result.AudioDuration || 0,
      };
    } catch (error: any) {
      console.error('❌ 腾讯云语音识别失败:', error.message);
      return {
        success: false,
        text: '',
        error: error.message,
      };
    }
  }

  /**
   * 语音识别 - 从URL识别
   * @param audioUrl 音频文件URL
   * @param format 音频格式
   */
  async speechToTextFromUrl(
    audioUrl: string,
    format: string = 'mp3'
  ): Promise<ASRResult> {
    try {
      // 下载音频文件
      const response = await axios.get(audioUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      const audioBuffer = Buffer.from(response.data);
      const audioBase64 = audioBuffer.toString('base64');

      return this.speechToText(audioBase64, format);
    } catch (error: any) {
      console.error('❌ 从URL下载音频失败:', error.message);
      return {
        success: false,
        text: '',
        error: error.message,
      };
    }
  }

  /**
   * 语音合成 - 文字转语音
   * @param text 要合成的文本(最长500字)
   * @param voiceType 音色类型(0-女声,1-男声,10-智瑜,11-智聆等)
   * @param speed 语速(-2到2,默认0)
   * @param volume 音量(0到10,默认5)
   */
  async textToSpeech(
    text: string,
    voiceType: number = 10,
    speed: number = 0,
    volume: number = 5
  ): Promise<TTSResult> {
    try {
      const service = 'tts';
      const action = 'TextToVoice';
      const host = 'tts.tencentcloudapi.com';
      const timestamp = Math.floor(Date.now() / 1000);

      // 文本长度限制
      if (text.length > 500) {
        text = text.substring(0, 500);
      }

      const params = {
        Text: text,
        SessionId: `session_${Date.now()}`,
        VoiceType: voiceType,
        Codec: 'mp3',
        Speed: speed,
        Volume: volume,
        PrimaryLanguage: 1, // 1-中文
        SampleRate: 16000,
      };

      const payload = JSON.stringify(params);
      const signature = this.generateSignatureV3(service, action, payload, timestamp, host);
      const date = new Date(timestamp * 1000).toISOString().split('T')[0];
      const authorization = `TC3-HMAC-SHA256 Credential=${this.secretId}/${date}/${service}/tc3_request, SignedHeaders=content-type;host, Signature=${signature}`;

      const response = await axios.post(
        `https://${host}`,
        params,
        {
          headers: {
            'Content-Type': 'application/json',
            'Host': host,
            'X-TC-Action': action,
            'X-TC-Version': '2019-08-23',
            'X-TC-Region': this.region,
            'X-TC-Timestamp': timestamp.toString(),
            'Authorization': authorization,
          },
          timeout: 30000,
        }
      );

      if (response.data.Response.Error) {
        throw new Error(response.data.Response.Error.Message);
      }

      const result = response.data.Response;

      return {
        success: true,
        audioBase64: result.Audio || '',
        duration: Math.ceil(text.length / 5), // 估算时长(秒)
      };
    } catch (error: any) {
      console.error('❌ 腾讯云语音合成失败:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 语音合成并保存到文件
   * @param text 要合成的文本
   * @param outputPath 输出文件路径
   * @param voiceType 音色类型
   */
  async textToSpeechFile(
    text: string,
    outputPath: string,
    voiceType: number = 10
  ): Promise<TTSResult> {
    try {
      const result = await this.textToSpeech(text, voiceType);

      if (!result.success || !result.audioBase64) {
        return result;
      }

      // 保存音频文件
      const audioBuffer = Buffer.from(result.audioBase64, 'base64');
      fs.writeFileSync(outputPath, audioBuffer);

      return {
        success: true,
        audioUrl: outputPath,
        duration: result.duration,
      };
    } catch (error: any) {
      console.error('❌ 保存音频文件失败:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 获取可用的音色列表
   */
  getVoiceTypes(): Array<{ id: number; name: string; description: string }> {
    return [
      { id: 0, name: '云小宁', description: '亲和女声' },
      { id: 1, name: '云小奇', description: '亲和男声' },
      { id: 10, name: '智瑜', description: '情感女声' },
      { id: 11, name: '智聆', description: '通用女声' },
      { id: 12, name: '智美', description: '客服女声' },
      { id: 13, name: '智云', description: '通用男声' },
      { id: 14, name: '智莉', description: '温暖女声' },
      { id: 15, name: '智言', description: '客服男声' },
      { id: 1050, name: '智瑜', description: '情感女声(精品)' },
      { id: 1051, name: '智聆', description: '通用女声(精品)' },
    ];
  }
}

// 导出单例
let tencentVoiceService: TencentVoiceService | null = null;

export function getTencentVoiceService(): TencentVoiceService {
  if (!tencentVoiceService) {
    const secretId = process.env.TENCENT_SECRET_ID || '';
    const secretKey = process.env.TENCENT_SECRET_KEY || '';
    const region = process.env.TENCENT_REGION || 'ap-guangzhou';

    if (!secretId || !secretKey) {
      throw new Error('腾讯云语音服务配置缺失,请设置 TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY');
    }

    tencentVoiceService = new TencentVoiceService({
      secretId,
      secretKey,
      region,
    });
  }

  return tencentVoiceService;
}
