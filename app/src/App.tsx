import { BrowserRouter, Routes, Route } from 'react-router-dom'
import {
  Splash,
  Login,
  Home,
  Explore,
  Create,
  Community,
  Profile,
  MindGarden,
  Garden,
  Assessment,
  ArtCreator,
  MusicCreator,
  StoryCreator,
  PoemCreator,
  ExpressionGame,
  ImageRecognitionGame
} from './pages'
import './styles/global.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/splash" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/create" element={<Create />} />
        <Route path="/community" element={<Community />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/mind-garden" element={<MindGarden />} />
        <Route path="/garden" element={<Garden />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/art-creator" element={<ArtCreator />} />
        <Route path="/music-creator" element={<MusicCreator />} />
        <Route path="/story-creator" element={<StoryCreator />} />
        <Route path="/poem-creator" element={<PoemCreator />} />
        <Route path="/expression-game" element={<ExpressionGame />} />
        <Route path="/image-recognition-game" element={<ImageRecognitionGame />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
