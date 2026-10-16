import { SegmentedInput } from '@/components/segmented-input'

interface TimeInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}

function TimeInput({ id, label, value, onChange }: TimeInputProps) {
  const timeMatch = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value)
  const [hours = '', minutes = ''] = value.split(':')

  return (
    <SegmentedInput
      id={id}
      label={label}
      separator=":"
      invalid={!timeMatch}
      segments={[
        { name: 'hours', label: '小時', value: hours, placeholder: 'HH', length: 2, min: 0, max: 23 },
        { name: 'minutes', label: '分鐘', value: minutes, placeholder: 'mm', length: 2, min: 0, max: 59 },
      ]}
      onChange={(parts) => onChange(parts.join(':'))}
      parseFullValue={(text) => {
        const match = /^(\d{1,2})\s*[:：]\s*(\d{1,2})$/.exec(text)
          ?? /^(\d{2})(\d{2})$/.exec(text)
        return match ? match.slice(1).map((part) => part.padStart(2, '0')) : null
      }}
    />
  )
}

export { TimeInput }
