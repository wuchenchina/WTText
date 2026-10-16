import { useState } from 'react'
import { CalendarBlank } from '@phosphor-icons/react'
import { zhTW } from 'date-fns/locale'

import { SegmentedInput } from '@/components/segmented-input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { dateForInput, parseDateInput } from '@/lib/date'

interface DateInputProps {
  id: string
  value: string
  onChange: (value: string) => void
}

function parsePastedDate(value: string) {
  const match = /^(\d{4})\s*[-/.年]\s*(\d{1,2})\s*[-/.月]\s*(\d{1,2})\s*日?$/.exec(value)
    ?? /^(\d{4})(\d{2})(\d{2})$/.exec(value)
  return match ? match.slice(1).map((part, index) => part.padStart(index === 0 ? 4 : 2, '0')) : null
}

function DateInput({ id, value, onChange }: DateInputProps) {
  const [open, setOpen] = useState(false)
  const [year = '', month = '', day = ''] = value.split('-')
  const selectedDate = parseDateInput(value)

  return (
    <SegmentedInput
      id={id}
      label="日期"
      separator="/"
      invalid={!selectedDate}
      segments={[
        { name: 'year', label: '年', value: year, placeholder: 'YYYY', length: 4, min: 1, max: 9999 },
        { name: 'month', label: '月', value: month, placeholder: 'MM', length: 2, min: 1, max: 12 },
        { name: 'day', label: '日', value: day, placeholder: 'DD', length: 2, min: 1, max: 31 },
      ]}
      onChange={(parts) => onChange(parts.join('-'))}
      parseFullValue={parsePastedDate}
      trailing={
        <>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="開啟日曆"
              >
                <CalendarBlank className="size-4" aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                locale={zhTW}
                selected={selectedDate}
                defaultMonth={selectedDate}
                onSelect={(date) => {
                  if (!date) return
                  onChange(dateForInput(date))
                  setOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onChange(dateForInput(new Date()))}
          >
            今日
          </Button>
        </>
      }
    />
  )
}

export { DateInput }
