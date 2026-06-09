interface WordmarkProps {
  size?: 'nav' | 'hero'
}

export function Wordmark({ size = 'nav' }: WordmarkProps) {
  return <div className={`wordmark wordmark-${size}`}>Todoer</div>
}
