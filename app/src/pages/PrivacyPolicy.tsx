import { Layout, Header } from '../components/layout'
import './PrivacyPolicy.css'

export default function PrivacyPolicy() {
  return (
    <Layout>
      <Header
        title="隐私政策"
        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        showBack={true}
      />

      <div className="main-content privacy-policy-page">
        <div className="policy-section">
          <div className="policy-header">
            <h1 className="policy-title">隐私政策</h1>
            <p className="policy-date">更新日期: 2026年2月7日</p>
          </div>

          <div className="policy-content">
            <h3>引言</h3>
            <p>
              欢迎使用启蒙之光!我们非常重视您和您孩子的隐私保护。本隐私政策旨在帮助您了解我们如何收集、使用、存储和保护您的个人信息。
            </p>

            <div className="highlight-box">
              <p>
                <strong>特别提示:</strong> 启蒙之光是专为6-12岁儿童设计的教育平台,我们严格遵守《儿童个人信息网络保护规定》,采取特殊保护措施保护儿童隐私。
              </p>
            </div>

            <h3>1. 我们收集的信息</h3>
            <p>为了向您提供服务,我们可能会收集以下信息:</p>
            <ul>
              <li><strong>账户信息:</strong> 手机号、邮箱、昵称、头像等</li>
              <li><strong>学习数据:</strong> 学习进度、作业记录、测试成绩等</li>
              <li><strong>使用信息:</strong> 登录时间、使用时长、功能使用记录等</li>
              <li><strong>设备信息:</strong> 设备型号、操作系统版本、IP地址等</li>
              <li><strong>创作内容:</strong> 用户创作的作品、评论、反馈等</li>
            </ul>

            <h3>2. 信息的使用</h3>
            <p>我们收集的信息将用于:</p>
            <ul>
              <li>提供和改进我们的服务</li>
              <li>个性化学习内容推荐</li>
              <li>生成学习报告和统计分析</li>
              <li>保障账户和系统安全</li>
              <li>响应用户咨询和反馈</li>
              <li>遵守法律法规要求</li>
            </ul>

            <h3>3. 信息的保护</h3>
            <p>我们采取以下措施保护您的信息安全:</p>
            <ul>
              <li>使用加密技术传输和存储敏感信息</li>
              <li>实施严格的数据访问控制</li>
              <li>定期进行安全审计和漏洞扫描</li>
              <li>建立数据泄露应急响应机制</li>
              <li>对员工进行隐私保护培训</li>
            </ul>

            <h3>4. 儿童隐私保护</h3>
            <p>针对儿童用户,我们采取特殊保护措施:</p>
            <ul>
              <li>需要家长同意才能注册和使用</li>
              <li>家长可以查看和管理孩子的信息</li>
              <li>不会向儿童推送商业广告</li>
              <li>严格限制儿童信息的使用范围</li>
              <li>定期删除不必要的儿童信息</li>
            </ul>

            <h3>5. 信息的共享</h3>
            <p>
              我们不会出售您的个人信息。仅在以下情况下,我们可能会共享您的信息:
            </p>
            <ul>
              <li>获得您的明确同意</li>
              <li>根据法律法规要求</li>
              <li>与授权合作伙伴共享(仅限于提供服务所需)</li>
              <li>保护用户或公众的合法权益</li>
            </ul>

            <h3>6. 您的权利</h3>
            <p>您对自己的个人信息享有以下权利:</p>
            <ul>
              <li>访问和查看您的个人信息</li>
              <li>更正不准确的信息</li>
              <li>删除您的个人信息</li>
              <li>撤回授权同意</li>
              <li>注销账户</li>
              <li>投诉和举报</li>
            </ul>

            <h3>7. Cookie和类似技术</h3>
            <p>
              我们使用Cookie和类似技术来改善用户体验、分析使用情况。您可以通过浏览器设置管理Cookie。
            </p>

            <h3>8. 隐私政策的更新</h3>
            <p>
              我们可能会不时更新本隐私政策。重大变更时,我们会通过应用内通知或其他方式告知您。
            </p>

            <div className="contact-box">
              <h4>联系我们</h4>
              <p>如果您对本隐私政策有任何疑问或建议,请通过以下方式联系我们:</p>
              <p><strong>邮箱:</strong> privacy@qmzg.com</p>
              <p><strong>电话:</strong> 400-123-4567</p>
              <p><strong>地址:</strong> 北京市朝阳区XX路XX号</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
