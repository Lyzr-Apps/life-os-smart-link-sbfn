'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import type { AIAgentResponse } from '@/lib/aiAgent'
import { RiDashboardLine, RiHeartPulseLine, RiMoneyDollarCircleLine, RiBriefcaseLine, RiUserHeartLine, RiCalendarCheckLine, RiFlagLine, RiChat3Line, RiSendPlaneFill, RiCloseLine, RiArrowUpSLine, RiArrowDownSLine, RiMenuLine, RiSparklingLine, RiLightbulbLine, RiArrowRightLine, RiTimeLine, RiAddLine, RiSearchLine, RiBarChartLine } from 'react-icons/ri'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const AGENT_IDS = {
  insight: '699f59be790ead763ca87cd2',
  coach: '699f59be87c8da309e64d88e',
  tracker: '699f59be0a4cf39744b0dfff',
} as const

type DomainKey = 'health' | 'finance' | 'career' | 'relationships' | 'habits' | 'goals'
type ActiveSection = 'dashboard' | DomainKey

// ─── INTERFACES ──────────────────────────────────────────────────────────────

interface DomainScores {
  health: number
  finance: number
  career: number
  relationships: number
  habits: number
  goals: number
}

interface Recommendation {
  domain: string
  title: string
  description: string
  priority: string
}

interface OrbState {
  glow_intensity: number
  color: string
  pulse_speed: 'slow' | 'medium' | 'fast'
}

interface InsightData {
  overall_score: number
  domain_scores: DomainScores
  patterns: string[]
  recommendations: Recommendation[]
  orb_state: OrbState
  summary: string
}

interface ActionItem {
  task: string
  domain: string
  timeframe: string
}

interface EntryMetric {
  name: string
  value: string
  unit: string
}

interface DomainEntry {
  domain: string
  content: string
  tags: string[]
  metrics: EntryMetric[]
  sentiment: 'positive' | 'neutral' | 'negative'
  timestamp: string
  summary?: string
  suggestions?: string[]
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  action_items?: ActionItem[]
  suggested_followups?: string[]
  timestamp: string
}

// ─── DOMAIN CONFIG ───────────────────────────────────────────────────────────

const DOMAINS: { key: DomainKey; label: string; icon: React.ReactNode }[] = [
  { key: 'health', label: 'Health', icon: <RiHeartPulseLine size={18} /> },
  { key: 'finance', label: 'Finance', icon: <RiMoneyDollarCircleLine size={18} /> },
  { key: 'career', label: 'Career', icon: <RiBriefcaseLine size={18} /> },
  { key: 'relationships', label: 'Relationships', icon: <RiUserHeartLine size={18} /> },
  { key: 'habits', label: 'Habits', icon: <RiCalendarCheckLine size={18} /> },
  { key: 'goals', label: 'Goals', icon: <RiFlagLine size={18} /> },
]

// ─── SAMPLE DATA ─────────────────────────────────────────────────────────────

const SAMPLE_INSIGHT: InsightData = {
  overall_score: 72,
  domain_scores: { health: 78, finance: 65, career: 80, relationships: 70, habits: 68, goals: 71 },
  patterns: [
    'Strong consistency in career-related activities over the past month',
    'Health metrics show improvement but sleep patterns need attention',
    'Financial tracking has gaps -- consider daily expense logging',
    'Social connections appear strong but could benefit from deeper check-ins',
  ],
  recommendations: [
    { domain: 'health', title: 'Improve Sleep Hygiene', description: 'Your sleep data suggests irregular patterns. Establish a consistent bedtime routine and aim for 7-8 hours nightly.', priority: 'high' },
    { domain: 'finance', title: 'Daily Expense Tracking', description: 'Start logging daily expenses to identify spending patterns and potential savings opportunities.', priority: 'medium' },
    { domain: 'habits', title: 'Morning Routine Optimization', description: 'Build a structured morning routine combining exercise, meditation, and planning for improved daily productivity.', priority: 'medium' },
  ],
  orb_state: { glow_intensity: 0.7, color: '#BF9B30', pulse_speed: 'medium' },
  summary: 'Your life health score is at 72/100. Career is your strongest domain at 80, while finance at 65 needs the most attention. You show strong consistency in professional growth but could benefit from better financial tracking and sleep habits.',
}

const SAMPLE_ENTRIES: Record<string, DomainEntry[]> = {
  health: [
    { domain: 'health', content: 'Completed a 5K morning run. Felt energized. Heart rate averaged 145 bpm.', tags: ['exercise', 'running', 'cardio'], metrics: [{ name: 'Distance', value: '5', unit: 'km' }, { name: 'Heart Rate', value: '145', unit: 'bpm' }], sentiment: 'positive', timestamp: '2025-02-24T07:30:00Z', summary: 'Good cardio session logged.', suggestions: ['Consider adding interval training'] },
    { domain: 'health', content: 'Slept only 5 hours. Felt groggy most of the day.', tags: ['sleep', 'rest'], metrics: [{ name: 'Sleep Duration', value: '5', unit: 'hours' }], sentiment: 'negative', timestamp: '2025-02-23T22:00:00Z', summary: 'Poor sleep recorded.', suggestions: ['Try limiting screen time before bed'] },
  ],
  finance: [
    { domain: 'finance', content: 'Reviewed monthly budget. Overspent on dining out by $120.', tags: ['budget', 'dining', 'review'], metrics: [{ name: 'Over Budget', value: '120', unit: 'USD' }], sentiment: 'neutral', timestamp: '2025-02-22T18:00:00Z', summary: 'Budget review complete.', suggestions: ['Set weekly dining budget alerts'] },
  ],
  career: [
    { domain: 'career', content: 'Completed the leadership workshop. Received positive feedback from the team lead.', tags: ['workshop', 'leadership', 'growth'], metrics: [{ name: 'Workshop Hours', value: '4', unit: 'hours' }], sentiment: 'positive', timestamp: '2025-02-21T14:00:00Z', summary: 'Professional development logged.', suggestions: ['Apply learnings in next team meeting'] },
  ],
  relationships: [],
  habits: [
    { domain: 'habits', content: 'Maintained 7-day meditation streak. 15 minutes each morning.', tags: ['meditation', 'mindfulness', 'streak'], metrics: [{ name: 'Streak', value: '7', unit: 'days' }, { name: 'Duration', value: '15', unit: 'min' }], sentiment: 'positive', timestamp: '2025-02-24T06:15:00Z', summary: 'Meditation streak continues.', suggestions: ['Try extending to 20 minutes'] },
  ],
  goals: [],
}

const SAMPLE_CHAT: ChatMessage[] = [
  { role: 'user', content: 'What should I focus on this week?', timestamp: '2025-02-24T09:00:00Z' },
  { role: 'assistant', content: 'Based on your recent activity, I recommend focusing on three key areas this week:\n\n**1. Sleep Optimization** -- Your recent sleep data shows only 5 hours. Prioritize getting 7-8 hours by setting a consistent bedtime.\n\n**2. Financial Tracking** -- You overspent on dining last month. Start logging daily expenses to build awareness.\n\n**3. Continue Your Streaks** -- Your meditation and running habits are strong. Maintain momentum by keeping your streaks alive.', action_items: [{ task: 'Set a 10pm bedtime alarm', domain: 'health', timeframe: 'This week' }, { task: 'Log expenses daily in finance tracker', domain: 'finance', timeframe: 'Ongoing' }], suggested_followups: ['How can I improve my sleep quality?', 'Create a weekly meal prep budget'], timestamp: '2025-02-24T09:00:05Z' },
]

// ─── MARKDOWN RENDERER ───────────────────────────────────────────────────────

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-medium text-foreground">{part}</strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  )
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-medium text-sm mt-3 mb-1 text-foreground">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-medium text-base mt-3 mb-1 text-foreground">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-medium text-lg mt-4 mb-2 text-foreground">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm text-muted-foreground leading-relaxed">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm text-muted-foreground leading-relaxed">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{formatInline(line)}</p>
      })}
    </div>
  )
}

// ─── SCORE RING COMPONENT ────────────────────────────────────────────────────

function ScoreRing({ score, size = 80, strokeWidth = 4 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const safeScore = Math.min(Math.max(score, 0), 100)
  const offset = circumference - (safeScore / 100) * circumference

  const getScoreColor = (s: number) => {
    if (s >= 75) return 'hsl(40, 50%, 55%)'
    if (s >= 50) return 'hsl(30, 40%, 50%)'
    return 'hsl(0, 40%, 50%)'
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(30, 5%, 18%)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={getScoreColor(safeScore)} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="square" className="transition-all duration-1000 ease-out" />
      </svg>
      <span className="absolute text-sm font-light tracking-wider" style={{ color: getScoreColor(safeScore) }}>{safeScore}</span>
    </div>
  )
}

// ─── LIFE ORB COMPONENT ──────────────────────────────────────────────────────

function LifeOrb({ orbState, score, isLoading }: { orbState?: OrbState; score?: number; isLoading: boolean }) {
  const color = orbState?.color || '#BF9B30'
  const intensity = orbState?.glow_intensity ?? 0.5
  const pulseSpeed = orbState?.pulse_speed === 'fast' ? '1.5s' : orbState?.pulse_speed === 'slow' ? '4s' : '2.5s'

  const hexToShadow = (hex: string, alpha: number): string => {
    const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0')
    return hex + alphaHex
  }

  return (
    <div className="relative flex flex-col items-center justify-center py-8 md:py-12">
      {/* Outer glow ring */}
      <div className="absolute w-52 h-52 md:w-64 md:h-64 rounded-full opacity-20" style={{ background: `radial-gradient(circle, ${hexToShadow(color, 0.25)} 0%, transparent 70%)`, animation: `orbPulse ${pulseSpeed} ease-in-out infinite` }} />

      {/* Rotating ring */}
      <div className="absolute w-44 h-44 md:w-56 md:h-56 rounded-full border border-primary/20" style={{ animation: 'orbRotate 20s linear infinite' }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 rounded-full bg-primary/60" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-1.5 h-1.5 rounded-full bg-primary/40" />
      </div>

      {/* Main orb */}
      <div className="relative w-36 h-36 md:w-48 md:h-48 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-500 hover:scale-105" style={{ background: `radial-gradient(circle at 35% 35%, ${hexToShadow(color, 0.56)}, ${hexToShadow(color, 0.31)}, hsl(30, 8%, 12%))`, boxShadow: `0 0 ${60 * intensity}px ${hexToShadow(color, intensity * 0.5)}, 0 0 ${120 * intensity}px ${hexToShadow(color, intensity * 0.2)}`, animation: `orbPulse ${pulseSpeed} ease-in-out infinite, orbGlow ${pulseSpeed} ease-in-out infinite` }}>
        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            <span className="text-xs font-light tracking-widest text-primary-foreground/70 uppercase">Analyzing</span>
          </div>
        ) : score !== undefined && score > 0 ? (
          <div className="flex flex-col items-center">
            <span className="text-4xl md:text-5xl font-light tracking-wider text-primary-foreground/90">{score}</span>
            <span className="text-xs font-light tracking-widest text-primary-foreground/60 uppercase mt-1">Life Score</span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center px-4">
            <RiSparklingLine size={24} className="text-primary-foreground/70 mb-2" />
            <span className="text-xs font-light tracking-widest text-primary-foreground/60 uppercase">Begin Your Journey</span>
          </div>
        )}
      </div>

      {/* Floating particles */}
      <div className="absolute w-2 h-2 rounded-full bg-primary/30" style={{ top: '15%', left: '20%', animation: 'float 3s ease-in-out infinite' }} />
      <div className="absolute w-1.5 h-1.5 rounded-full bg-primary/20" style={{ top: '25%', right: '22%', animation: 'float 4s ease-in-out infinite 1s' }} />
      <div className="absolute w-1 h-1 rounded-full bg-primary/25" style={{ bottom: '20%', left: '25%', animation: 'float 3.5s ease-in-out infinite 0.5s' }} />
      <div className="absolute w-1.5 h-1.5 rounded-full bg-primary/15" style={{ bottom: '25%', right: '18%', animation: 'float 4.5s ease-in-out infinite 1.5s' }} />
    </div>
  )
}

// ─── TYPING INDICATOR ────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" style={{ animation: 'typingDot 1.4s infinite ease-in-out' }} />
      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" style={{ animation: 'typingDot 1.4s infinite ease-in-out 0.2s' }} />
      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" style={{ animation: 'typingDot 1.4s infinite ease-in-out 0.4s' }} />
    </div>
  )
}

// ─── SENTIMENT DOT ───────────────────────────────────────────────────────────

function SentimentDot({ sentiment }: { sentiment: string }) {
  const color = sentiment === 'positive' ? 'bg-green-500' : sentiment === 'negative' ? 'bg-red-400' : 'bg-yellow-500'
  return <div className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />
}

// ─── ERROR BOUNDARY ──────────────────────────────────────────────────────────

class PageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-medium mb-2 tracking-wider">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-6 py-2 bg-primary text-primary-foreground text-sm tracking-wider">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

export default function Page() {
  // ─── STATE ───────────────────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard')
  const [chatOpen, setChatOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sampleData, setSampleData] = useState(false)
  const [insightData, setInsightData] = useState<InsightData | null>(null)
  const [domainEntries, setDomainEntries] = useState<Record<string, DomainEntry[]>>({
    health: [], finance: [], career: [], relationships: [], habits: [], goals: [],
  })
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isLoadingInsight, setIsLoadingInsight] = useState(false)
  const [isLoadingTracker, setIsLoadingTracker] = useState(false)
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [entryInput, setEntryInput] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [showEntryForm, setShowEntryForm] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [insightExpanded, setInsightExpanded] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)

  // ─── DATA ACCESSORS ──────────────────────────────────────────────────────────

  const currentInsight = sampleData ? SAMPLE_INSIGHT : insightData
  const currentEntries = sampleData ? SAMPLE_ENTRIES : domainEntries
  const currentChat = sampleData ? SAMPLE_CHAT : chatMessages

  // ─── PERSISTENCE ─────────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const savedEntries = localStorage.getItem('lifeos_entries')
      if (savedEntries) {
        const parsed = JSON.parse(savedEntries)
        if (parsed && typeof parsed === 'object') setDomainEntries(parsed)
      }
      const savedInsight = localStorage.getItem('lifeos_insight')
      if (savedInsight) {
        const parsed = JSON.parse(savedInsight)
        if (parsed && typeof parsed === 'object') setInsightData(parsed)
      }
      const savedChat = localStorage.getItem('lifeos_chat')
      if (savedChat) {
        const parsed = JSON.parse(savedChat)
        if (Array.isArray(parsed)) setChatMessages(parsed)
      }
    } catch {
      // Silently fail on corrupt localStorage
    }
  }, [])

  useEffect(() => {
    if (!sampleData) {
      try { localStorage.setItem('lifeos_entries', JSON.stringify(domainEntries)) } catch {}
    }
  }, [domainEntries, sampleData])

  useEffect(() => {
    if (!sampleData && insightData) {
      try { localStorage.setItem('lifeos_insight', JSON.stringify(insightData)) } catch {}
    }
  }, [insightData, sampleData])

  useEffect(() => {
    if (!sampleData) {
      try { localStorage.setItem('lifeos_chat', JSON.stringify(chatMessages)) } catch {}
    }
  }, [chatMessages, sampleData])

  // ─── SCROLL CHAT ─────────────────────────────────────────────────────────────

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentChat, isLoadingChat])

  // ─── STATUS MESSAGE TIMER ────────────────────────────────────────────────────

  useEffect(() => {
    if (statusMessage) {
      const t = setTimeout(() => setStatusMessage(null), 4000)
      return () => clearTimeout(t)
    }
  }, [statusMessage])

  // ─── AGENT CALLS ─────────────────────────────────────────────────────────────

  const parseAgentResponse = useCallback((result: AIAgentResponse): Record<string, unknown> | null => {
    if (!result?.success || !result?.response) return null
    const resp = result.response
    if (resp?.result && typeof resp.result === 'object' && Object.keys(resp.result).length > 0) {
      return resp.result as Record<string, unknown>
    }
    if (resp && typeof resp === 'object') {
      return resp as unknown as Record<string, unknown>
    }
    return null
  }, [])

  const handleGetInsights = useCallback(async () => {
    if (sampleData) return
    setIsLoadingInsight(true)
    setActiveAgentId(AGENT_IDS.insight)

    const allEntries = Object.entries(domainEntries)
      .map(([domain, entries]) => {
        if (!Array.isArray(entries) || entries.length === 0) return `${domain}: No entries yet`
        return `${domain}:\n${entries.map(e => `- ${e?.content ?? ''}`).join('\n')}`
      })
      .join('\n\n')

    const hasAnyEntries = Object.values(domainEntries).some(arr => Array.isArray(arr) && arr.length > 0)
    const message = hasAnyEntries
      ? `Here is my life data across domains:\n\n${allEntries}\n\nPlease analyze all domains and provide holistic life insights with scores, patterns, and recommendations.`
      : "I'm just starting to track my life. Please provide initial baseline scores and recommendations for someone beginning their life tracking journey."

    try {
      const result = await callAIAgent(message, AGENT_IDS.insight)
      const data = parseAgentResponse(result)
      if (data) {
        const ds = data?.domain_scores as Record<string, number> | undefined
        const os = data?.orb_state as Record<string, unknown> | undefined
        const insight: InsightData = {
          overall_score: typeof data?.overall_score === 'number' ? data.overall_score : 50,
          domain_scores: {
            health: typeof ds?.health === 'number' ? ds.health : 50,
            finance: typeof ds?.finance === 'number' ? ds.finance : 50,
            career: typeof ds?.career === 'number' ? ds.career : 50,
            relationships: typeof ds?.relationships === 'number' ? ds.relationships : 50,
            habits: typeof ds?.habits === 'number' ? ds.habits : 50,
            goals: typeof ds?.goals === 'number' ? ds.goals : 50,
          },
          patterns: Array.isArray(data?.patterns) ? (data.patterns as string[]) : [],
          recommendations: Array.isArray(data?.recommendations) ? (data.recommendations as Recommendation[]) : [],
          orb_state: {
            glow_intensity: typeof os?.glow_intensity === 'number' ? os.glow_intensity : 0.5,
            color: typeof os?.color === 'string' ? os.color : '#BF9B30',
            pulse_speed: (os?.pulse_speed === 'slow' || os?.pulse_speed === 'medium' || os?.pulse_speed === 'fast') ? os.pulse_speed : 'medium',
          },
          summary: typeof data?.summary === 'string' ? data.summary : '',
        }
        setInsightData(insight)
        setInsightExpanded(true)
        setStatusMessage('Insights generated successfully')
      } else {
        setStatusMessage('Could not parse insight response. Please try again.')
      }
    } catch {
      setStatusMessage('Failed to get insights. Please try again.')
    }
    setIsLoadingInsight(false)
    setActiveAgentId(null)
  }, [domainEntries, parseAgentResponse, sampleData])

  const handleLogEntry = useCallback(async (domain: DomainKey) => {
    if (sampleData || !entryInput.trim()) return
    setIsLoadingTracker(true)
    setActiveAgentId(AGENT_IDS.tracker)

    const message = `[Domain: ${domain}] ${entryInput.trim()}`

    try {
      const result = await callAIAgent(message, AGENT_IDS.tracker)
      const data = parseAgentResponse(result)
      if (data) {
        const entryObj = data?.entry as Record<string, unknown> | undefined
        const newEntry: DomainEntry = {
          domain: typeof entryObj?.domain === 'string' ? entryObj.domain : domain,
          content: typeof entryObj?.content === 'string' ? entryObj.content : entryInput.trim(),
          tags: Array.isArray(entryObj?.tags) ? (entryObj.tags as string[]) : [],
          metrics: Array.isArray(entryObj?.metrics) ? (entryObj.metrics as EntryMetric[]) : [],
          sentiment: (entryObj?.sentiment === 'positive' || entryObj?.sentiment === 'neutral' || entryObj?.sentiment === 'negative') ? entryObj.sentiment : 'neutral',
          timestamp: new Date().toISOString(),
          summary: typeof data?.summary === 'string' ? data.summary : '',
          suggestions: Array.isArray(data?.suggestions) ? (data.suggestions as string[]) : [],
        }
        setDomainEntries(prev => ({
          ...prev,
          [domain]: [newEntry, ...(Array.isArray(prev[domain]) ? prev[domain] : [])],
        }))
        setEntryInput('')
        setShowEntryForm(false)
        setStatusMessage('Entry logged successfully')
      } else {
        setStatusMessage('Could not parse tracker response. Please try again.')
      }
    } catch {
      setStatusMessage('Failed to log entry. Please try again.')
    }
    setIsLoadingTracker(false)
    setActiveAgentId(null)
  }, [entryInput, parseAgentResponse, sampleData])

  const handleSendChat = useCallback(async (messageText?: string) => {
    const msg = (messageText || chatInput).trim()
    if (sampleData || !msg) return

    const userMessage: ChatMessage = { role: 'user', content: msg, timestamp: new Date().toISOString() }
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsLoadingChat(true)
    setActiveAgentId(AGENT_IDS.coach)

    try {
      const result = await callAIAgent(msg, AGENT_IDS.coach)
      const data = parseAgentResponse(result)
      if (data) {
        const aiMessage: ChatMessage = {
          role: 'assistant',
          content: typeof data?.message === 'string' ? data.message : 'I received your message but could not generate a detailed response.',
          action_items: Array.isArray(data?.action_items) ? (data.action_items as ActionItem[]) : [],
          suggested_followups: Array.isArray(data?.suggested_followups) ? (data.suggested_followups as string[]) : [],
          timestamp: new Date().toISOString(),
        }
        setChatMessages(prev => [...prev, aiMessage])
      } else {
        const fallback: ChatMessage = {
          role: 'assistant',
          content: 'I apologize, but I was unable to process your request. Please try again.',
          timestamp: new Date().toISOString(),
        }
        setChatMessages(prev => [...prev, fallback])
      }
    } catch {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: 'Connection error. Please try again.',
        timestamp: new Date().toISOString(),
      }
      setChatMessages(prev => [...prev, errorMsg])
    }
    setIsLoadingChat(false)
    setActiveAgentId(null)
  }, [chatInput, parseAgentResponse, sampleData])

  // ─── HELPERS ─────────────────────────────────────────────────────────────────

  const getDomainScore = (domain: DomainKey): number => {
    return currentInsight?.domain_scores?.[domain] ?? 50
  }

  const getDomainEntries = (domain: DomainKey): DomainEntry[] => {
    const entries = currentEntries[domain]
    return Array.isArray(entries) ? entries : []
  }

  const getEntryCount = (domain: DomainKey): number => {
    return getDomainEntries(domain).length
  }

  const getLastEntryDate = (domain: DomainKey): string => {
    const entries = getDomainEntries(domain)
    if (entries.length === 0) return 'No entries yet'
    const ts = entries[0]?.timestamp
    if (!ts) return 'No date'
    try {
      return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return 'Unknown'
    }
  }

  const formatTime = (ts: string): string => {
    if (!ts) return ''
    try {
      return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  const formatDate = (ts: string): string => {
    if (!ts) return ''
    try {
      return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return ''
    }
  }

  // ─── NAVIGATION ──────────────────────────────────────────────────────────────

  const navItems: { key: ActiveSection; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <RiDashboardLine size={18} /> },
    ...DOMAINS,
  ]

  // ─── DASHBOARD SECTION ───────────────────────────────────────────────────────

  function DashboardView() {
    return (
      <div className="space-y-8 md:space-y-12">
        {/* Hero with Orb */}
        <div className="flex flex-col items-center">
          <LifeOrb orbState={currentInsight?.orb_state} score={currentInsight?.overall_score} isLoading={isLoadingInsight} />

          {/* Get Insights Button */}
          <button onClick={handleGetInsights} disabled={isLoadingInsight || sampleData} className="mt-4 px-8 py-3 bg-primary text-primary-foreground text-sm font-light tracking-widest uppercase transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3">
            {isLoadingInsight ? (
              <>
                <div className="w-4 h-4 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                <span>Analyzing Life Data</span>
              </>
            ) : (
              <>
                <RiSparklingLine size={16} />
                <span>Get Life Insights</span>
              </>
            )}
          </button>
        </div>

        {/* Domain Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {DOMAINS.map(({ key, label, icon }) => {
            const score = getDomainScore(key)
            const entryCount = getEntryCount(key)
            const lastDate = getLastEntryDate(key)

            return (
              <button key={key} onClick={() => { setActiveSection(key); setSidebarOpen(false) }} className="group bg-card border border-border p-6 text-left transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-primary/70 group-hover:text-primary transition-colors">{icon}</span>
                    <h3 className="font-serif text-sm tracking-wider uppercase text-foreground">{label}</h3>
                  </div>
                  <ScoreRing score={score} size={48} strokeWidth={3} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <RiTimeLine size={12} />
                    {lastDate}
                  </span>
                  <span>{entryCount} {entryCount === 1 ? 'entry' : 'entries'}</span>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary/70 transition-colors">
                  <span className="tracking-wider">View Details</span>
                  <RiArrowRightLine size={12} />
                </div>
              </button>
            )
          })}
        </div>

        {/* Insights Panel */}
        {currentInsight && (
          <div className="bg-card border border-border" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
            <button onClick={() => setInsightExpanded(!insightExpanded)} className="w-full flex items-center justify-between p-6 text-left">
              <div className="flex items-center gap-3">
                <RiLightbulbLine size={18} className="text-primary" />
                <h3 className="font-serif text-sm tracking-wider uppercase">Life Insights</h3>
              </div>
              {insightExpanded ? <RiArrowUpSLine size={20} className="text-muted-foreground" /> : <RiArrowDownSLine size={20} className="text-muted-foreground" />}
            </button>

            {insightExpanded && (
              <div className="px-6 pb-6 space-y-6" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                {/* Summary */}
                {currentInsight.summary && (
                  <div className="border-l-2 border-primary/30 pl-4">
                    {renderMarkdown(currentInsight.summary)}
                  </div>
                )}

                {/* Domain Scores Bar Chart */}
                <div className="space-y-3">
                  <h4 className="text-xs tracking-widest uppercase text-muted-foreground">Domain Breakdown</h4>
                  {DOMAINS.map(({ key, label }) => {
                    const domScore = currentInsight?.domain_scores?.[key] ?? 50
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-28 tracking-wider">{label}</span>
                        <div className="flex-1 h-2 bg-muted overflow-hidden">
                          <div className="h-full bg-primary/70 transition-all duration-1000 ease-out" style={{ width: `${domScore}%` }} />
                        </div>
                        <span className="text-xs text-foreground w-8 text-right font-light">{domScore}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Patterns */}
                {Array.isArray(currentInsight.patterns) && currentInsight.patterns.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs tracking-widest uppercase text-muted-foreground">Patterns Identified</h4>
                    <ul className="space-y-2">
                      {currentInsight.patterns.map((pattern, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                          <RiSearchLine size={14} className="text-primary/50 mt-0.5 flex-shrink-0" />
                          <span>{typeof pattern === 'string' ? pattern : ''}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {Array.isArray(currentInsight.recommendations) && currentInsight.recommendations.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs tracking-widest uppercase text-muted-foreground">Recommendations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {currentInsight.recommendations.slice(0, 3).map((rec, i) => (
                        <div key={i} className="bg-secondary/50 border border-border p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs tracking-widest uppercase text-primary/70">{rec?.domain ?? ''}</span>
                            <span className={`text-xs px-2 py-0.5 tracking-wider uppercase ${rec?.priority === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-primary/10 text-primary'}`}>{rec?.priority ?? ''}</span>
                          </div>
                          <h5 className="text-sm font-medium text-foreground">{rec?.title ?? ''}</h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">{rec?.description ?? ''}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ─── DOMAIN DETAIL SECTION ─────────────────────────────────────────────────

  function DomainDetailView({ domain }: { domain: DomainKey }) {
    const domainConfig = DOMAINS.find(d => d.key === domain)
    const entries = getDomainEntries(domain)
    const score = getDomainScore(domain)
    const entryCount = getEntryCount(domain)

    return (
      <div className="space-y-6">
        {/* Domain Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-primary">{domainConfig?.icon}</span>
            <h2 className="font-serif text-lg tracking-wider uppercase">{domainConfig?.label ?? domain}</h2>
          </div>
          <button onClick={() => setShowEntryForm(!showEntryForm)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs tracking-widest uppercase transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
            <RiAddLine size={14} />
            <span>Log Entry</span>
          </button>
        </div>

        {/* Entry Form */}
        {showEntryForm && (
          <div className="bg-card border border-border p-6 space-y-4" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <h4 className="text-xs tracking-widest uppercase text-muted-foreground">New Entry</h4>
            <textarea value={entryInput} onChange={(e) => setEntryInput(e.target.value)} placeholder={`What would you like to log in ${domainConfig?.label ?? domain}?`} className="w-full bg-secondary/50 border border-border p-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none leading-relaxed" rows={4} disabled={sampleData} />
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => { setShowEntryForm(false); setEntryInput('') }} className="px-4 py-2 text-xs text-muted-foreground tracking-wider uppercase hover:text-foreground transition-colors">Cancel</button>
              <button onClick={() => handleLogEntry(domain)} disabled={isLoadingTracker || !entryInput.trim() || sampleData} className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground text-xs tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                {isLoadingTracker ? (
                  <>
                    <div className="w-3 h-3 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Logging</span>
                  </>
                ) : (
                  <span>Save Entry</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Timeline - Left (3/5) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs tracking-widest uppercase text-muted-foreground">Entry Timeline</h4>
            {entries.length === 0 ? (
              <div className="bg-card border border-border p-8 text-center">
                <RiBarChartLine size={32} className="text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No entries yet for {domainConfig?.label ?? domain}.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Click &quot;Log Entry&quot; to start tracking.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry, i) => (
                  <div key={i} className="bg-card border border-border p-5 space-y-3" style={{ animation: `fadeInUp 0.3s ease-out ${i * 0.05}s both` }}>
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <SentimentDot sentiment={entry?.sentiment ?? 'neutral'} />
                        <span className="text-xs text-muted-foreground tracking-wider">{formatDate(entry?.timestamp ?? '')}</span>
                        <span className="text-xs text-muted-foreground/50">{formatTime(entry?.timestamp ?? '')}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-sm text-foreground/90 leading-relaxed">{entry?.content ?? ''}</p>

                    {/* Tags */}
                    {Array.isArray(entry?.tags) && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {entry.tags.map((tag, j) => (
                          <span key={j} className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground tracking-wider">{typeof tag === 'string' ? tag : ''}</span>
                        ))}
                      </div>
                    )}

                    {/* Metrics */}
                    {Array.isArray(entry?.metrics) && entry.metrics.length > 0 && (
                      <div className="flex flex-wrap gap-4 pt-1">
                        {entry.metrics.map((metric, j) => (
                          <div key={j} className="text-xs">
                            <span className="text-muted-foreground tracking-wider">{metric?.name ?? ''}: </span>
                            <span className="text-primary font-medium">{metric?.value ?? ''}</span>
                            <span className="text-muted-foreground/60"> {metric?.unit ?? ''}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Summary */}
                    {entry?.summary && (
                      <div className="border-l-2 border-primary/20 pl-3 mt-2">
                        <p className="text-xs text-muted-foreground italic leading-relaxed">{entry.summary}</p>
                      </div>
                    )}

                    {/* Suggestions */}
                    {Array.isArray(entry?.suggestions) && entry.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {entry.suggestions.map((sug, j) => (
                          <span key={j} className="flex items-center gap-1 text-xs text-primary/70">
                            <RiLightbulbLine size={10} />
                            {typeof sug === 'string' ? sug : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats Panel - Right (2/5) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs tracking-widest uppercase text-muted-foreground">Domain Stats</h4>

            {/* Score Card */}
            <div className="bg-card border border-border p-6 flex flex-col items-center gap-4">
              <ScoreRing score={score} size={120} strokeWidth={5} />
              <div className="text-center">
                <p className="font-serif text-2xl tracking-wider text-foreground">{score}</p>
                <p className="text-xs text-muted-foreground tracking-widest uppercase mt-1">{domainConfig?.label ?? domain} Score</p>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-card border border-border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground tracking-wider">Total Entries</span>
                <span className="text-sm text-foreground font-light">{entryCount}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground tracking-wider">Latest Entry</span>
                <span className="text-sm text-foreground font-light">{getLastEntryDate(domain)}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground tracking-wider">Trend</span>
                <div className="flex items-center gap-1">
                  {score >= 60 ? (
                    <RiArrowUpSLine size={16} className="text-green-400" />
                  ) : score >= 40 ? (
                    <span className="text-xs text-muted-foreground">--</span>
                  ) : (
                    <RiArrowDownSLine size={16} className="text-red-400" />
                  )}
                  <span className="text-xs text-muted-foreground">{score >= 60 ? 'Improving' : score >= 40 ? 'Stable' : 'Needs attention'}</span>
                </div>
              </div>
            </div>

            {/* Sentiment Breakdown */}
            {entries.length > 0 && (
              <div className="bg-card border border-border p-5 space-y-3">
                <h5 className="text-xs tracking-widest uppercase text-muted-foreground">Sentiment</h5>
                {(['positive', 'neutral', 'negative'] as const).map(sent => {
                  const count = entries.filter(e => e?.sentiment === sent).length
                  const pct = entries.length > 0 ? Math.round((count / entries.length) * 100) : 0
                  return (
                    <div key={sent} className="flex items-center gap-3">
                      <SentimentDot sentiment={sent} />
                      <span className="text-xs text-muted-foreground w-16 capitalize tracking-wider">{sent}</span>
                      <div className="flex-1 h-1.5 bg-muted overflow-hidden">
                        <div className={`h-full transition-all duration-700 ${sent === 'positive' ? 'bg-green-500/60' : sent === 'negative' ? 'bg-red-400/60' : 'bg-yellow-500/60'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── CHAT DRAWER ─────────────────────────────────────────────────────────────

  const suggestedPrompts = [
    'Create a weekly plan for me',
    'How can I improve my relationships?',
    'What should I focus on today?',
  ]

  // ─── RENDER ──────────────────────────────────────────────────────────────────

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 flex-shrink-0 flex flex-col border-r border-border transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ backgroundColor: 'hsl(30, 7%, 7%)' }}>
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h1 className="font-serif text-xl tracking-widest text-foreground">
                <span className="text-primary">Life</span>OS
              </h1>
              <button className="md:hidden p-1 text-muted-foreground" onClick={() => setSidebarOpen(false)}>
                <RiCloseLine size={20} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground tracking-wider mt-1">Personal Operating System</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {navItems.map(({ key, label, icon }) => (
              <button key={key} onClick={() => { setActiveSection(key); setSidebarOpen(false); setShowEntryForm(false) }} className={`w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wider transition-all duration-200 ${activeSection === key ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30 border-l-2 border-transparent'}`}>
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Agent Status */}
          <div className="p-4 border-t border-border space-y-2">
            <p className="text-xs tracking-widest uppercase text-muted-foreground/60 mb-2">Agents</p>
            {[
              { id: AGENT_IDS.insight, name: 'Insight', desc: 'Life analysis' },
              { id: AGENT_IDS.coach, name: 'Coach', desc: 'Chat guidance' },
              { id: AGENT_IDS.tracker, name: 'Tracker', desc: 'Domain logging' },
            ].map(agent => (
              <div key={agent.id} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${activeAgentId === agent.id ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground/30'}`} />
                <span className="text-xs text-muted-foreground">{agent.name}</span>
                <span className="text-xs text-muted-foreground/40 ml-auto">{agent.desc}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Top Bar */}
          <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border px-4 md:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="md:hidden p-1 text-muted-foreground" onClick={() => setSidebarOpen(true)}>
                <RiMenuLine size={20} />
              </button>
              <h2 className="font-serif text-sm tracking-widest uppercase text-foreground">
                {activeSection === 'dashboard' ? 'Command Center' : (DOMAINS.find(d => d.key === activeSection)?.label ?? activeSection)}
              </h2>
            </div>

            {/* Sample Data Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground tracking-wider hidden sm:inline">Sample Data</span>
              <button onClick={() => setSampleData(!sampleData)} className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${sampleData ? 'bg-primary' : 'bg-muted'}`} aria-label="Toggle sample data">
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-200 ${sampleData ? 'translate-x-5' : 'translate-x-0'}`} style={{ backgroundColor: sampleData ? 'hsl(30, 8%, 6%)' : 'hsl(30, 8%, 55%)' }} />
              </button>
            </div>
          </header>

          {/* Status Message */}
          {statusMessage && (
            <div className="mx-4 md:mx-8 mt-3 px-4 py-2 bg-primary/10 border border-primary/20 text-xs text-primary tracking-wider" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
              {statusMessage}
            </div>
          )}

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {activeSection === 'dashboard' ? (
              <DashboardView />
            ) : (
              <DomainDetailView domain={activeSection} />
            )}
          </div>
        </main>

        {/* Chat FAB */}
        <button onClick={() => setChatOpen(true)} className="fixed bottom-24 right-6 z-30 w-12 h-12 bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 rounded-full" aria-label="Open Life Coach Chat">
          <RiChat3Line size={20} />
        </button>

        {/* Chat Drawer Overlay */}
        {chatOpen && (
          <div className="fixed inset-0 bg-black/40 z-40 md:bg-black/20" onClick={() => setChatOpen(false)} />
        )}

        {/* Chat Drawer */}
        <div className={`fixed top-0 right-0 h-full w-full md:w-[400px] bg-card border-l border-border z-50 flex flex-col transition-transform duration-300 ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Chat Header */}
          <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3">
              <RiChat3Line size={18} className="text-primary" />
              <h3 className="font-serif text-sm tracking-wider uppercase">Life Coach</h3>
            </div>
            <button onClick={() => setChatOpen(false)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              <RiCloseLine size={20} />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentChat.length === 0 && !isLoadingChat ? (
              <div className="flex flex-col items-center justify-center h-full space-y-6 px-4">
                <div className="text-center space-y-2">
                  <RiSparklingLine size={28} className="text-primary/40 mx-auto" />
                  <p className="text-sm text-muted-foreground leading-relaxed">Start a conversation with your AI life coach</p>
                </div>
                <div className="space-y-2 w-full">
                  {suggestedPrompts.map((prompt, i) => (
                    <button key={i} onClick={() => handleSendChat(prompt)} disabled={sampleData} className="w-full text-left p-3 bg-secondary/50 border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-200 disabled:opacity-50">
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {currentChat.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/50 border border-border'} p-4`}>
                      {msg.role === 'assistant' ? renderMarkdown(msg.content ?? '') : (
                        <p className="text-sm text-foreground leading-relaxed">{msg.content ?? ''}</p>
                      )}

                      {/* Action Items */}
                      {Array.isArray(msg?.action_items) && msg.action_items.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-border/50 mt-2">
                          <p className="text-xs tracking-widest uppercase text-muted-foreground">Action Items</p>
                          {msg.action_items.map((item, j) => (
                            <div key={j} className="flex items-start gap-2 text-xs">
                              <RiCalendarCheckLine size={12} className="text-primary mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="text-foreground/90">{item?.task ?? ''}</span>
                                {item?.timeframe && <span className="text-muted-foreground/60 ml-1">({item.timeframe})</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Suggested Followups */}
                      {Array.isArray(msg?.suggested_followups) && msg.suggested_followups.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {msg.suggested_followups.map((followup, j) => (
                            <button key={j} onClick={() => handleSendChat(typeof followup === 'string' ? followup : '')} disabled={sampleData} className="text-xs px-2.5 py-1 bg-primary/10 text-primary/80 border border-primary/20 hover:bg-primary/20 transition-colors disabled:opacity-50">
                              {typeof followup === 'string' ? followup : ''}
                            </button>
                          ))}
                        </div>
                      )}

                      <span className="text-xs text-muted-foreground/40 block mt-1">{formatTime(msg?.timestamp ?? '')}</span>
                    </div>
                  </div>
                ))}
                {isLoadingChat && (
                  <div className="flex justify-start">
                    <div className="bg-secondary/50 border border-border p-2">
                      <TypingIndicator />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat() } }} placeholder="Ask your life coach..." className="flex-1 bg-secondary/50 border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50" disabled={sampleData || isLoadingChat} />
              <button onClick={() => handleSendChat()} disabled={!chatInput.trim() || isLoadingChat || sampleData} className="p-2.5 bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-primary/20">
                <RiSendPlaneFill size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageErrorBoundary>
  )
}
