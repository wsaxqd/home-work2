import { lazy } from 'react'

// 基础页面
export const Splash = lazy(() => import('../pages/Splash'))
export const Login = lazy(() => import('../pages/Login'))
export const Home = lazy(() => import('../pages/Home'))

// 创作模块
export const Create = lazy(() => import('../pages/Create'))
export const ArtCreator = lazy(() => import('../pages/ArtCreator'))
export const MusicCreator = lazy(() => import('../pages/MusicCreator'))
export const StoryCreator = lazy(() => import('../pages/StoryCreator'))
export const PoemCreator = lazy(() => import('../pages/PoemCreator'))

// 游戏模块
export const Games = lazy(() => import('../pages/Games'))
export const FruitMatch = lazy(() => import('../pages/FruitMatch'))
export const TankBattle = lazy(() => import('../pages/TankBattle'))
export const ChessGame = lazy(() => import('../pages/ChessGame'))
export const ChineseChess = lazy(() => import('../pages/ChineseChess'))
export const CrystalMatch = lazy(() => import('../pages/CrystalMatch'))
export const WhackAMole = lazy(() => import('../pages/WhackAMole'))
export const NumberPuzzle = lazy(() => import('../pages/NumberPuzzle'))
export const JigsawPuzzle = lazy(() => import('../pages/JigsawPuzzle'))
export const TetrisGame = lazy(() => import('../pages/TetrisGame'))
export const SnakeGame = lazy(() => import('../pages/SnakeGame'))
export const Game2048 = lazy(() => import('../pages/Game2048'))
