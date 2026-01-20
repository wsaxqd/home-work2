import express, { Request, Response } from 'express'
import pool from '../db'
import { authenticateToken } from '../middlewares/auth'

const router = express.Router()

// 扩展Request类型以包含用户信息
interface AuthRequest extends Request {
  user?: { userId: number; role: string }
}

/**
 * 获取用户当前激活的宠物信息
 */
router.get('/active', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId

    const result = await pool.query(`
      SELECT
        up.*,
        pt.name as pet_type_name,
        pt.emoji as pet_emoji,
        pt.description as pet_description
      FROM user_pets up
      JOIN pet_types pt ON up.pet_type_id = pt.id
      WHERE up.user_id = $1 AND up.is_active = true
    `, [userId])

    if (result.rows.length === 0) {
      return res.json({ success: false, message: '暂无激活的宠物' })
    }

    const pet = result.rows[0]

    // 计算等级进度
    const nextLevelExp = pet.level * 100 // 简单公式：下一级需要 level * 100 经验
    const expProgress = (pet.experience / nextLevelExp) * 100

    res.json({
      success: true,
      data: {
        ...pet,
        next_level_exp: nextLevelExp,
        exp_progress: Math.min(expProgress, 100)
      }
    })
  } catch (error) {
    console.error('获取宠物信息失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

/**
 * 获取所有可用的宠物类型
 */
router.get('/types', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId

    // 获取用户积分和等级（假设从users表）
    const userResult = await pool.query(
      'SELECT total_points, level FROM users WHERE id = $1',
      [userId]
    )

    const userPoints = userResult.rows[0]?.total_points || 0
    const userLevel = userResult.rows[0]?.level || 1

    // 获取所有宠物类型
    const typesResult = await pool.query('SELECT * FROM pet_types ORDER BY id')

    // 检查用户已拥有的宠物
    const ownedResult = await pool.query(
      'SELECT DISTINCT pet_type_id FROM user_pets WHERE user_id = $1',
      [userId]
    )
    const ownedTypeIds = ownedResult.rows.map(r => r.pet_type_id)

    // 判断是否解锁
    const petTypes = typesResult.rows.map(type => {
      const condition = type.unlock_condition
      let isUnlocked = false
      let unlockHint = ''

      if (condition.type === 'default') {
        isUnlocked = true
      } else if (condition.type === 'points') {
        isUnlocked = userPoints >= condition.value
        unlockHint = `需要${condition.value}积分`
      } else if (condition.type === 'level') {
        isUnlocked = userLevel >= condition.value
        unlockHint = `需要${condition.value}级`
      }

      return {
        ...type,
        is_unlocked: isUnlocked,
        is_owned: ownedTypeIds.includes(type.id),
        unlock_hint: unlockHint
      }
    })

    res.json({ success: true, data: petTypes })
  } catch (error) {
    console.error('获取宠物类型失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

/**
 * 领养新宠物
 */
router.post('/adopt', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId
    const { petTypeId, nickname } = req.body

    if (!petTypeId) {
      return res.status(400).json({ success: false, message: '请选择宠物类型' })
    }

    // 检查宠物类型是否存在
    const typeResult = await pool.query(
      'SELECT * FROM pet_types WHERE id = $1',
      [petTypeId]
    )

    if (typeResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: '宠物类型不存在' })
    }

    // 检查是否已拥有此类型
    const existingResult = await pool.query(
      'SELECT id FROM user_pets WHERE user_id = $1 AND pet_type_id = $2',
      [userId, petTypeId]
    )

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ success: false, message: '你已经拥有这个宠物了' })
    }

    // 如果是第一只宠物，设为激活状态
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM user_pets WHERE user_id = $1',
      [userId]
    )
    const isFirstPet = parseInt(countResult.rows[0].count) === 0

    // 创建宠物
    const insertResult = await pool.query(`
      INSERT INTO user_pets
      (user_id, pet_type_id, nickname, is_active, last_fed_at, last_interaction_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `, [userId, petTypeId, nickname, isFirstPet])

    res.json({
      success: true,
      message: '领养成功！',
      data: insertResult.rows[0]
    })
  } catch (error) {
    console.error('领养宠物失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

/**
 * 与宠物互动
 */
router.post('/interact', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId
    const { interactionType, itemId } = req.body

    // 获取激活的宠物
    const petResult = await pool.query(
      'SELECT * FROM user_pets WHERE user_id = $1 AND is_active = true',
      [userId]
    )

    if (petResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: '请先领养一只宠物' })
    }

    const pet = petResult.rows[0]
    let rewardExp = 0
    let costPoints = 0
    let updates: any = {}

    // 根据互动类型处理
    switch (interactionType) {
      case 'feed':
        // 喂养宠物
        if (!itemId) {
          return res.status(400).json({ success: false, message: '请选择食物' })
        }

        const itemResult = await pool.query(
          `SELECT pi.*, upi.quantity
           FROM pet_items pi
           LEFT JOIN user_pet_items upi ON pi.id = upi.pet_item_id AND upi.user_id = $1
           WHERE pi.id = $2 AND pi.item_type = 'food'`,
          [userId, itemId]
        )

        if (itemResult.rows.length === 0 || !itemResult.rows[0].quantity) {
          return res.status(400).json({ success: false, message: '你没有这个食物' })
        }

        const food = itemResult.rows[0]
        const effect = food.effect

        updates = {
          hunger: Math.min(pet.hunger + (effect.hunger || 0), 100),
          happiness: Math.min(pet.happiness + (effect.happiness || 0), 100),
          last_fed_at: new Date()
        }

        // 扣除物品
        await pool.query(
          `UPDATE user_pet_items
           SET quantity = quantity - 1
           WHERE user_id = $1 AND pet_item_id = $2`,
          [userId, itemId]
        )

        rewardExp = 5
        break

      case 'play':
        // 玩耍
        if (pet.energy < 20) {
          return res.status(400).json({ success: false, message: '宠物太累了，让它休息一下吧' })
        }

        updates = {
          happiness: Math.min(pet.happiness + 15, 100),
          energy: Math.max(pet.energy - 15, 0),
          total_interaction: pet.total_interaction + 1,
          last_interaction_at: new Date()
        }

        rewardExp = 10
        break

      case 'study':
        // 一起学习
        updates = {
          experience: pet.experience + 20,
          total_study_time: pet.total_study_time + 30,
          last_interaction_at: new Date()
        }

        rewardExp = 20
        break

      default:
        return res.status(400).json({ success: false, message: '无效的互动类型' })
    }

    // 更新宠物状态
    const totalExp = (pet.experience || 0) + rewardExp
    let newLevel = pet.level
    let remainingExp = totalExp

    // 检查是否升级
    while (remainingExp >= newLevel * 100 && newLevel < 100) {
      remainingExp -= newLevel * 100
      newLevel++
    }

    updates.level = newLevel
    updates.experience = remainingExp

    // 构建更新SQL
    const updateFields = Object.keys(updates).map((key, idx) => `${key} = $${idx + 2}`).join(', ')
    const updateValues = Object.values(updates)

    await pool.query(
      `UPDATE user_pets SET ${updateFields}, updated_at = NOW() WHERE id = $1`,
      [pet.id, ...updateValues]
    )

    // 记录互动历史
    await pool.query(
      `INSERT INTO pet_interactions
       (user_pet_id, interaction_type, reward_exp, cost_points, result)
       VALUES ($1, $2, $3, $4, $5)`,
      [pet.id, interactionType, rewardExp, costPoints, JSON.stringify(updates)]
    )

    res.json({
      success: true,
      message: '互动成功！',
      data: {
        rewardExp,
        newLevel: newLevel > pet.level ? newLevel : null,
        updates
      }
    })
  } catch (error) {
    console.error('宠物互动失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

/**
 * 与宠物对话
 */
router.post('/talk', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId
    const { message, contextType = 'daily' } = req.body

    const petResult = await pool.query(
      `SELECT up.*, pt.name as pet_type_name
       FROM user_pets up
       JOIN pet_types pt ON up.pet_type_id = pt.id
       WHERE up.user_id = $1 AND up.is_active = true`,
      [userId]
    )

    if (petResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: '请先领养一只宠物' })
    }

    const pet = petResult.rows[0]

    // TODO: 调用AI生成宠物回复（可以接入Dify）
    // 这里先用简单的模板回复
    const responses = [
      `${pet.nickname || pet.pet_type_name}很开心和你聊天！🎉`,
      `${pet.nickname || pet.pet_type_name}想和你一起学习！📚`,
      `${pet.nickname || pet.pet_type_name}今天表现很棒哦！⭐`,
      `让${pet.nickname || pet.pet_type_name}陪你一起成长吧！🌱`
    ]

    const petResponse = responses[Math.floor(Math.random() * responses.length)]

    // 保存对话记录
    await pool.query(
      `INSERT INTO pet_conversations
       (user_pet_id, user_message, pet_response, context_type)
       VALUES ($1, $2, $3, $4)`,
      [pet.id, message, petResponse, contextType]
    )

    res.json({
      success: true,
      data: { response: petResponse }
    })
  } catch (error) {
    console.error('宠物对话失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

/**
 * 获取宠物商店物品
 */
router.get('/shop', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId

    // 获取用户积分
    const userResult = await pool.query(
      'SELECT total_points FROM users WHERE id = $1',
      [userId]
    )
    const userPoints = userResult.rows[0]?.total_points || 0

    // 获取所有可用物品
    const itemsResult = await pool.query(`
      SELECT
        pi.*,
        COALESCE(upi.quantity, 0) as owned_quantity
      FROM pet_items pi
      LEFT JOIN user_pet_items upi ON pi.id = upi.pet_item_id AND upi.user_id = $1
      WHERE pi.is_available = true
      ORDER BY pi.item_type, pi.price
    `, [userId])

    res.json({
      success: true,
      data: {
        userPoints,
        items: itemsResult.rows
      }
    })
  } catch (error) {
    console.error('获取商店物品失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

/**
 * 购买物品
 */
router.post('/shop/buy', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId
    const { itemId, quantity = 1 } = req.body

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // 获取物品信息
      const itemResult = await client.query(
        'SELECT * FROM pet_items WHERE id = $1 AND is_available = true',
        [itemId]
      )

      if (itemResult.rows.length === 0) {
        throw new Error('物品不存在或不可购买')
      }

      const item = itemResult.rows[0]
      const totalCost = item.price * quantity

      // 检查用户积分
      const userResult = await client.query(
        'SELECT total_points FROM users WHERE id = $1',
        [userId]
      )

      if (userResult.rows[0].total_points < totalCost) {
        throw new Error('积分不足')
      }

      // 扣除积分
      await client.query(
        'UPDATE users SET total_points = total_points - $1 WHERE id = $2',
        [totalCost, userId]
      )

      // 添加到库存
      await client.query(
        `INSERT INTO user_pet_items (user_id, pet_item_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, pet_item_id)
         DO UPDATE SET quantity = user_pet_items.quantity + $3`,
        [userId, itemId, quantity]
      )

      await client.query('COMMIT')

      res.json({
        success: true,
        message: '购买成功！',
        data: { item, quantity, totalCost }
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error: any) {
    console.error('购买物品失败:', error)
    res.status(400).json({ success: false, message: error.message || '购买失败' })
  }
})

export default router
