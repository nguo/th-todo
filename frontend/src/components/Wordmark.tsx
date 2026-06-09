interface WordmarkProps {
  size?: 'nav' | 'hero'
}

export function Wordmark({ size = 'nav' }: WordmarkProps) {
  return <span className={`wordmark wordmark-${size}`}>Todoer</span>
}
