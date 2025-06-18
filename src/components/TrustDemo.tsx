import { useState, useEffect } from 'react'

export const Hero = () => {
  const [text, setText] = useState('')
  const fullText = 'Your one-liner here'

  useEffect(() => {
    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setText(fullText.slice(0, currentIndex))
        currentIndex++
      } else {
        clearInterval(interval)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Handle Enter key press
      console.log('Enter pressed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          {text}
          <span className="animate-blink">|</span>
        </h1>
        <input
          type="text"
          className="mt-4 p-2 border rounded"
          onKeyPress={handleKeyPress}
          placeholder="Press Enter..."
        />
      </div>
    </div>
  )
} 