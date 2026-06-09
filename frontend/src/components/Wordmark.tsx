import type { ElementType } from 'react'

interface WordmarkProps {
  size?: 'nav' | 'hero'
  as?: ElementType
}

export function Wordmark({ size = 'nav', as: Tag = 'div' }: WordmarkProps) {
  return <Tag className={`wordmark wordmark-${size}`}>Todoer</Tag>
}
