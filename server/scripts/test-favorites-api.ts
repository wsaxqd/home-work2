/**
 * 测试收藏功能 API
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

// 测试用的 token (需要先登录获取真实 token)
let authToken = '';

async function testFavoritesAPI() {
  console.log('🧪 开始测试收藏功能 API...\n');

  try {
    // 1. 测试健康检查
    console.log('1️⃣ 测试健康检查...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ 健康检查通过:', healthResponse.data.message);
    console.log('');

    // 2. 尝试登录获取 token (使用测试账号)
    console.log('2️⃣ 尝试登录获取认证 token...');
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        username: 'test_user',
        password: 'test123456'
      });
      console.log('登录响应数据结构:', JSON.stringify(loginResponse.data, null, 2));
      authToken = loginResponse.data.data.token || loginResponse.data.data.accessToken;
      console.log('✅ 登录成功,获取到 token');
      if (authToken) {
        console.log('   Token 前20个字符:', authToken.substring(0, 20) + '...');
      }
    } catch (error: any) {
      console.log('⚠️  登录失败,可能需要先创建测试用户');
      console.log('   错误信息:', error.response?.data?.message || error.message);
      console.log('   将跳过需要认证的测试');
    }
    console.log('');

    // 如果没有获取到 token,则跳过后续测试
    if (!authToken) {
      console.log('⚠️  由于没有认证 token,跳过后续测试');
      console.log('💡 提示: 请先创建测试用户或使用现有用户登录');
      return;
    }

    const headers = { Authorization: `Bearer ${authToken}` };

    // 3. 测试添加收藏
    console.log('3️⃣ 测试添加收藏...');
    const addResponse = await axios.post(
      `${API_BASE}/favorites`,
      {
        itemType: 'story',
        itemId: 'test-story-001',
        itemTitle: '测试故事:小红帽',
        itemContent: '从前有个小女孩,她总是戴着红色的帽子...',
        itemThumbnail: 'https://example.com/thumbnail.jpg'
      },
      { headers }
    );
    console.log('✅ 添加收藏成功:', addResponse.data.data);
    const favoriteId = addResponse.data.data.id;
    console.log('');

    // 4. 测试获取收藏列表
    console.log('4️⃣ 测试获取收藏列表...');
    const listResponse = await axios.get(`${API_BASE}/favorites`, { headers });
    console.log('✅ 获取收藏列表成功');
    console.log('   总数:', listResponse.data.data.total);
    console.log('   当前页:', listResponse.data.data.page);
    console.log('');

    // 5. 测试按类型筛选
    console.log('5️⃣ 测试按类型筛选收藏...');
    const filterResponse = await axios.get(`${API_BASE}/favorites?itemType=story`, { headers });
    console.log('✅ 筛选故事类收藏成功');
    console.log('   故事收藏数:', filterResponse.data.data.total);
    console.log('');

    // 6. 测试检查是否已收藏
    console.log('6️⃣ 测试检查是否已收藏...');
    const checkResponse = await axios.get(
      `${API_BASE}/favorites/check?itemType=story&itemId=test-story-001`,
      { headers }
    );
    console.log('✅ 检查收藏状态成功');
    console.log('   是否已收藏:', checkResponse.data.data.isFavorited);
    console.log('');

    // 7. 测试取消收藏
    console.log('7️⃣ 测试取消收藏...');
    const deleteResponse = await axios.delete(
      `${API_BASE}/favorites/${favoriteId}`,
      { headers }
    );
    console.log('✅ 取消收藏成功:', deleteResponse.data.message);
    console.log('');

    console.log('🎉 所有测试通过!');

  } catch (error: any) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    throw error;
  }
}

// 运行测试
testFavoritesAPI()
  .then(() => {
    console.log('\n✨ 测试完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 测试出错:', error.message);
    process.exit(1);
  });
