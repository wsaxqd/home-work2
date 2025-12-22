import BottomNav from './BottomNav'
import { LogoutButton, ChatBot } from '../common'
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
      <LogoutButton />
      <ChatBot />
    </div>
  )
}
