import React from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const PageContainer: React.FC<PageContainerProps> = ({ children, className, ...props }) => {
  return (
    <div className={cn('container mx-auto px-4 py-8', className)} {...props}>
      {children}
    </div>
  )
}
