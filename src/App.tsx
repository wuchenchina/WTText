import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowCounterClockwise,
  Check,
  Clock,
  CopySimple,
  WarningCircle,
  WechatLogo,
} from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { DateInput } from '@/components/date-input'
import { TimeInput } from '@/components/time-input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { dateForInput, parseDateInput } from '@/lib/date'

type Shift = '白班' | '夜班'
type CustomMode = 'location' | 'full'

interface BreakState {
  enabled: boolean
  minutes: number
}

interface Calculation {
  grossMinutes: number
  breakMinutes: number
  netMinutes: number
  isOvernight: boolean
  error: string | null
}

function todayForInput() {
  return dateForInput(new Date())
}

function parseTime(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(':')
  return `${Number(hours)}:${minutes}`
}

function formatDate(value: string) {
  const [, month, day] = value.split('-').map(Number)
  return month && day ? `${month}月${day}日` : '尚未選擇'
}

function formatHours(minutes: number) {
  return Number((minutes / 60).toFixed(2)).toString()
}

function hourUnit(hours: number) {
  return hours === 1 ? 'hr' : 'hrs'
}

function minuteUnit(minutes: number) {
  return minutes === 1 ? 'min' : 'mins'
}

function DurationNote({ minutes }: { minutes: number }) {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return (
    <>
      {hours > 0 ? (
        <>
          <span className="font-hours">{hours}</span> {hourUnit(hours)}
        </>
      ) : null}
      {hours > 0 && remainingMinutes > 0 ? ' ' : null}
      {remainingMinutes > 0 || hours === 0 ? (
        <>
          <span className="font-hours">{remainingMinutes}</span> {minuteUnit(remainingMinutes)}
        </>
      ) : null}
    </>
  )
}

function App() {
  const [date, setDate] = useState(todayForInput)
  const [shift, setShift] = useState<Shift>('白班')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('20:00')
  const [lunch, setLunch] = useState<BreakState>({
    enabled: true,
    minutes: 45,
  })
  const [afternoon, setAfternoon] = useState<BreakState>({
    enabled: true,
    minutes: 45,
  })
  const [includeCheckoutText, setIncludeCheckoutText] = useState(false)
  const [customMode, setCustomMode] = useState<CustomMode>('location')
  const [location, setLocation] = useState('响水')
  const [customText, setCustomText] = useState('响水下班打卡')
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<number | null>(null)

  const calculation = useMemo<Calculation>(() => {
    if (!parseDateInput(date)) {
      return {
        grossMinutes: 0,
        breakMinutes: 0,
        netMinutes: 0,
        isOvernight: false,
        error: '請輸入有效的日期。',
      }
    }

    const start = parseTime(startTime)
    const end = parseTime(endTime)

    if (start === null || end === null) {
      return {
        grossMinutes: 0,
        breakMinutes: 0,
        netMinutes: 0,
        isOvernight: false,
        error: '請輸入有效的上班與下班時間。',
      }
    }

    if (start === end) {
      return {
        grossMinutes: 0,
        breakMinutes: 0,
        netMinutes: 0,
        isOvernight: false,
        error: '上班與下班時間不能相同。',
      }
    }

    const isOvernight = end < start
    const grossMinutes = (isOvernight ? end + 24 * 60 : end) - start
    const breakMinutes =
      (lunch.enabled ? Math.max(0, lunch.minutes) : 0) +
      (afternoon.enabled ? Math.max(0, afternoon.minutes) : 0)
    const netMinutes = grossMinutes - breakMinutes

    return {
      grossMinutes,
      breakMinutes,
      netMinutes: Math.max(0, netMinutes),
      isOvernight,
      error:
        netMinutes <= 0
          ? '休息時間不可大於或等於整段班次。'
          : null,
    }
  }, [afternoon, date, endTime, lunch, startTime])

  const checkoutText =
    customMode === 'location'
      ? `${location.trim() || '响水'}下班打卡`
      : customText.trim() || '响水下班打卡'

  const detailText = [
    `日期: ${formatDate(date)}`,
    `班别: ${shift}`,
    `上班时间: ${formatTime(startTime)}-${formatTime(endTime)}`,
    `工时: ${formatHours(calculation.netMinutes)}H`,
  ].join('\n\n')

  const outputText = includeCheckoutText
    ? `${checkoutText}\n\n${detailText}`
    : detailText

  useEffect(() => {
    return () => {
      if (copiedTimer.current) window.clearTimeout(copiedTimer.current)
    }
  }, [])

  async function copyOutput() {
    if (calculation.error) return

    try {
      await navigator.clipboard.writeText(outputText)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = outputText
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
    }

    setCopied(true)
    if (copiedTimer.current) window.clearTimeout(copiedTimer.current)
    copiedTimer.current = window.setTimeout(() => setCopied(false), 1800)
  }

  function openWeChat() {
    window.location.assign('weixin://')
  }

  function changeShift(nextShift: Shift) {
    setShift(nextShift)
    if (nextShift === '夜班') {
      setStartTime('20:00')
      setEndTime('08:00')
    } else {
      setStartTime('08:00')
      setEndTime('20:00')
    }
  }

  function resetForm() {
    setDate(todayForInput())
    setShift('白班')
    setStartTime('08:00')
    setEndTime('20:00')
    setLunch({ enabled: true, minutes: 45 })
    setAfternoon({ enabled: true, minutes: 45 })
    setIncludeCheckoutText(false)
    setCustomMode('location')
    setLocation('响水')
    setCustomText('响水下班打卡')
    setCopied(false)
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b font-title font-normal">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Clock className="size-5" aria-hidden="true" />
            <h1 className="text-lg font-normal">工時回饋工具</h1>
          </div>
          <Button type="button" variant="ghost" size="sm" className="font-normal" onClick={resetForm}>
            <ArrowCounterClockwise aria-hidden="true" />
            重設
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-2">
        <section aria-labelledby="form-title" className="min-w-0">
          <Card>
            <CardHeader>
              <CardTitle id="form-title" className="font-title font-normal">班次設定</CardTitle>
              <CardDescription>
                填寫上下班時間，勾選要扣除的休息時間。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid content-start gap-2">
                  <Label htmlFor="work-date" className="h-4 font-title font-normal">日期</Label>
                  <DateInput id="work-date" value={date} onChange={setDate} />
                </div>
                <div className="grid content-start gap-2" role="group" aria-labelledby="shift-label">
                  <Label id="shift-label" className="h-4 font-title font-normal">班別</Label>
                  <div className="grid h-9 grid-cols-2 gap-2">
                    {(['白班', '夜班'] as const).map((item) => (
                      <Button
                        key={item}
                        type="button"
                        className="font-title font-normal"
                        variant={shift === item ? 'default' : 'outline'}
                        aria-pressed={shift === item}
                        onClick={() => changeShift(item)}
                      >
                        {item}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-time" className="font-title font-normal">上班時間</Label>
                    <TimeInput
                      id="start-time"
                      label="上班時間"
                      value={startTime}
                      onChange={setStartTime}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time" className="font-title font-normal">下班時間</Label>
                    <TimeInput
                      id="end-time"
                      label="下班時間"
                      value={endTime}
                      onChange={setEndTime}
                    />
                  </div>
                </div>
                {calculation.isOvernight && !calculation.error ? (
                  <p className="text-sm text-muted-foreground">
                    下班時間視為隔日，已按跨日班次計算。
                  </p>
                ) : null}
              </div>

              <fieldset className="space-y-4 border-t pt-6">
                <legend className="sr-only">休息時間</legend>
                <div>
                  <p className="font-title text-sm font-normal">休息時間</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    每餐預設 45 分鐘，未勾選則不扣除。
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <BreakControl
                    id="lunch"
                    label="中午休息"
                    state={lunch}
                    onChange={setLunch}
                  />
                  <BreakControl
                    id="afternoon"
                    label="下午休息"
                    state={afternoon}
                    onChange={setAfternoon}
                  />
                </div>
              </fieldset>

              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="include-checkout-text"
                    checked={includeCheckoutText}
                    onCheckedChange={(checked) =>
                      setIncludeCheckoutText(checked === true)
                    }
                  />
                  <Label htmlFor="include-checkout-text">
                    顯示下班打卡文字
                  </Label>
                </div>

                {includeCheckoutText ? (
                  <div className="space-y-4">
                    <div className="flex gap-2" aria-label="打卡文字設定方式">
                      <Button
                        type="button"
                        size="sm"
                        variant={customMode === 'location' ? 'secondary' : 'outline'}
                        aria-pressed={customMode === 'location'}
                        onClick={() => setCustomMode('location')}
                      >
                        只改地點
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={customMode === 'full' ? 'secondary' : 'outline'}
                        aria-pressed={customMode === 'full'}
                        onClick={() => setCustomMode('full')}
                      >
                        自訂全文
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="checkout-text">
                        {customMode === 'location' ? '地點名稱' : '完整文字'}
                      </Label>
                      <Input
                        id="checkout-text"
                        value={customMode === 'location' ? location : customText}
                        maxLength={customMode === 'location' ? 12 : 40}
                        onChange={(event) =>
                          customMode === 'location'
                            ? setLocation(event.target.value)
                            : setCustomText(event.target.value)
                        }
                        placeholder={
                          customMode === 'location'
                            ? '例如：响水'
                            : '輸入完整的下班打卡文字'
                        }
                        aria-describedby="checkout-description"
                      />
                      <p id="checkout-description" className="text-sm text-muted-foreground">
                        將在正文上方顯示：{checkoutText}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </section>

        <aside aria-labelledby="result-title" className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle id="result-title" className="font-title font-normal">回饋內容</CardTitle>
              <CardDescription>確認內容後，即可複製貼上。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="font-title text-sm font-normal text-muted-foreground">淨工時</p>
                <p className="mt-1 text-4xl tabular-nums">
                  <span className="font-hours font-normal">
                    {calculation.error ? '0' : formatHours(calculation.netMinutes)}
                  </span>
                  <span className="ml-1 font-title text-base font-normal text-muted-foreground">
                    {hourUnit(Number(formatHours(calculation.error ? 0 : calculation.netMinutes)))}
                  </span>
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-4">
                <SummaryItem
                  label="班次總長"
                  minutes={calculation.grossMinutes}
                  showNote={calculation.grossMinutes % 60 !== 0}
                />
                <SummaryItem
                  label="休息合計"
                  minutes={calculation.breakMinutes}
                  showNote
                />
              </dl>

              {calculation.error ? (
                <p className="flex items-start gap-2 text-sm text-destructive" role="alert">
                  <WarningCircle className="size-4 shrink-0" aria-hidden="true" />
                  {calculation.error}
                </p>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="output-preview" className="font-title font-normal">文字預覽</Label>
                  <Textarea
                    id="output-preview"
                    readOnly
                    value={outputText}
                    rows={includeCheckoutText ? 9 : 7}
                    className="resize-none font-preview font-normal leading-7"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  className="w-full font-title font-normal"
                  disabled={Boolean(calculation.error)}
                  onClick={copyOutput}
                  aria-live="polite"
                >
                  {copied ? (
                    <>
                      <Check aria-hidden="true" />
                      已複製
                    </>
                  ) : (
                    <>
                      <CopySimple aria-hidden="true" />
                      複製工時回饋
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-[#07c160] bg-[#07c160] font-preview font-normal text-white hover:border-[#06ad56] hover:bg-[#06ad56] hover:text-white focus-visible:border-[#07c160] focus-visible:ring-[#07c160]/50"
                  onClick={openWeChat}
                >
                  <WechatLogo aria-hidden="true" />
                  跳轉到微信
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                淨工時 = 班次總長 − 已勾選的休息時間。
              </p>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  )
}

function BreakControl({
  id,
  label,
  state,
  onChange,
}: {
  id: string
  label: string
  state: BreakState
  onChange: (state: BreakState) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Checkbox
          id={id}
          checked={state.enabled}
          onCheckedChange={(checked) =>
            onChange({ ...state, enabled: checked === true })
          }
        />
        <Label htmlFor={id} className="font-title font-normal">{label}</Label>
      </div>
      <div className="flex items-center gap-2">
        <Input
          aria-label={`${label}分鐘`}
          type="number"
          min="0"
          max="240"
          step="5"
          value={state.minutes}
          disabled={!state.enabled}
          onChange={(event) =>
            onChange({
              ...state,
              minutes: Math.min(240, Math.max(0, Number(event.target.value))),
            })
          }
        />
        <span className="shrink-0 whitespace-nowrap font-title text-sm font-normal text-muted-foreground">分鐘</span>
      </div>
    </div>
  )
}

function SummaryItem({
  label,
  minutes,
  showNote = false,
}: {
  label: string
  minutes: number
  showNote?: boolean
}) {
  return (
    <div>
      <dt className="font-title text-sm font-normal text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-title text-sm font-normal tabular-nums">
        <span className="font-hours">{formatHours(minutes)}</span> {hourUnit(Number(formatHours(minutes)))}
        {showNote ? (
          <span className="ml-1 text-muted-foreground">（<DurationNote minutes={minutes} />）</span>
        ) : null}
      </dd>
    </div>
  )
}

export default App
