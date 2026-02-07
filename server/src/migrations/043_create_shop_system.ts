import { Pool } from 'pg';

export async function up(pool: Pool): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 创建商城物品表
    await client.query(`
      CREATE TABLE IF NOT EXISTS shop_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        category VARCHAR(50) NOT NULL CHECK (category IN ('道具', '装饰', '工具')),
        price INTEGER NOT NULL CHECK (price >= 0),
        stock INTEGER DEFAULT -1, -- -1表示无限库存
        is_available BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 创建用户物品表
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_id INTEGER NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
        obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, item_id)
      );
    `);

    // 创建购买记录表
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchase_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_id INTEGER NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        total_price INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 创建索引
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_shop_items_category
      ON shop_items(category);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_items_user_id
      ON user_items(user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_purchase_history_user_id
      ON purchase_history(user_id);
    `);

    // 插入初始商品数据
    await client.query(`
      INSERT INTO shop_items (name, description, icon, category, price, stock) VALUES
      ('学习加速卡', '使用后可获得双倍学习经验，持续30分钟', '🎴', '道具', 100, -1),
      ('经验加倍卡', '使用后可获得双倍经验值，持续1小时', '⭐', '道具', 200, -1),
      ('提示卡', '在答题时可以获得一次提示机会', '💡', '道具', 50, -1),
      ('可爱头像框', '装饰你的个人头像，让它更加可爱', '🖼️', '装饰', 300, -1),
      ('炫彩气泡', '聊天时显示炫彩气泡效果', '💬', '装饰', 250, -1),
      ('专属称号', '获得独特的用户称号', '👑', '装饰', 500, -1),
      ('错题本', '自动整理错题，智能推荐练习', '📖', '工具', 150, -1),
      ('学习计划器', '帮助制定和管理学习计划', '📅', '工具', 180, -1)
      ON CONFLICT DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('✅ 商城系统表创建成功');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 商城系统表创建失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function down(pool: Pool): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query('DROP TABLE IF EXISTS purchase_history CASCADE;');
    await client.query('DROP TABLE IF EXISTS user_items CASCADE;');
    await client.query('DROP TABLE IF EXISTS shop_items CASCADE;');

    await client.query('COMMIT');
    console.log('✅ 商城系统表删除成功');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 商城系统表删除失败:', error);
    throw error;
  } finally {
    client.release();
  }
}
