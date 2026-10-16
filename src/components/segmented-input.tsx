import { Fragment, useRef, type ReactNode } from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface InputSegment {
  name: string
  label: string
  value: string
  placeholder: string
  length: number
  min: number
  max: number
}

interface SegmentedInputProps {
  id: string
  label: string
  segments: InputSegment[]
  separator: string
  invalid: boolean
  onChange: (values: string[]) => void
  parseFullValue: (value: string) => string[] | null
  trailing?: ReactNode
}

function normalizeDigits(value: string) {
  return value.replace(/[０-９]/g, (digit) =>
    String(digit.charCodeAt(0) - '０'.charCodeAt(0)),
  )
}

function SegmentedInput({
  id,
  label,
  segments,
  separator,
  invalid,
  onChange,
  parseFullValue,
  trailing,
}: SegmentedInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const autoAdvancedTo = useRef<number | null>(null)

  function focusSegment(index: number, automatic = false) {
    autoAdvancedTo.current = automatic ? index : null
    const input = inputs.current[index]
    input?.focus()
    input?.select()
  }

  function changeSegment(index: number, nextValue: string) {
    onChange(segments.map((segment, position) =>
      position === index ? nextValue : segment.value,
    ))
  }

  function normalizeSegment(index: number) {
    const segment = segments[index]
    const number = Number(segment.value)
    if (
      segment.value &&
      number >= segment.min &&
      number <= segment.max
    ) {
      const normalized = segment.value.padStart(segment.length, '0')
      if (normalized !== segment.value) changeSegment(index, normalized)
    }
  }

  function acceptFullValue(value: string) {
    const values = parseFullValue(normalizeDigits(value.trim()))
    if (!values) return false

    onChange(values)
    requestAnimationFrame(() => focusSegment(segments.length - 1))
    return true
  }

  return (
    <div
      role="group"
      aria-label={label}
      aria-invalid={invalid}
      className={cn(
        'flex h-9 w-full min-w-0 items-center rounded-md border border-input bg-transparent px-2 shadow-xs transition-[color,box-shadow]',
        'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
      )}
    >
      <div className="flex shrink-0 items-center tabular-nums">
        {segments.map((segment, index) => (
          <Fragment key={segment.name}>
            {index > 0 && (
              <span aria-hidden="true" className="text-sm text-muted-foreground">
                {separator}
              </span>
            )}
            <Input
              ref={(input) => { inputs.current[index] = input }}
              id={index === 0 ? id : `${id}-${segment.name}`}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              role="spinbutton"
              aria-label={`${label}，${segment.label}`}
              aria-valuemin={segment.min}
              aria-valuemax={segment.max}
              aria-valuenow={segment.value ? Number(segment.value) : undefined}
              aria-invalid={invalid}
              value={segment.value}
              placeholder={segment.placeholder}
              maxLength={segment.length}
              className={cn(
                'h-7 shrink-0 rounded-sm border-0 px-1 py-0 text-center shadow-none hover:bg-accent focus:bg-accent focus-visible:border-transparent focus-visible:ring-0 aria-invalid:ring-0',
                segment.length === 4 ? 'w-[5ch]' : 'w-[3ch]',
              )}
              onFocus={(event) => event.currentTarget.select()}
              onClick={(event) => {
                autoAdvancedTo.current = null
                event.currentTarget.select()
              }}
              onChange={(event) => {
                const value = normalizeDigits(event.target.value)
                if (acceptFullValue(value)) return
                if (!/^\d*$/.test(value)) return

                const digits = value.slice(0, segment.length)
                changeSegment(index, digits)
                if (
                  digits.length === segment.length &&
                  Number(digits) >= segment.min &&
                  Number(digits) <= segment.max &&
                  index < segments.length - 1
                ) {
                  requestAnimationFrame(() => focusSegment(index + 1, true))
                }
              }}
              onBlur={() => normalizeSegment(index)}
              onPaste={(event) => {
                if (acceptFullValue(event.clipboardData.getData('text'))) {
                  event.preventDefault()
                }
              }}
              onKeyDown={(event) => {
                const isSeparator = [':', '：', '/', '-', '.'].includes(event.key)
                if (isSeparator && autoAdvancedTo.current === index) {
                  event.preventDefault()
                  autoAdvancedTo.current = null
                  return
                }
                autoAdvancedTo.current = null
                if (event.key === 'Enter') {
                  event.currentTarget.blur()
                } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                  event.preventDefault()
                  const step = event.key === 'ArrowUp' ? 1 : -1
                  const current = segment.value ? Number(segment.value) : segment.min - step
                  const next = Math.min(segment.max, Math.max(segment.min, current + step))
                  changeSegment(index, String(next).padStart(segment.length, '0'))
                  requestAnimationFrame(() => inputs.current[index]?.select())
                } else if (
                  event.key === 'ArrowRight' ||
                  isSeparator
                ) {
                  event.preventDefault()
                  normalizeSegment(index)
                  focusSegment(Math.min(index + 1, segments.length - 1))
                } else if (event.key === 'ArrowLeft') {
                  event.preventDefault()
                  focusSegment(Math.max(0, index - 1))
                } else if (event.key === 'Backspace' && !segment.value && index > 0) {
                  event.preventDefault()
                  focusSegment(index - 1)
                }
              }}
            />
          </Fragment>
        ))}
      </div>
      {trailing && <div className="ml-auto flex shrink-0 items-center">{trailing}</div>}
    </div>
  )
}

export { SegmentedInput }
