import BottomNav from './BottomNav'
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
    </div>
  )
}
