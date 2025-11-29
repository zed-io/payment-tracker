'use client'

import { useState, useEffect, useRef } from 'react'

interface CalculatorInputProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

type Operator = '+' | '-' | '*' | '/'

export default function CalculatorInput({
  value,
  onChange,
  placeholder = '0.00',
  className = '',
  autoFocus = false
}: CalculatorInputProps) {
  const [displayValue, setDisplayValue] = useState('')
  const [currentNumber, setCurrentNumber] = useState('')
  const [previousNumber, setPreviousNumber] = useState<number | null>(null)
  const [operator, setOperator] = useState<Operator | null>(null)
  const [showExpression, setShowExpression] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize from value prop
  useEffect(() => {
    if (value > 0 && !currentNumber && !operator) {
      setCurrentNumber(value.toString())
      setDisplayValue(value.toString())
    }
  }, [value, currentNumber, operator])

  const calculate = (num1: number, op: Operator, num2: number): number => {
    switch (op) {
      case '+': return num1 + num2
      case '-': return num1 - num2
      case '*': return num1 * num2
      case '/': return num2 !== 0 ? num1 / num2 : 0
      default: return num2
    }
  }

  const getDisplayOperator = (op: Operator): string => {
    switch (op) {
      case '+': return '+'
      case '-': return '-'
      case '*': return '×'
      case '/': return '÷'
      default: return ''
    }
  }

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value

    // Only allow numbers and decimal point in the raw input
    const sanitized = inputValue.replace(/[^0-9.]/g, '')

    // Handle multiple decimal points
    const parts = sanitized.split('.')
    const cleanValue = parts.length > 2
      ? parts[0] + '.' + parts.slice(1).join('')
      : sanitized

    setCurrentNumber(cleanValue)

    if (operator && previousNumber !== null) {
      // We're in the middle of an expression
      const currentNum = parseFloat(cleanValue) || 0
      const result = calculate(previousNumber, operator, currentNum)
      setShowExpression(true)
      onChange(result)
    } else {
      // Just a plain number
      setShowExpression(false)
      onChange(parseFloat(cleanValue) || 0)
    }
  }

  const handleOperator = (op: Operator) => {
    const currentNum = parseFloat(currentNumber) || 0

    if (operator && previousNumber !== null && currentNumber) {
      // Chain calculation: complete previous operation first
      const result = calculate(previousNumber, operator, currentNum)
      setPreviousNumber(result)
      setCurrentNumber('')
      setOperator(op)
      setShowExpression(false)
      onChange(result)
    } else {
      // Start new expression
      setPreviousNumber(currentNum)
      setCurrentNumber('')
      setOperator(op)
      setShowExpression(false)
    }

    // Keep focus on input
    inputRef.current?.focus()
  }

  const handleEquals = () => {
    if (operator && previousNumber !== null) {
      const currentNum = parseFloat(currentNumber) || 0
      const result = calculate(previousNumber, operator, currentNum)

      // Reset to just the result
      setCurrentNumber(result.toString())
      setPreviousNumber(null)
      setOperator(null)
      setShowExpression(false)
      onChange(result)
    }

    // Keep focus on input
    inputRef.current?.focus()
  }

  const handleClear = () => {
    setCurrentNumber('')
    setPreviousNumber(null)
    setOperator(null)
    setShowExpression(false)
    onChange(0)
    inputRef.current?.focus()
  }

  // Build the display expression
  const getExpressionDisplay = () => {
    if (!operator || previousNumber === null) return null

    const currentNum = parseFloat(currentNumber) || 0
    const result = calculate(previousNumber, operator, currentNum)

    return {
      expression: `${previousNumber}${getDisplayOperator(operator)}${currentNumber || '0'}=`,
      result: result.toFixed(2)
    }
  }

  const expression = showExpression ? getExpressionDisplay() : null

  const operatorButtons: { op: Operator; display: string }[] = [
    { op: '+', display: '+' },
    { op: '-', display: '-' },
    { op: '*', display: '×' },
    { op: '/', display: '÷' },
  ]

  return (
    <div className="space-y-2">
      {/* Display area */}
      <div className="relative">
        <div className="w-full px-4 py-4 glass-input text-center">
          {expression ? (
            <div className="flex items-center justify-center gap-1 text-2xl font-number">
              <span className="text-gray-400">{expression.expression}</span>
              <span className="font-bold text-foreground">{expression.result}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1 text-2xl font-number">
              {operator && previousNumber !== null && (
                <span className="text-gray-400">
                  {previousNumber}{getDisplayOperator(operator)}
                </span>
              )}
              <span className="font-bold text-foreground">
                {currentNumber || (operator ? '' : placeholder)}
              </span>
            </div>
          )}
        </div>

        {/* Hidden input for keyboard */}
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={currentNumber}
          onChange={handleNumberInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-text"
          autoFocus={autoFocus}
        />
      </div>

      {/* Calculator buttons - shown when focused or has value */}
      {(isFocused || currentNumber || operator) && (
        <div className="flex gap-2 pt-1">
          {operatorButtons.map(({ op, display }) => (
            <button
              key={op}
              type="button"
              onClick={() => handleOperator(op)}
              className={`flex-1 py-3 rounded-xl text-lg font-bold transition-all ${
                operator === op
                  ? 'bg-[#B34AFF] text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-foreground hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {display}
            </button>
          ))}
          <button
            type="button"
            onClick={handleEquals}
            className="flex-1 py-3 rounded-xl text-lg font-bold bg-[#43FF52] text-black hover:bg-[#38d946] transition-all"
          >
            =
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-3 rounded-xl text-lg font-bold bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-all"
          >
            C
          </button>
        </div>
      )}
    </div>
  )
}
