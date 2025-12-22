import BottomNav from './BottomNav'
import AIAssistant from '../AIAssistant'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
  showNav?: boolean
}

export default function Layout({ children, showNav = true }: LayoutProps) {
  return (
    <div className="container">
      {children}
      {showNav && <BottomNav />}
      <AIAssistant />
    </div>
  )
}
