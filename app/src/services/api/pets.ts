import { api } from '../../config/api'

export interface Pet {
  id: number
  user_id: number
  pet_type_id: number
  nickname: string
  level: number
  experience: number
  happiness: number
  hunger: number
  energy: number
  total_study_time: number
  is_active: boolean
  created_at: string
  updated_at: string
  pet_type_name: string
  pet_emoji: string
  pet_description: string
  next_level_exp: number
  exp_progress: number
}

export interface PetType {
  id: number
  name: string
  emoji: string
  description: string
  unlock_condition: {
    type: string
    value: number
  }
  is_unlocked: boolean
  is_owned: boolean
  unlock_hint: string
}

export interface PetItem {
  id: number
  name: string
  emoji: string
  description: string
  item_type: 'food' | 'toy' | 'decoration'
  effect_type: 'hunger' | 'happiness' | 'energy' | 'experience'
  effect_value: number
  price: number
  is_available: boolean
  owned_quantity: number
}

export interface ShopData {
  userPoints: number
  items: PetItem[]
}

export interface BuyItemRequest {
  itemId: number
  quantity?: number
}

export interface BuyItemResponse {
  item: PetItem
  quantity: number
  totalCost: number
}

export interface UseItemRequest {
  itemId: number
  quantity?: number
}

export interface InteractionRequest {
  interactionType: 'feed' | 'play' | 'study'
}

export interface InteractionResponse {
  message: string
  newLevel?: number
  expGained?: number
  hungerIncreased?: number
  happinessIncreased?: number
  energyIncreased?: number
}

export const petsApi = {
  // 获取当前激活的宠物
  getActivePet: () =>
    api.get<Pet>('/pets/active'),

  // 获取所有可用的宠物类型
  getPetTypes: () =>
    api.get<PetType[]>('/pets/types'),

  // 领养宠物
  adoptPet: (data: { petTypeId: number; nickname: string }) =>
    api.post<Pet>('/pets/adopt', data),

  // 宠物互动
  interact: (data: InteractionRequest) =>
    api.post<InteractionResponse>('/pets/interact', data),

  // 更新宠物昵称
  updateNickname: (data: { nickname: string }) =>
    api.put<Pet>('/pets/nickname', data),

  // 获取商店物品列表
  getShop: () =>
    api.get<ShopData>('/pets/shop'),

  // 购买物品
  buyItem: (data: BuyItemRequest) =>
    api.post<BuyItemResponse>('/pets/shop/buy', data),

  // 使用物品
  useItem: (data: UseItemRequest) =>
    api.post<InteractionResponse>('/pets/use-item', data),

  // 获取用户库存
  getInventory: () =>
    api.get<PetItem[]>('/pets/inventory'),
}
