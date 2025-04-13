import { Bell } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface HeaderProps {
  isExpanded: boolean
}

const Header = ({ isExpanded }: HeaderProps) => {
  return (
    <header
      className="fixed right-0 z-50 flex h-16 items-center justify-end border-b bg-white px-6 transition-all duration-300"
      style={{ left: isExpanded ? '200px' : '64px' }}
    >
      <div className="flex items-center gap-4">
        <button className="relative rounded-full hover:bg-gray-100 p-2" aria-label="Notifications">
          <Bell className="h-5 w-5 text-gray-600" />
          <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
          </span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full hover:bg-gray-100 p-1">
            <Avatar>
              <AvatarImage src="/logo_icon.png" alt="Admin avatar" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-black">Admin</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default Header
