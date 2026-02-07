/**
 * 腾讯云短信服务
 * 支持短信验证码发送
 */

import crypto from 'crypto';
import axios from 'axios';

interface TencentSMSConfig {
  secretId: string;
  secretKey: string;
  sdkAppId: string;
  signName: string;
  templateId: string;
  region?: string;
}

interface SMSResult {
  success: boolean;
  message?: string;
  error?: string;
  requestId?: string;
}

export class TencentSMSService {
  private secretId: string;
  private secretKey: string;
  private sdkAppId: string;
  private signName: string;
  private templateId: string;
  private region: string;
  private endpoint: string;

  constructor(config: TencentSMSConfig) {
    this.secretId = config.secretId;
    this.secretKey = config.secretKey;
    this.sdkAppId = config.sdkAppId;
    this.signName = config.signName;
    this.templateId = config.templateId;
    this.region = config.region || 'ap-guangzhou';
    this.endpoint = 'sms.tencentcloudapi.com';
  }

  /**
   * 生成腾讯云API签名 (V3版本)
   */
  private generateSignatureV3(
    action: string,
    payload: string,
    timestamp: number
  ): string {
    const service = 'sms';
    const host = this.endpoint;
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
   * 发送短信验证码
   * @param phone 手机号(需要带+86国际区号)
   * @param code 验证码
   * @param expireMinutes 过期时间(分钟)
   */
  async sendVerifyCode(
    phone: string,
    code: string,
    expireMinutes: number = 5
  ): Promise<SMSResult> {
    try {
      // 验证手机号格式
      if (!this.validatePhone(phone)) {
        return {
          success: false,
          error: '手机号格式不正确',
        };
      }

      const action = 'SendSms';
      const timestamp = Math.floor(Date.now() / 1000);

      // 格式化手机号(添加+86)
      const formattedPhone = phone.startsWith('+86') ? phone : `+86${phone}`;

      const params = {
        PhoneNumberSet: [formattedPhone],
        SmsSdkAppId: this.sdkAppId,
        SignName: this.signName,
        TemplateId: this.templateId,
        TemplateParamSet: [code, expireMinutes.toString()],
      };

      const payload = JSON.stringify(params);
      const signature = this.generateSignatureV3(action, payload, timestamp);
      const date = new Date(timestamp * 1000).toISOString().split('T')[0];
      const authorization = `TC3-HMAC-SHA256 Credential=${this.secretId}/${date}/sms/tc3_request, SignedHeaders=content-type;host, Signature=${signature}`;

      const response = await axios.post(
        `https://${this.endpoint}`,
        params,
        {
          headers: {
            'Content-Type': 'application/json',
            'Host': this.endpoint,
            'X-TC-Action': action,
            'X-TC-Version': '2021-01-11',
            'X-TC-Region': this.region,
            'X-TC-Timestamp': timestamp.toString(),
            'Authorization': authorization,
          },
          timeout: 10000,
        }
      );

      if (response.data.Response.Error) {
        throw new Error(response.data.Response.Error.Message);
      }

      const sendStatusSet = response.data.Response.SendStatusSet || [];
      if (sendStatusSet.length > 0 && sendStatusSet[0].Code === 'Ok') {
        return {
          success: true,
          message: '短信发送成功',
          requestId: response.data.Response.RequestId,
        };
      } else {
        const errorMsg = sendStatusSet[0]?.Message || '短信发送失败';
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error: any) {
      console.error('❌ 腾讯云短信发送失败:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 验证手机号格式
   */
  private validatePhone(phone: string): boolean {
    // 移除+86前缀
    const cleanPhone = phone.replace(/^\+86/, '');
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(cleanPhone);
  }

  /**
   * 批量发送短信
   * @param phones 手机号数组
   * @param code 验证码
   */
  async sendBatchVerifyCode(
    phones: string[],
    code: string,
    expireMinutes: number = 5
  ): Promise<SMSResult> {
    try {
      // 验证手机号
      for (const phone of phones) {
        if (!this.validatePhone(phone)) {
          return {
            success: false,
            error: `手机号格式不正确: ${phone}`,
          };
        }
      }

      const action = 'SendSms';
      const timestamp = Math.floor(Date.now() / 1000);

      // 格式化手机号
      const formattedPhones = phones.map(phone =>
        phone.startsWith('+86') ? phone : `+86${phone}`
      );

      const params = {
        PhoneNumberSet: formattedPhones,
        SmsSdkAppId: this.sdkAppId,
        SignName: this.signName,
        TemplateId: this.templateId,
        TemplateParamSet: [code, expireMinutes.toString()],
      };

      const payload = JSON.stringify(params);
      const signature = this.generateSignatureV3(action, payload, timestamp);
      const date = new Date(timestamp * 1000).toISOString().split('T')[0];
      const authorization = `TC3-HMAC-SHA256 Credential=${this.secretId}/${date}/sms/tc3_request, SignedHeaders=content-type;host, Signature=${signature}`;

      const response = await axios.post(
        `https://${this.endpoint}`,
        params,
        {
          headers: {
            'Content-Type': 'application/json',
            'Host': this.endpoint,
            'X-TC-Action': action,
            'X-TC-Version': '2021-01-11',
            'X-TC-Region': this.region,
            'X-TC-Timestamp': timestamp.toString(),
            'Authorization': authorization,
          },
          timeout: 10000,
        }
      );

      if (response.data.Response.Error) {
        throw new Error(response.data.Response.Error.Message);
      }

      return {
        success: true,
        message: `短信批量发送成功,共${phones.length}条`,
        requestId: response.data.Response.RequestId,
      };
    } catch (error: any) {
      console.error('❌ 腾讯云批量短信发送失败:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// 导出单例
let tencentSMSService: TencentSMSService | null = null;

export function getTencentSMSService(): TencentSMSService {
  if (!tencentSMSService) {
    const secretId = process.env.TENCENT_SECRET_ID || '';
    const secretKey = process.env.TENCENT_SECRET_KEY || '';
    const sdkAppId = process.env.TENCENT_SMS_SDK_APP_ID || '';
    const signName = process.env.TENCENT_SMS_SIGN_NAME || '';
    const templateId = process.env.TENCENT_SMS_TEMPLATE_ID || '';
    const region = process.env.TENCENT_REGION || 'ap-guangzhou';

    if (!secretId || !secretKey || !sdkAppId || !signName || !templateId) {
      throw new Error('腾讯云短信服务配置缺失,请设置相关环境变量');
    }

    tencentSMSService = new TencentSMSService({
      secretId,
      secretKey,
      sdkAppId,
      signName,
      templateId,
      region,
    });
  }

  return tencentSMSService;
}
