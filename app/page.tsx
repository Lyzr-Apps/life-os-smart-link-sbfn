'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import type { AIAgentResponse } from '@/lib/aiAgent'
import { RiDashboardLine, RiHeartPulseLine, RiMoneyDollarCircleLine, RiBriefcaseLine, RiUserHeartLine, RiCalendarCheckLine, RiFlagLine, RiChat3Line, RiSendPlaneFill, RiCloseLine, RiArrowUpSLine, RiArrowDownSLine, RiMenuLine, RiSparklingLine, RiLightbulbLine, RiArrowRightLine, RiTimeLine, RiAddLine, RiSearchLine, RiBarChartLine, RiDropLine, RiMoonLine, RiRunLine, RiRestaurantLine, RiPulseLine, RiWalletLine, RiLineChartLine, RiBankLine, RiPercentLine, RiTrophyLine, RiRocketLine, RiStarLine, RiTeamLine, RiEmotionLine, RiPhoneLine, RiGroupLine, RiCheckDoubleLine, RiFireLine, RiMedalLine, RiRefreshLine, RiDeleteBinLine, RiEditLine, RiEyeLine, RiArrowLeftLine, RiArrowRightSLine, RiInformationLine, RiCheckLine, RiAlarmLine, RiMindMap, RiShieldCheckLine, RiCopperCoinLine, RiPieChartLine, RiStockLine, RiHandHeartLine, RiCalendar2Line, RiAwardLine, RiBookLine, RiSeedlingLine, RiQuestionLine, RiMoreLine, RiGlobalLine, RiCompassLine, RiFilterLine, RiHashtag, RiFlashlightLine, RiThunderstormsLine, RiLeafLine, RiZzzLine } from 'react-icons/ri'

// ---- CONSTANTS ----

const AGENT_IDS = {
  insight: '699f59be790ead763ca87cd2',
  coach: '699f59be87c8da309e64d88e',
  tracker: '699f59be0a4cf39744b0dfff',
} as const

type DomainKey = 'health' | 'finance' | 'career' | 'relationships' | 'habits' | 'goals'
type ActiveSection = 'dashboard' | DomainKey
type DomainTab = 'overview' | 'log' | 'ask'

// ---- INTERFACES ----

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

// ---- DOMAIN CONFIG ----

const DOMAIN_COLORS: Record<DomainKey, { gradient: string; accent: string; glow: string; border: string }> = {
  health: { gradient: 'from-rose-900/30 via-red-900/20 to-transparent', accent: 'text-rose-400', glow: 'rgba(244,63,94,0.15)', border: 'border-rose-500/20' },
  finance: { gradient: 'from-emerald-900/30 via-green-900/20 to-transparent', accent: 'text-emerald-400', glow: 'rgba(52,211,153,0.15)', border: 'border-emerald-500/20' },
  career: { gradient: 'from-indigo-900/30 via-purple-900/20 to-transparent', accent: 'text-indigo-400', glow: 'rgba(129,140,248,0.15)', border: 'border-indigo-500/20' },
  relationships: { gradient: 'from-pink-900/30 via-rose-900/20 to-transparent', accent: 'text-pink-400', glow: 'rgba(244,114,182,0.15)', border: 'border-pink-500/20' },
  habits: { gradient: 'from-amber-900/30 via-orange-900/20 to-transparent', accent: 'text-amber-400', glow: 'rgba(251,191,36,0.15)', border: 'border-amber-500/20' },
  goals: { gradient: 'from-sky-900/30 via-cyan-900/20 to-transparent', accent: 'text-sky-400', glow: 'rgba(56,189,248,0.15)', border: 'border-sky-500/20' },
}

const DOMAINS: { key: DomainKey; label: string; icon: React.ReactNode; description: string }[] = [
  { key: 'health', label: 'Health', icon: <RiHeartPulseLine size={18} />, description: 'Body, Mind, Vitality' },
  { key: 'finance', label: 'Finance', icon: <RiMoneyDollarCircleLine size={18} />, description: 'Wealth, Budget, Growth' },
  { key: 'career', label: 'Career', icon: <RiBriefcaseLine size={18} />, description: 'Skills, Achievement, Impact' },
  { key: 'relationships', label: 'Relationships', icon: <RiUserHeartLine size={18} />, description: 'Connection, Love, Community' },
  { key: 'habits', label: 'Habits', icon: <RiCalendarCheckLine size={18} />, description: 'Consistency, Discipline' },
  { key: 'goals', label: 'Goals', icon: <RiFlagLine size={18} />, description: 'Vision, Milestones' },
]

const DOMAIN_QUICK_ACTIONS: Record<DomainKey, { label: string; prefix: string; icon: React.ReactNode }[]> = {
  health: [
    { label: 'Log Workout', prefix: 'Workout: ', icon: <RiRunLine size={14} /> },
    { label: 'Log Sleep', prefix: 'Sleep: ', icon: <RiMoonLine size={14} /> },
    { label: 'Log Nutrition', prefix: 'Nutrition: ', icon: <RiRestaurantLine size={14} /> },
    { label: 'Log Mood', prefix: 'Mood: ', icon: <RiEmotionLine size={14} /> },
  ],
  finance: [
    { label: 'Log Expense', prefix: 'Expense: ', icon: <RiWalletLine size={14} /> },
    { label: 'Log Income', prefix: 'Income: ', icon: <RiBankLine size={14} /> },
    { label: 'Log Investment', prefix: 'Investment: ', icon: <RiStockLine size={14} /> },
    { label: 'Budget Review', prefix: 'Budget review: ', icon: <RiPieChartLine size={14} /> },
  ],
  career: [
    { label: 'Log Achievement', prefix: 'Achievement: ', icon: <RiTrophyLine size={14} /> },
    { label: 'Log Learning', prefix: 'Learning: ', icon: <RiBookLine size={14} /> },
    { label: 'Log Networking', prefix: 'Networking: ', icon: <RiTeamLine size={14} /> },
    { label: 'Set Career Goal', prefix: 'Career goal: ', icon: <RiRocketLine size={14} /> },
  ],
  relationships: [
    { label: 'Log Interaction', prefix: 'Interaction: ', icon: <RiPhoneLine size={14} /> },
    { label: 'Quality Time', prefix: 'Quality time: ', icon: <RiHandHeartLine size={14} /> },
    { label: 'Schedule Check-in', prefix: 'Check-in: ', icon: <RiCalendar2Line size={14} /> },
    { label: 'Gratitude Note', prefix: 'Gratitude: ', icon: <RiLeafLine size={14} /> },
  ],
  habits: [
    { label: 'Complete Habit', prefix: 'Completed habit: ', icon: <RiCheckDoubleLine size={14} /> },
    { label: 'Add New Habit', prefix: 'New habit: ', icon: <RiAddLine size={14} /> },
    { label: 'Log Streak', prefix: 'Streak update: ', icon: <RiFireLine size={14} /> },
    { label: 'Habit Review', prefix: 'Habit review: ', icon: <RiEyeLine size={14} /> },
  ],
  goals: [
    { label: 'Set New Goal', prefix: 'New goal: ', icon: <RiFlagLine size={14} /> },
    { label: 'Log Progress', prefix: 'Progress update: ', icon: <RiLineChartLine size={14} /> },
    { label: 'Add Milestone', prefix: 'Milestone: ', icon: <RiAwardLine size={14} /> },
    { label: 'Review Goals', prefix: 'Goals review: ', icon: <RiEyeLine size={14} /> },
  ],
}

// ---- SAMPLE DATA ----

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
    { domain: 'health', content: 'Completed a 5K morning run. Felt energized. Heart rate averaged 145 bpm. Weather was perfect for running.', tags: ['exercise', 'running', 'cardio'], metrics: [{ name: 'Distance', value: '5', unit: 'km' }, { name: 'Heart Rate', value: '145', unit: 'bpm' }, { name: 'Duration', value: '28', unit: 'min' }], sentiment: 'positive', timestamp: '2025-02-24T07:30:00Z', summary: 'Good cardio session with strong pace.', suggestions: ['Consider adding interval training', 'Track recovery heart rate'] },
    { domain: 'health', content: 'Slept only 5 hours. Felt groggy most of the day. Screen time before bed was 2 hours.', tags: ['sleep', 'rest', 'recovery'], metrics: [{ name: 'Sleep Duration', value: '5', unit: 'hours' }, { name: 'Screen Time', value: '2', unit: 'hours' }], sentiment: 'negative', timestamp: '2025-02-23T22:00:00Z', summary: 'Poor sleep quality recorded.', suggestions: ['Try limiting screen time before bed', 'Consider melatonin supplement'] },
    { domain: 'health', content: 'Great yoga session followed by a healthy smoothie. Feeling centered and balanced.', tags: ['yoga', 'nutrition', 'mindfulness'], metrics: [{ name: 'Duration', value: '45', unit: 'min' }, { name: 'Calories', value: '320', unit: 'kcal' }], sentiment: 'positive', timestamp: '2025-02-22T08:15:00Z', summary: 'Balanced wellness activity.', suggestions: ['Maintain this routine'] },
    { domain: 'health', content: 'Drank 8 glasses of water today. Hydration goal met.', tags: ['hydration', 'water'], metrics: [{ name: 'Water', value: '8', unit: 'glasses' }], sentiment: 'positive', timestamp: '2025-02-21T20:00:00Z', summary: 'Hydration target achieved.', suggestions: [] },
  ],
  finance: [
    { domain: 'finance', content: 'Reviewed monthly budget. Overspent on dining out by $120. Need to cut back next month.', tags: ['budget', 'dining', 'review'], metrics: [{ name: 'Over Budget', value: '120', unit: 'USD' }, { name: 'Dining Spend', value: '480', unit: 'USD' }], sentiment: 'neutral', timestamp: '2025-02-22T18:00:00Z', summary: 'Budget review complete.', suggestions: ['Set weekly dining budget alerts', 'Consider meal prepping'] },
    { domain: 'finance', content: 'Invested $500 in index fund. Portfolio up 3.2% this month.', tags: ['investment', 'stocks', 'portfolio'], metrics: [{ name: 'Amount', value: '500', unit: 'USD' }, { name: 'Return', value: '3.2', unit: '%' }], sentiment: 'positive', timestamp: '2025-02-21T10:00:00Z', summary: 'Regular investment contribution.', suggestions: ['Consider increasing monthly contribution'] },
    { domain: 'finance', content: 'Received quarterly bonus of $2,000. Allocated 50% to savings, 30% to investments, 20% discretionary.', tags: ['income', 'bonus', 'savings'], metrics: [{ name: 'Bonus', value: '2000', unit: 'USD' }, { name: 'Savings Rate', value: '50', unit: '%' }], sentiment: 'positive', timestamp: '2025-02-20T15:30:00Z', summary: 'Smart bonus allocation.', suggestions: ['Great discipline on savings split'] },
  ],
  career: [
    { domain: 'career', content: 'Completed the leadership workshop. Received positive feedback from the team lead on presentation skills.', tags: ['workshop', 'leadership', 'growth'], metrics: [{ name: 'Workshop Hours', value: '4', unit: 'hours' }], sentiment: 'positive', timestamp: '2025-02-21T14:00:00Z', summary: 'Professional development logged.', suggestions: ['Apply learnings in next team meeting'] },
    { domain: 'career', content: 'Led the sprint planning for Q2 product roadmap. Team alignment improved significantly.', tags: ['management', 'planning', 'roadmap'], metrics: [{ name: 'Meeting Duration', value: '2', unit: 'hours' }, { name: 'Stories Planned', value: '34', unit: 'items' }], sentiment: 'positive', timestamp: '2025-02-20T11:00:00Z', summary: 'Strong leadership in planning.', suggestions: ['Document decisions for reference'] },
    { domain: 'career', content: 'Completed AWS Solutions Architect certification study module 4. Halfway through the course.', tags: ['certification', 'aws', 'learning'], metrics: [{ name: 'Progress', value: '50', unit: '%' }, { name: 'Study Hours', value: '3', unit: 'hours' }], sentiment: 'positive', timestamp: '2025-02-19T21:00:00Z', summary: 'Certification progress on track.', suggestions: ['Schedule practice exam'] },
  ],
  relationships: [
    { domain: 'relationships', content: 'Had a wonderful dinner with family. Deep conversations about shared memories and future plans.', tags: ['family', 'dinner', 'quality-time'], metrics: [{ name: 'Duration', value: '3', unit: 'hours' }], sentiment: 'positive', timestamp: '2025-02-23T19:00:00Z', summary: 'Meaningful family connection.', suggestions: ['Schedule monthly family dinners'] },
    { domain: 'relationships', content: 'Called college friend Mark. Caught up on life and planned a hiking trip for March.', tags: ['friendship', 'phone-call', 'planning'], metrics: [{ name: 'Call Duration', value: '45', unit: 'min' }], sentiment: 'positive', timestamp: '2025-02-21T17:30:00Z', summary: 'Friendship maintenance.', suggestions: ['Follow up on hiking plans'] },
  ],
  habits: [
    { domain: 'habits', content: 'Maintained 7-day meditation streak. 15 minutes each morning. Noticing improved focus throughout the day.', tags: ['meditation', 'mindfulness', 'streak'], metrics: [{ name: 'Streak', value: '7', unit: 'days' }, { name: 'Duration', value: '15', unit: 'min' }], sentiment: 'positive', timestamp: '2025-02-24T06:15:00Z', summary: 'Meditation streak continues.', suggestions: ['Try extending to 20 minutes'] },
    { domain: 'habits', content: 'Journaled for 20 minutes before bed. Reflected on gratitude and goals.', tags: ['journaling', 'gratitude', 'reflection'], metrics: [{ name: 'Duration', value: '20', unit: 'min' }], sentiment: 'positive', timestamp: '2025-02-23T22:30:00Z', summary: 'Consistent journaling practice.', suggestions: ['Add weekly review to journal routine'] },
    { domain: 'habits', content: 'Read 30 pages of Atomic Habits. Applied the 2-minute rule to flossing habit.', tags: ['reading', 'learning', 'habits'], metrics: [{ name: 'Pages', value: '30', unit: 'pages' }], sentiment: 'positive', timestamp: '2025-02-22T21:00:00Z', summary: 'Reading habit maintained.', suggestions: ['Set daily reading goal of 20 pages'] },
    { domain: 'habits', content: 'Missed morning workout for the second time this week. Need to adjust alarm.', tags: ['exercise', 'morning-routine', 'missed'], metrics: [{ name: 'Missed', value: '2', unit: 'times' }], sentiment: 'negative', timestamp: '2025-02-20T09:00:00Z', summary: 'Workout consistency dip.', suggestions: ['Set two alarms', 'Prepare workout clothes the night before'] },
  ],
  goals: [
    { domain: 'goals', content: 'Goal: Run a half marathon by June. Currently at 5K distance. Training plan started.', tags: ['fitness', 'running', 'milestone'], metrics: [{ name: 'Target Distance', value: '21.1', unit: 'km' }, { name: 'Current', value: '5', unit: 'km' }, { name: 'Progress', value: '24', unit: '%' }], sentiment: 'positive', timestamp: '2025-02-24T08:00:00Z', summary: 'Half marathon training initiated.', suggestions: ['Increase weekly mileage by 10%'] },
    { domain: 'goals', content: 'Goal: Save $10,000 emergency fund by December. Currently at $4,200.', tags: ['finance', 'savings', 'emergency-fund'], metrics: [{ name: 'Target', value: '10000', unit: 'USD' }, { name: 'Current', value: '4200', unit: 'USD' }, { name: 'Progress', value: '42', unit: '%' }], sentiment: 'positive', timestamp: '2025-02-22T12:00:00Z', summary: 'Savings goal on track.', suggestions: ['Automate monthly transfers'] },
    { domain: 'goals', content: 'Goal: Read 24 books this year. Currently at 4 books completed.', tags: ['learning', 'reading', 'personal-growth'], metrics: [{ name: 'Target', value: '24', unit: 'books' }, { name: 'Current', value: '4', unit: 'books' }, { name: 'Progress', value: '17', unit: '%' }], sentiment: 'neutral', timestamp: '2025-02-18T14:00:00Z', summary: 'Reading goal needs more consistency.', suggestions: ['Schedule 30 minutes of reading daily', 'Try audiobooks during commute'] },
  ],
}

const SAMPLE_CHAT: ChatMessage[] = [
  { role: 'user', content: 'What should I focus on this week?', timestamp: '2025-02-24T09:00:00Z' },
  { role: 'assistant', content: 'Based on your recent activity, I recommend focusing on three key areas this week:\n\n**1. Sleep Optimization** -- Your recent sleep data shows only 5 hours. Prioritize getting 7-8 hours by setting a consistent bedtime.\n\n**2. Financial Tracking** -- You overspent on dining last month. Start logging daily expenses to build awareness.\n\n**3. Continue Your Streaks** -- Your meditation and running habits are strong. Maintain momentum by keeping your streaks alive.', action_items: [{ task: 'Set a 10pm bedtime alarm', domain: 'health', timeframe: 'This week' }, { task: 'Log expenses daily in finance tracker', domain: 'finance', timeframe: 'Ongoing' }, { task: 'Complete at least 3 runs this week', domain: 'health', timeframe: 'This week' }], suggested_followups: ['How can I improve my sleep quality?', 'Create a weekly meal prep budget', 'Suggest a morning routine'], timestamp: '2025-02-24T09:00:05Z' },
]

// ---- MARKDOWN RENDERER ----

function formatInline(text: string): React.ReactNode {
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
        if (line.startsWith('### ')) return <h4 key={i} className="font-serif font-medium text-sm mt-3 mb-1 text-foreground">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-serif font-medium text-base mt-3 mb-1 text-foreground">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-serif font-medium text-lg mt-4 mb-2 text-foreground">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm text-muted-foreground leading-relaxed">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm text-muted-foreground leading-relaxed">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{formatInline(line)}</p>
      })}
    </div>
  )
}

// ---- SCORE RING ----

function ScoreRing({ score, size = 80, strokeWidth = 4, colorOverride }: { score: number; size?: number; strokeWidth?: number; colorOverride?: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const safeScore = Math.min(Math.max(score, 0), 100)
  const offset = circumference - (safeScore / 100) * circumference
  const getColor = (s: number) => {
    if (colorOverride) return colorOverride
    if (s >= 75) return 'hsl(40, 50%, 55%)'
    if (s >= 50) return 'hsl(30, 40%, 50%)'
    return 'hsl(0, 40%, 50%)'
  }
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(30, 5%, 18%)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={getColor(safeScore)} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="square" className="transition-all duration-1000 ease-out" />
      </svg>
      <span className="absolute text-sm font-light tracking-wider" style={{ color: getColor(safeScore) }}>{safeScore}</span>
    </div>
  )
}

// ---- LIFE ORB ----

function LifeOrb({ orbState, score, isLoading }: { orbState?: OrbState; score?: number; isLoading: boolean }) {
  const color = orbState?.color || '#BF9B30'
  const intensity = orbState?.glow_intensity ?? 0.5
  const pulseSpeed = orbState?.pulse_speed === 'fast' ? '1.5s' : orbState?.pulse_speed === 'slow' ? '4s' : '2.5s'
  const ha = (hex: string, alpha: number): string => {
    const a = Math.round(alpha * 255).toString(16).padStart(2, '0')
    return hex + a
  }
  return (
    <div className="relative flex flex-col items-center justify-center py-8 md:py-12">
      <div className="absolute w-72 h-72 md:w-80 md:h-80 rounded-full opacity-10" style={{ background: `radial-gradient(circle, ${ha(color, 0.3)} 0%, transparent 70%)`, animation: `breathe 6s ease-in-out infinite` }} />
      <div className="absolute w-60 h-60 md:w-72 md:h-72 rounded-full opacity-15" style={{ background: `radial-gradient(circle, ${ha(color, 0.2)} 0%, transparent 60%)`, animation: `orbPulse ${pulseSpeed} ease-in-out infinite` }} />
      <div className="absolute w-52 h-52 md:w-64 md:h-64 rounded-full border border-primary/10" style={{ animation: 'orbRotateReverse 30s linear infinite' }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 w-1.5 h-1.5 rounded-full bg-primary/30" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-0.5 w-1 h-1 rounded-full bg-primary/20" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-0.5 w-1 h-1 rounded-full bg-primary/25" />
      </div>
      <div className="absolute w-44 h-44 md:w-56 md:h-56 rounded-full border border-primary/20" style={{ animation: 'orbRotate 20s linear infinite' }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 rounded-full bg-primary/60" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-1.5 h-1.5 rounded-full bg-primary/40" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-1.5 h-1.5 rounded-full bg-primary/30" />
      </div>
      <div className="relative w-36 h-36 md:w-48 md:h-48 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-500 hover:scale-105" style={{ background: `radial-gradient(circle at 35% 35%, ${ha(color, 0.6)}, ${ha(color, 0.35)}, ${ha(color, 0.15)}, hsl(30, 8%, 10%))`, boxShadow: `0 0 ${60 * intensity}px ${ha(color, intensity * 0.5)}, 0 0 ${120 * intensity}px ${ha(color, intensity * 0.2)}, inset 0 0 30px ${ha(color, 0.1)}`, animation: `orbPulse ${pulseSpeed} ease-in-out infinite, orbGlow ${pulseSpeed} ease-in-out infinite` }}>
        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            <span className="text-xs font-light tracking-widest text-primary-foreground/70 uppercase">Analyzing</span>
          </div>
        ) : score !== undefined && score > 0 ? (
          <div className="flex flex-col items-center">
            <span className="text-4xl md:text-5xl font-serif font-light tracking-wider text-primary-foreground/90" style={{ animation: 'numberCount 0.6s ease-out' }}>{score}</span>
            <span className="text-xs font-light tracking-widest text-primary-foreground/60 uppercase mt-1">Life Score</span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center px-4">
            <RiCompassLine size={28} className="text-primary-foreground/60 mb-2" />
            <span className="text-xs font-light tracking-widest text-primary-foreground/50 uppercase">Begin Journey</span>
          </div>
        )}
      </div>
      <div className="absolute w-2 h-2 rounded-full bg-primary/30" style={{ top: '10%', left: '18%', animation: 'float 3s ease-in-out infinite' }} />
      <div className="absolute w-1.5 h-1.5 rounded-full bg-primary/20" style={{ top: '20%', right: '20%', animation: 'float 4s ease-in-out infinite 1s' }} />
      <div className="absolute w-1 h-1 rounded-full bg-primary/25" style={{ bottom: '18%', left: '22%', animation: 'float 3.5s ease-in-out infinite 0.5s' }} />
      <div className="absolute w-1.5 h-1.5 rounded-full bg-primary/15" style={{ bottom: '22%', right: '16%', animation: 'float 4.5s ease-in-out infinite 1.5s' }} />
      <div className="absolute w-1 h-1 rounded-full bg-primary/20" style={{ top: '40%', left: '10%', animation: 'floatX 5s ease-in-out infinite 0.8s' }} />
      <div className="absolute w-1.5 h-1.5 rounded-full bg-primary/10" style={{ top: '35%', right: '12%', animation: 'floatX 4s ease-in-out infinite 2s' }} />
      <div className="absolute w-0.5 h-0.5 rounded-full bg-primary/30" style={{ bottom: '35%', left: '15%', animation: 'float 6s ease-in-out infinite 1.2s' }} />
      <div className="absolute w-0.5 h-0.5 rounded-full bg-primary/25" style={{ top: '15%', right: '30%', animation: 'float 5s ease-in-out infinite 0.3s' }} />
    </div>
  )
}

// ---- TYPING INDICATOR ----

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 0.2, 0.4].map((d, i) => (
        <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground" style={{ animation: `typingDot 1.4s infinite ease-in-out ${d}s` }} />
      ))}
    </div>
  )
}

// ---- SENTIMENT DOT ----

function SentimentDot({ sentiment }: { sentiment: string }) {
  const c = sentiment === 'positive' ? 'bg-green-500' : sentiment === 'negative' ? 'bg-red-400' : 'bg-yellow-500'
  return <div className={`w-2 h-2 rounded-full ${c} flex-shrink-0`} />
}

// ---- DOMAIN HEADER GRAPHICS ----

function HealthHeaderGraphic() {
  return (
    <div className="relative h-40 overflow-hidden bg-gradient-to-r from-rose-900/25 via-red-900/15 to-transparent rounded-none border border-border mb-6">
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" viewBox="0 0 600 100" preserveAspectRatio="none">
          <polyline fill="none" stroke="hsl(0, 65%, 55%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            points="0,50 30,50 45,50 55,20 65,80 75,35 85,55 100,50 130,50 145,50 155,18 165,82 175,33 185,57 200,50 230,50 245,50 255,22 265,78 275,37 285,53 300,50 330,50 345,50 355,15 365,85 375,30 385,58 400,50 430,50 445,50 455,20 465,80 475,35 485,55 500,50 530,50 545,50 555,18 565,82 575,33 585,57 600,50"
            strokeDasharray="1200" strokeDashoffset="1200"
            style={{ animation: 'ecgTrace 4s linear infinite' }} />
        </svg>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-rose-500/5" style={{ animation: 'breathe 4s ease-in-out infinite' }} />
      <div className="absolute top-5 right-8">
        <RiHeartPulseLine size={52} className="text-rose-500/15" style={{ animation: 'heartbeat 1.5s ease-in-out infinite' }} />
      </div>
      <div className="absolute top-8 right-28 w-2 h-2 rounded-full bg-rose-400/20" style={{ animation: 'float 3s ease-in-out infinite' }} />
      <div className="absolute top-16 right-20 w-1.5 h-1.5 rounded-full bg-rose-300/15" style={{ animation: 'float 4s ease-in-out infinite 1s' }} />
      <div className="absolute top-12 right-36 w-1 h-1 rounded-full bg-red-400/20" style={{ animation: 'float 3.5s ease-in-out infinite 0.5s' }} />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-rose-500/10 via-transparent to-transparent" />
      <div className="relative z-10 p-6 flex items-end h-full">
        <div>
          <h2 className="font-serif text-2xl tracking-wider text-foreground">Health</h2>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mt-1">Body, Mind, Vitality</p>
        </div>
      </div>
    </div>
  )
}

function FinanceHeaderGraphic() {
  return (
    <div className="relative h-40 overflow-hidden bg-gradient-to-r from-emerald-900/25 via-green-900/15 to-transparent rounded-none border border-border mb-6">
      <div className="absolute inset-0 opacity-15">
        <svg width="100%" height="100%" viewBox="0 0 600 120" preserveAspectRatio="none">
          <path d="M0,90 C50,85 80,70 120,65 C160,60 180,45 220,40 C260,35 300,50 340,42 C380,34 420,25 460,20 C500,15 540,22 580,12 L600,10" fill="none" stroke="hsl(152, 60%, 50%)" strokeWidth="2" strokeDasharray="800" strokeDashoffset="800" style={{ animation: 'ecgTrace 5s linear infinite' }} />
          <circle cx="340" cy="42" r="3" fill="hsl(152, 60%, 50%)" style={{ animation: 'stockTick 2s ease-in-out infinite' }} />
          <circle cx="580" cy="12" r="4" fill="hsl(152, 65%, 55%)" style={{ animation: 'glowPulse 2s ease-in-out infinite' }} />
        </svg>
      </div>
      <div className="absolute bottom-4 right-40 flex items-end gap-2 opacity-10">
        {[35, 50, 30, 60, 45, 70, 55, 80].map((h, i) => (
          <div key={i} className="w-3 bg-emerald-400/60" style={{ height: `${h}%`, transformOrigin: 'bottom', animation: `growBar 0.6s ease-out ${i * 0.08}s both` }} />
        ))}
      </div>
      <div className="absolute top-5 right-8" style={{ perspective: '100px' }}>
        <RiCopperCoinLine size={44} className="text-emerald-500/20" style={{ animation: 'coinSpin 5s linear infinite' }} />
      </div>
      <div className="absolute top-10 right-24 w-2 h-2 rounded-full bg-emerald-400/15" style={{ animation: 'float 3s ease-in-out infinite' }} />
      <div className="absolute top-6 right-32 w-1 h-1 rounded-full bg-green-300/20" style={{ animation: 'float 4s ease-in-out infinite 1s' }} />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent" />
      <div className="relative z-10 p-6 flex items-end h-full">
        <div>
          <h2 className="font-serif text-2xl tracking-wider text-foreground">Finance</h2>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mt-1">Wealth, Budget, Growth</p>
        </div>
      </div>
    </div>
  )
}

function CareerHeaderGraphic() {
  return (
    <div className="relative h-40 overflow-hidden bg-gradient-to-r from-indigo-900/25 via-purple-900/15 to-transparent rounded-none border border-border mb-6">
      <div className="absolute top-6 right-14">
        <RiRocketLine size={40} className="text-indigo-400/20" style={{ animation: 'rocketFloat 4.5s ease-in-out infinite' }} />
      </div>
      {[
        { top: '12%', right: '8%', size: 2.5, delay: 0, dur: 2 },
        { top: '25%', right: '18%', size: 2, delay: 0.4, dur: 2.5 },
        { top: '8%', right: '25%', size: 1.5, delay: 0.8, dur: 3 },
        { top: '35%', right: '10%', size: 1, delay: 1.2, dur: 2.2 },
        { top: '18%', right: '32%', size: 1.5, delay: 0.6, dur: 2.8 },
        { top: '30%', right: '22%', size: 2, delay: 1, dur: 2.4 },
        { top: '42%', right: '15%', size: 1, delay: 0.3, dur: 3.2 },
      ].map((s, i) => (
        <div key={i} className="absolute rounded-full bg-indigo-400/20" style={{ top: s.top, right: s.right, width: `${s.size * 4}px`, height: `${s.size * 4}px`, animation: `sparklePulse ${s.dur}s ease-in-out infinite ${s.delay}s` }} />
      ))}
      <div className="absolute top-4 right-40 w-1 h-1 rounded-full bg-purple-300/30" style={{ animation: 'starTwinkle 3s ease-in-out infinite' }} />
      <div className="absolute top-20 right-44 w-0.5 h-0.5 rounded-full bg-indigo-300/25" style={{ animation: 'starTwinkle 4s ease-in-out infinite 1s' }} />
      <div className="absolute top-10 right-52 w-1 h-1 rounded-full bg-purple-200/20" style={{ animation: 'starTwinkle 2.5s ease-in-out infinite 0.5s' }} />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-indigo-500/10 via-transparent to-transparent" />
      <div className="relative z-10 p-6 flex items-end h-full">
        <div>
          <h2 className="font-serif text-2xl tracking-wider text-foreground">Career</h2>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mt-1">Growth, Skills, Achievement</p>
        </div>
      </div>
    </div>
  )
}

function RelationshipsHeaderGraphic() {
  return (
    <div className="relative h-40 overflow-hidden bg-gradient-to-r from-pink-900/25 via-rose-900/15 to-transparent rounded-none border border-border mb-6">
      <div className="absolute inset-0 flex items-center justify-center">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className="absolute rounded-full border border-pink-400/8" style={{ width: `${50 + n * 24}px`, height: `${50 + n * 24}px`, animation: `ripple ${2.5 + n * 0.8}s ease-out infinite ${n * 0.6}s` }} />
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-pink-500/5" style={{ animation: 'warmGlow 3s ease-in-out infinite' }} />
      </div>
      <div className="absolute top-5 right-10">
        <RiHandHeartLine size={40} className="text-pink-400/18" style={{ animation: 'heartFloat 3s ease-in-out infinite' }} />
      </div>
      <div className="absolute top-12 right-28">
        <RiUserHeartLine size={22} className="text-pink-300/15" style={{ animation: 'heartFloat 3.5s ease-in-out infinite 0.5s' }} />
      </div>
      <div className="absolute top-8 right-20 w-2 h-2 rounded-full bg-pink-400/15" style={{ animation: 'float 4s ease-in-out infinite 0.8s' }} />
      <div className="absolute top-20 right-36 w-1.5 h-1.5 rounded-full bg-rose-300/12" style={{ animation: 'float 3s ease-in-out infinite 1.5s' }} />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-500/40 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-pink-500/10 via-transparent to-transparent" />
      <div className="relative z-10 p-6 flex items-end h-full">
        <div>
          <h2 className="font-serif text-2xl tracking-wider text-foreground">Relationships</h2>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mt-1">Connection, Love, Community</p>
        </div>
      </div>
    </div>
  )
}

function HabitsHeaderGraphic() {
  return (
    <div className="relative h-40 overflow-hidden bg-gradient-to-r from-amber-900/25 via-orange-900/15 to-transparent rounded-none border border-border mb-6">
      <div className="absolute inset-0 flex items-center justify-center opacity-12">
        <div className="flex gap-2 items-center">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <React.Fragment key={n}>
              <div className="w-7 h-7 border border-amber-400/40 flex items-center justify-center" style={{ animation: `checkBounce 0.5s ease-out ${n * 0.1}s both` }}>
                {n <= 6 && <RiCheckLine size={13} className="text-amber-400/70" />}
              </div>
              {n < 9 && <div className="w-3 h-0.5 bg-amber-400/20" style={{ animation: `chainLink 2s ease-in-out infinite ${n * 0.15}s` }} />}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="absolute top-5 right-8">
        <RiFireLine size={44} className="text-amber-500/20" style={{ animation: 'streakFlame 1.5s ease-in-out infinite' }} />
      </div>
      <div className="absolute top-3 right-20 w-2 h-2 rounded-full bg-amber-400/15" style={{ animation: 'float 3s ease-in-out infinite' }} />
      <div className="absolute top-14 right-6 w-1.5 h-1.5 rounded-full bg-orange-300/15" style={{ animation: 'float 4s ease-in-out infinite 1s' }} />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-amber-500/10 via-transparent to-transparent" />
      <div className="relative z-10 p-6 flex items-end h-full">
        <div>
          <h2 className="font-serif text-2xl tracking-wider text-foreground">Habits</h2>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mt-1">Consistency, Discipline, Momentum</p>
        </div>
      </div>
    </div>
  )
}

function GoalsHeaderGraphic() {
  return (
    <div className="relative h-40 overflow-hidden bg-gradient-to-r from-sky-900/25 via-cyan-900/15 to-transparent rounded-none border border-border mb-6">
      <div className="absolute inset-0 opacity-12">
        <svg width="100%" height="100%" viewBox="0 0 600 160" preserveAspectRatio="none">
          <path d="M0,150 C40,148 80,140 120,130 C160,120 200,105 240,90 C280,75 320,55 360,45 C400,35 440,28 480,22 C520,16 560,12 600,8" fill="none" stroke="hsl(199, 60%, 50%)" strokeWidth="2" strokeDasharray="8 6" strokeDashoffset="600" style={{ animation: 'mountainPath 6s linear infinite' }} />
          <polygon points="380,150 480,30 580,150" fill="none" stroke="hsl(199, 40%, 40%)" strokeWidth="1" opacity="0.3" />
          <polygon points="420,150 500,50 580,150" fill="none" stroke="hsl(199, 50%, 45%)" strokeWidth="1" opacity="0.2" />
          <circle cx="480" cy="30" r="4" fill="hsl(199, 60%, 55%)" style={{ animation: 'milestoneGlow 2.5s ease-in-out infinite' }} />
          <circle cx="360" cy="45" r="3" fill="hsl(199, 50%, 50%)" style={{ animation: 'milestoneGlow 2s ease-in-out infinite 0.8s' }} />
          <circle cx="240" cy="90" r="2.5" fill="hsl(199, 40%, 45%)" style={{ animation: 'milestoneGlow 2.5s ease-in-out infinite 1.5s' }} />
        </svg>
      </div>
      <div className="absolute top-5 right-8">
        <RiFlagLine size={42} className="text-sky-400/20" style={{ animation: 'flagWave 2.5s ease-in-out infinite' }} />
      </div>
      <div className="absolute top-3 right-24 w-2 h-2 rounded-full bg-sky-400/15" style={{ animation: 'float 3s ease-in-out infinite' }} />
      <div className="absolute top-14 right-16 w-1 h-1 rounded-full bg-cyan-300/15" style={{ animation: 'float 4s ease-in-out infinite 0.5s' }} />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-sky-500/10 via-transparent to-transparent" />
      <div className="relative z-10 p-6 flex items-end h-full">
        <div>
          <h2 className="font-serif text-2xl tracking-wider text-foreground">Goals</h2>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mt-1">Vision, Milestones, Achievement</p>
        </div>
      </div>
    </div>
  )
}

const DOMAIN_HEADERS: Record<DomainKey, () => React.ReactNode> = {
  health: () => <HealthHeaderGraphic />,
  finance: () => <FinanceHeaderGraphic />,
  career: () => <CareerHeaderGraphic />,
  relationships: () => <RelationshipsHeaderGraphic />,
  habits: () => <HabitsHeaderGraphic />,
  goals: () => <GoalsHeaderGraphic />,
}

// ---- WATER TRACKER ----

function WaterTracker({ glasses, onToggle }: { glasses: boolean[]; onToggle: (i: number) => void }) {
  const filled = glasses.filter(Boolean).length
  return (
    <div className="bg-card border border-border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RiDropLine size={16} className="text-sky-400" />
          <span className="text-xs tracking-widest uppercase text-muted-foreground">Water Intake</span>
        </div>
        <span className="text-xs text-muted-foreground">{filled}/8 glasses</span>
      </div>
      <div className="flex gap-2">
        {glasses.map((g, i) => (
          <button key={i} onClick={() => onToggle(i)} className={`w-8 h-10 border transition-all duration-300 flex items-center justify-center ${g ? 'bg-sky-500/20 border-sky-500/40 text-sky-400' : 'border-border text-muted-foreground/20 hover:border-sky-500/20'}`}>
            <RiDropLine size={14} />
          </button>
        ))}
      </div>
    </div>
  )
}

// ---- HABIT HEAT GRID ----

function HabitHeatGrid({ entries }: { entries: DomainEntry[] }) {
  const days = useMemo(() => {
    const result: { label: string; count: number }[] = []
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dayStr = d.toISOString().split('T')[0]
      const count = Array.isArray(entries) ? entries.filter(e => {
        const et = e?.timestamp
        if (!et) return false
        try { return et.split('T')[0] === dayStr } catch { return false }
      }).length : 0
      result.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2), count })
    }
    return result
  }, [entries])

  return (
    <div className="bg-card border border-border p-5 space-y-3">
      <div className="flex items-center gap-2">
        <RiCalendar2Line size={16} className="text-amber-400" />
        <span className="text-xs tracking-widest uppercase text-muted-foreground">Activity Grid (14 days)</span>
      </div>
      <div className="flex gap-1.5">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className={`w-5 h-5 border transition-all ${d.count > 0 ? 'bg-amber-500/40 border-amber-500/30' : 'border-border bg-secondary/30'}`} title={`${d.count} entries`} />
            <span className="text-xs text-muted-foreground/40">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- MOOD TIMELINE ----

function MoodTimeline({ entries }: { entries: DomainEntry[] }) {
  const moods = useMemo(() => {
    if (!Array.isArray(entries)) return []
    return entries.slice(0, 7).map(e => ({
      sentiment: e?.sentiment ?? 'neutral',
      date: e?.timestamp ? new Date(e.timestamp).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2) : '--',
    })).reverse()
  }, [entries])

  if (moods.length === 0) return null
  return (
    <div className="bg-card border border-border p-5 space-y-3">
      <div className="flex items-center gap-2">
        <RiEmotionLine size={16} className="text-amber-400" />
        <span className="text-xs tracking-widest uppercase text-muted-foreground">Mood Timeline</span>
      </div>
      <div className="flex items-end gap-3">
        {moods.map((m, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full transition-all ${m.sentiment === 'positive' ? 'bg-green-500 shadow-sm shadow-green-500/30' : m.sentiment === 'negative' ? 'bg-red-400 shadow-sm shadow-red-400/30' : 'bg-yellow-500 shadow-sm shadow-yellow-500/30'}`} />
            <span className="text-xs text-muted-foreground/40">{m.date}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- BUDGET METER ----

function BudgetMeter({ entries }: { entries: DomainEntry[] }) {
  const data = useMemo(() => {
    if (!Array.isArray(entries)) return { spent: 0, budget: 1000, pct: 0 }
    let totalSpent = 0
    for (const e of entries) {
      if (!Array.isArray(e?.metrics)) continue
      for (const m of e.metrics) {
        const name = (m?.name ?? '').toLowerCase()
        if (name.includes('expense') || name.includes('spend') || name.includes('over budget') || name.includes('dining')) {
          totalSpent += parseFloat(m?.value ?? '0') || 0
        }
      }
    }
    const budget = 2000
    return { spent: totalSpent, budget, pct: Math.min((totalSpent / budget) * 100, 100) }
  }, [entries])

  const barColor = data.pct > 80 ? 'bg-red-400/70' : data.pct > 50 ? 'bg-yellow-500/70' : 'bg-emerald-400/70'
  return (
    <div className="bg-card border border-border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RiPieChartLine size={16} className="text-emerald-400" />
          <span className="text-xs tracking-widest uppercase text-muted-foreground">Budget Usage</span>
        </div>
        <span className="text-xs text-muted-foreground">${data.spent.toFixed(0)} / ${data.budget}</span>
      </div>
      <div className="h-3 bg-muted overflow-hidden">
        <div className={`h-full ${barColor} transition-all duration-1000`} style={{ width: `${data.pct}%`, animation: 'momentumFill 1s ease-out' }} />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground/50">
        <span>{Math.round(data.pct)}% used</span>
        <span className={data.pct > 80 ? 'text-red-400' : data.pct > 50 ? 'text-yellow-500' : 'text-emerald-400'}>
          {data.pct > 80 ? 'Over budget' : data.pct > 50 ? 'Watch spending' : 'On track'}
        </span>
      </div>
    </div>
  )
}

// ---- INTERACTION HEATMAP ----

function InteractionHeatmap({ entries }: { entries: DomainEntry[] }) {
  const days = useMemo(() => {
    const result: { label: string; count: number; day: string }[] = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dayStr = d.toISOString().split('T')[0]
      const count = Array.isArray(entries) ? entries.filter(e => {
        try { return (e?.timestamp ?? '').split('T')[0] === dayStr } catch { return false }
      }).length : 0
      result.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2), count, day: dayStr })
    }
    return result
  }, [entries])

  return (
    <div className="bg-card border border-border p-5 space-y-3">
      <div className="flex items-center gap-2">
        <RiGroupLine size={16} className="text-pink-400" />
        <span className="text-xs tracking-widest uppercase text-muted-foreground">Connection Frequency (7 days)</span>
      </div>
      <div className="flex gap-2">
        {days.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className={`w-full h-8 border transition-all flex items-center justify-center ${d.count > 0 ? 'bg-pink-500/20 border-pink-500/30' : 'border-border bg-secondary/20'}`}>
              {d.count > 0 && <span className="text-xs text-pink-300">{d.count}</span>}
            </div>
            <span className="text-xs text-muted-foreground/40">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- STREAK DISPLAY ----

function StreakDisplay({ entries }: { entries: DomainEntry[] }) {
  const streakData = useMemo(() => {
    if (!Array.isArray(entries)) return { current: 0, best: 0 }
    let maxStreak = 0
    for (const e of entries) {
      if (!Array.isArray(e?.metrics)) continue
      const sm = e.metrics.find(m => (m?.name ?? '').toLowerCase().includes('streak'))
      if (sm) {
        const v = parseInt(sm.value ?? '0') || 0
        if (v > maxStreak) maxStreak = v
      }
    }
    return { current: maxStreak, best: maxStreak }
  }, [entries])

  return (
    <div className="bg-card border border-border p-6 flex items-center gap-6">
      <div className="relative">
        <RiFireLine size={40} className="text-amber-400" style={{ animation: 'streakFlame 1.5s ease-in-out infinite' }} />
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400/30" style={{ animation: 'dotPing 2s ease-out infinite' }} />
      </div>
      <div className="flex-1 flex gap-6">
        <div>
          <span className="text-4xl font-serif font-light text-foreground" style={{ animation: 'numberCount 0.6s ease-out' }}>{streakData.current}</span>
          <p className="text-xs tracking-widest uppercase text-muted-foreground mt-0.5">Current Streak</p>
        </div>
        <div className="h-10 w-px bg-border self-center" />
        <div>
          <span className="text-2xl font-serif font-light text-muted-foreground">{streakData.best}</span>
          <p className="text-xs tracking-widest uppercase text-muted-foreground/60 mt-0.5">Personal Best</p>
        </div>
      </div>
    </div>
  )
}

// ---- GOAL PROGRESS CARDS ----

function GoalProgressCards({ entries }: { entries: DomainEntry[] }) {
  if (!Array.isArray(entries) || entries.length === 0) return null
  return (
    <div className="space-y-3">
      <h4 className="text-xs tracking-widest uppercase text-muted-foreground flex items-center gap-2">
        <RiFlagLine size={14} className="text-sky-400" />
        Active Goals
      </h4>
      {entries.map((goal, i) => {
        const progressMetric = Array.isArray(goal?.metrics) ? goal.metrics.find(m => (m?.name ?? '').toLowerCase() === 'progress') : null
        const pct = progressMetric ? Math.min(parseFloat(progressMetric.value ?? '0'), 100) : 0
        const targetMetric = Array.isArray(goal?.metrics) ? goal.metrics.find(m => (m?.name ?? '').toLowerCase() === 'target' || (m?.name ?? '').toLowerCase() === 'target distance') : null
        const currentMetric = Array.isArray(goal?.metrics) ? goal.metrics.find(m => (m?.name ?? '').toLowerCase() === 'current') : null
        return (
          <div key={i} className="bg-card border border-border p-5 space-y-3" style={{ animation: `fadeInUp 0.4s ease-out ${i * 0.1}s both` }}>
            <p className="text-sm text-foreground/90 leading-relaxed">{goal?.content ?? ''}</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-muted overflow-hidden relative">
                <div className="h-full bg-sky-500/60 transition-all duration-1000" style={{ width: `${pct}%` }} />
                <div className="absolute inset-0 h-full bg-gradient-to-r from-transparent to-sky-400/10" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-sm font-serif text-sky-400 w-12 text-right">{pct}%</span>
            </div>
            {(targetMetric || currentMetric) && (
              <div className="flex gap-4 text-xs text-muted-foreground">
                {currentMetric && <span>Current: {currentMetric.value} {currentMetric.unit}</span>}
                {targetMetric && <span>Target: {targetMetric.value} {targetMetric.unit}</span>}
              </div>
            )}
            {Array.isArray(goal?.tags) && goal.tags.length > 0 && (
              <div className="flex gap-1.5">
                {goal.tags.slice(0, 3).map((tag, j) => (
                  <span key={j} className="text-xs px-2 py-0.5 bg-sky-500/10 text-sky-400/70 tracking-wider">{typeof tag === 'string' ? tag : ''}</span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---- EXPENSE CATEGORY GRID ----

function ExpenseCategoryGrid({ entries }: { entries: DomainEntry[] }) {
  const categories = useMemo(() => {
    const cats: Record<string, number> = {}
    if (!Array.isArray(entries)) return []
    for (const e of entries) {
      if (!Array.isArray(e?.tags)) continue
      for (const tag of e.tags) {
        if (typeof tag !== 'string') continue
        const t = tag.toLowerCase()
        if (['budget', 'review', 'savings', 'income', 'bonus'].includes(t)) continue
        if (!Array.isArray(e?.metrics)) continue
        for (const m of e.metrics) {
          const name = (m?.name ?? '').toLowerCase()
          if (name.includes('amount') || name.includes('spend') || name.includes('over') || name.includes('bonus')) {
            cats[tag] = (cats[tag] || 0) + (parseFloat(m?.value ?? '0') || 0)
          }
        }
      }
    }
    return Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, val]) => ({ name, value: val }))
  }, [entries])

  if (categories.length === 0) return null
  const max = Math.max(...categories.map(c => c.value), 1)
  return (
    <div className="bg-card border border-border p-5 space-y-3">
      <div className="flex items-center gap-2">
        <RiBarChartLine size={16} className="text-emerald-400" />
        <span className="text-xs tracking-widest uppercase text-muted-foreground">Spending Categories</span>
      </div>
      <div className="space-y-2">
        {categories.map((cat, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-20 truncate capitalize tracking-wider">{cat.name}</span>
            <div className="flex-1 h-2 bg-muted overflow-hidden">
              <div className="h-full bg-emerald-500/50 transition-all duration-700" style={{ width: `${(cat.value / max) * 100}%`, animation: `momentumFill 0.8s ease-out ${i * 0.1}s both` }} />
            </div>
            <span className="text-xs text-muted-foreground w-14 text-right">${cat.value.toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- SKILLS PROGRESS ----

function SkillsProgress({ entries }: { entries: DomainEntry[] }) {
  const skills = useMemo(() => {
    const tagCount: Record<string, number> = {}
    if (!Array.isArray(entries)) return []
    for (const e of entries) {
      if (!Array.isArray(e?.tags)) continue
      for (const tag of e.tags) {
        if (typeof tag === 'string') {
          tagCount[tag] = (tagCount[tag] || 0) + 1
        }
      }
    }
    return Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }))
  }, [entries])

  if (skills.length === 0) return null
  const max = Math.max(...skills.map(s => s.count), 1)
  return (
    <div className="bg-card border border-border p-5 space-y-3">
      <div className="flex items-center gap-2">
        <RiStarLine size={16} className="text-indigo-400" />
        <span className="text-xs tracking-widest uppercase text-muted-foreground">Focus Areas</span>
      </div>
      <div className="space-y-2">
        {skills.map((skill, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-24 truncate capitalize tracking-wider">{skill.name}</span>
            <div className="flex-1 h-2 bg-muted overflow-hidden">
              <div className="h-full bg-indigo-500/50 transition-all duration-700" style={{ width: `${(skill.count / max) * 100}%`, animation: `momentumFill 0.8s ease-out ${i * 0.1}s both` }} />
            </div>
            <span className="text-xs text-muted-foreground/60">{skill.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- GRATITUDE WALL ----

function GratitudeWall({ entries }: { entries: DomainEntry[] }) {
  const positiveEntries = useMemo(() => {
    if (!Array.isArray(entries)) return []
    return entries.filter(e => e?.sentiment === 'positive').slice(0, 3)
  }, [entries])

  if (positiveEntries.length === 0) return null
  return (
    <div className="bg-card border border-border p-5 space-y-3">
      <div className="flex items-center gap-2">
        <RiLeafLine size={16} className="text-green-400" />
        <span className="text-xs tracking-widest uppercase text-muted-foreground">Gratitude Wall</span>
      </div>
      <div className="space-y-2">
        {positiveEntries.map((entry, i) => (
          <div key={i} className="bg-secondary/30 border border-border/50 p-3 border-l-2 border-l-green-500/30" style={{ animation: `fadeInUp 0.3s ease-out ${i * 0.1}s both` }}>
            <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2">{entry?.content ?? ''}</p>
            <span className="text-xs text-muted-foreground/40 mt-1 block">
              {entry?.timestamp ? new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- SLEEP QUALITY GAUGE ----

function SleepQualityGauge({ entries }: { entries: DomainEntry[] }) {
  const sleepData = useMemo(() => {
    if (!Array.isArray(entries)) return { lastNight: 0, average: 0 }
    let total = 0
    let count = 0
    let lastNight = 0
    for (const e of entries) {
      if (!Array.isArray(e?.metrics)) continue
      const sm = e.metrics.find(m => (m?.name ?? '').toLowerCase().includes('sleep'))
      if (sm) {
        const v = parseFloat(sm.value ?? '0') || 0
        if (count === 0) lastNight = v
        total += v
        count++
      }
    }
    return { lastNight, average: count > 0 ? Math.round((total / count) * 10) / 10 : 0 }
  }, [entries])

  const pct = Math.min((sleepData.lastNight / 10) * 100, 100)
  const color = sleepData.lastNight >= 7 ? 'hsl(152, 60%, 50%)' : sleepData.lastNight >= 5 ? 'hsl(40, 70%, 55%)' : 'hsl(0, 60%, 55%)'
  const r = 50
  const circumference = Math.PI * r
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="bg-card border border-border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <RiZzzLine size={16} className="text-indigo-400" />
        <span className="text-xs tracking-widest uppercase text-muted-foreground">Sleep Quality</span>
      </div>
      <div className="flex items-center justify-center">
        <svg width="140" height="80" viewBox="0 0 140 80">
          <path d="M 15 75 A 55 55 0 0 1 125 75" fill="none" stroke="hsl(30, 5%, 18%)" strokeWidth="8" strokeLinecap="square" />
          <path d="M 15 75 A 55 55 0 0 1 125 75" fill="none" stroke={color} strokeWidth="8" strokeLinecap="square" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
          <text x="70" y="55" textAnchor="middle" fill={color} fontSize="20" fontFamily="serif" fontWeight="300">{sleepData.lastNight}h</text>
          <text x="70" y="72" textAnchor="middle" fill="hsl(30, 8%, 55%)" fontSize="9" letterSpacing="2">LAST NIGHT</text>
        </svg>
      </div>
      <div className="flex justify-between border-t border-border pt-3">
        <div className="text-center flex-1">
          <span className="text-lg font-serif font-light text-foreground">{sleepData.lastNight}h</span>
          <p className="text-xs tracking-widest uppercase text-muted-foreground/60 mt-0.5">Last Night</p>
        </div>
        <div className="w-px bg-border" />
        <div className="text-center flex-1">
          <span className="text-lg font-serif font-light text-foreground">{sleepData.average}h</span>
          <p className="text-xs tracking-widest uppercase text-muted-foreground/60 mt-0.5">7-Day Avg</p>
        </div>
      </div>
    </div>
  )
}

// ---- NUTRITION RADAR ----

function NutritionRadar({ entries }: { entries: DomainEntry[] }) {
  const data = useMemo(() => {
    if (!Array.isArray(entries)) return [0.5, 0.5, 0.5, 0.5, 0.5]
    let calories = 0, hydration = 0, exercise = 0, nutrition = 0, mindfulness = 0
    for (const e of entries) {
      if (!Array.isArray(e?.tags)) continue
      const tags = e.tags.map(t => typeof t === 'string' ? t.toLowerCase() : '')
      if (tags.some(t => t.includes('cardio') || t.includes('running') || t.includes('exercise'))) exercise += 0.3
      if (tags.some(t => t.includes('nutrition') || t.includes('food'))) nutrition += 0.3
      if (tags.some(t => t.includes('water') || t.includes('hydration'))) hydration += 0.3
      if (tags.some(t => t.includes('yoga') || t.includes('mindfulness') || t.includes('meditation'))) mindfulness += 0.3
      if (!Array.isArray(e?.metrics)) continue
      for (const m of e.metrics) {
        if ((m?.name ?? '').toLowerCase().includes('calories')) calories += 0.2
      }
    }
    return [
      Math.min(calories, 1) || 0.15,
      Math.min(hydration, 1) || 0.15,
      Math.min(exercise, 1) || 0.15,
      Math.min(nutrition, 1) || 0.15,
      Math.min(mindfulness, 1) || 0.15,
    ]
  }, [entries])

  const labels = ['Energy', 'Hydrate', 'Active', 'Nutrition', 'Mind']
  const cx = 70, cy = 70, maxR = 50
  const angleStep = (2 * Math.PI) / 5
  const startAngle = -Math.PI / 2

  const getPoint = (index: number, value: number) => {
    const angle = startAngle + index * angleStep
    return { x: cx + Math.cos(angle) * maxR * value, y: cy + Math.sin(angle) * maxR * value }
  }

  const dataPoints = data.map((v, i) => getPoint(i, v))
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'
  const gridLevels = [0.25, 0.5, 0.75, 1]

  return (
    <div className="bg-card border border-border p-5 space-y-3">
      <div className="flex items-center gap-2">
        <RiShieldCheckLine size={16} className="text-rose-400" />
        <span className="text-xs tracking-widest uppercase text-muted-foreground">Wellness Radar</span>
      </div>
      <div className="flex justify-center">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {gridLevels.map((level, gi) => {
            const pts = Array.from({ length: 5 }, (_, i) => getPoint(i, level))
            const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'
            return <path key={gi} d={path} fill="none" stroke="hsl(30, 5%, 18%)" strokeWidth="0.5" />
          })}
          {Array.from({ length: 5 }, (_, i) => {
            const outer = getPoint(i, 1)
            return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="hsl(30, 5%, 18%)" strokeWidth="0.5" />
          })}
          <path d={dataPath} fill="rgba(244,63,94,0.12)" stroke="hsl(0, 65%, 55%)" strokeWidth="1.5" className="transition-all duration-700" />
          {dataPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="hsl(0, 65%, 55%)" className="transition-all duration-500" />
          ))}
          {Array.from({ length: 5 }, (_, i) => {
            const lp = getPoint(i, 1.2)
            return <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fill="hsl(30, 8%, 55%)" fontSize="7" letterSpacing="1">{labels[i]}</text>
          })}
        </svg>
      </div>
    </div>
  )
}

// ---- NET WORTH TRACKER ----

function NetWorthTracker({ entries }: { entries: DomainEntry[] }) {
  const chartData = useMemo(() => {
    if (!Array.isArray(entries)) return { points: [], total: 0 }
    let running = 0
    const pts: number[] = []
    const reversed = [...entries].reverse()
    for (const e of reversed) {
      if (!Array.isArray(e?.metrics)) continue
      for (const m of e.metrics) {
        const name = (m?.name ?? '').toLowerCase()
        if (name.includes('amount') || name.includes('bonus') || name.includes('savings')) {
          running += parseFloat(m?.value ?? '0') || 0
        }
      }
      pts.push(running)
    }
    return { points: pts.length > 0 ? pts : [0], total: running }
  }, [entries])

  const maxVal = Math.max(...chartData.points, 1)
  const w = 260, h = 60, pad = 4
  const step = chartData.points.length > 1 ? (w - pad * 2) / (chartData.points.length - 1) : 0
  const pathPoints = chartData.points.map((v, i) => ({
    x: pad + i * step,
    y: h - pad - ((v / maxVal) * (h - pad * 2))
  }))
  const linePath = pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = linePath + ` L${pathPoints[pathPoints.length - 1]?.x ?? pad},${h - pad} L${pad},${h - pad} Z`

  return (
    <div className="bg-card border border-border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RiLineChartLine size={16} className="text-emerald-400" />
          <span className="text-xs tracking-widest uppercase text-muted-foreground">Net Worth Trend</span>
        </div>
        <span className="text-lg font-serif font-light text-emerald-400">${chartData.total.toLocaleString()}</span>
      </div>
      <svg width="100%" height="60" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(152, 60%, 50%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(152, 60%, 50%)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {chartData.points.length > 1 && (
          <>
            <path d={areaPath} fill="url(#nwGrad)" />
            <path d={linePath} fill="none" stroke="hsl(152, 60%, 50%)" strokeWidth="2" strokeLinecap="round" />
            {pathPoints.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="2" fill="hsl(152, 65%, 55%)" />
            ))}
          </>
        )}
      </svg>
    </div>
  )
}

// ---- SAVINGS GOAL RING ----

function SavingsGoalRing({ entries }: { entries: DomainEntry[] }) {
  const savings = useMemo(() => {
    if (!Array.isArray(entries)) return { current: 0, target: 10000 }
    let current = 0, target = 10000
    for (const e of entries) {
      if (!Array.isArray(e?.metrics)) continue
      for (const m of e.metrics) {
        const name = (m?.name ?? '').toLowerCase()
        if (name === 'current' || name.includes('savings')) {
          const v = parseFloat(m?.value ?? '0') || 0
          if (v > current) current = v
        }
        if (name === 'target') {
          const v = parseFloat(m?.value ?? '0') || 0
          if (v > 0) target = v
        }
      }
    }
    return { current, target }
  }, [entries])

  const pct = Math.min((savings.current / savings.target) * 100, 100)
  const r = 40, sw = 6
  const circumference = 2 * Math.PI * r
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="bg-card border border-border p-5 space-y-3">
      <div className="flex items-center gap-2">
        <RiSeedlingLine size={16} className="text-emerald-400" />
        <span className="text-xs tracking-widest uppercase text-muted-foreground">Savings Goal</span>
      </div>
      <div className="flex items-center justify-center gap-6">
        <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
          <svg width="100" height="100" className="transform -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(30, 5%, 18%)" strokeWidth={sw} />
            <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(152, 60%, 50%)" strokeWidth={sw} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="square" className="transition-all duration-1000 ease-out" />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-sm font-serif font-light text-emerald-400">{Math.round(pct)}%</span>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <span className="text-xs tracking-widest uppercase text-muted-foreground/60">Saved</span>
            <p className="text-lg font-serif font-light text-foreground">${savings.current.toLocaleString()}</p>
          </div>
          <div className="h-px bg-border" />
          <div>
            <span className="text-xs tracking-widest uppercase text-muted-foreground/60">Target</span>
            <p className="text-sm font-serif font-light text-muted-foreground">${savings.target.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- CERTIFICATION TRACKER ----

function CertificationTracker({ entries }: { entries: DomainEntry[] }) {
  const certs = useMemo(() => {
    if (!Array.isArray(entries)) return []
    return entries.filter(e => {
      if (!Array.isArray(e?.tags)) return false
      return e.tags.some(t => typeof t === 'string' && (t.includes('certification') || t.includes('learning') || t.includes('course')))
    }).slice(0, 3).map(e => {
      let progress = 0
      if (Array.isArray(e?.metrics)) {
        const pm = e.metrics.find(m => (m?.name ?? '').toLowerCase() === 'progress')
        if (pm) progress = parseFloat(pm.value ?? '0') || 0
      }
      return { content: (e?.content ?? '').slice(0, 60), progress: Math.min(progress, 100) }
    })
  }, [entries])

  if (certs.length === 0) return null
  const milestones = [25, 50, 75, 100]

  return (
    <div className="bg-card border border-border p-5 space-y-3">
      <div className="flex items-center gap-2">
        <RiAwardLine size={16} className="text-indigo-400" />
        <span className="text-xs tracking-widest uppercase text-muted-foreground">Learning Progress</span>
      </div>
      <div className="space-y-4">
        {certs.map((cert, i) => (
          <div key={i} className="space-y-2" style={{ animation: `fadeInUp 0.3s ease-out ${i * 0.1}s both` }}>
            <p className="text-xs text-foreground/80 leading-relaxed truncate">{cert.content}</p>
            <div className="relative">
              <div className="h-2 bg-muted overflow-hidden">
                <div className="h-full bg-indigo-500/60 transition-all duration-1000" style={{ width: `${cert.progress}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                {milestones.map((ms, j) => (
                  <div key={j} className="flex flex-col items-center" style={{ position: 'absolute', left: `${ms}%`, transform: 'translateX(-50%)', top: '-2px' }}>
                    <div className={`w-2 h-2 rounded-full border ${cert.progress >= ms ? 'bg-indigo-400 border-indigo-400' : 'bg-muted border-border'}`} />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground/40">{cert.progress}% complete</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- NETWORK MAP ----

function NetworkMap({ entries }: { entries: DomainEntry[] }) {
  const networkCount = useMemo(() => {
    if (!Array.isArray(entries)) return 0
    return entries.filter(e => {
      if (!Array.isArray(e?.tags)) return false
      return e.tags.some(t => typeof t === 'string' && (t.includes('network') || t.includes('team') || t.includes('management')))
    }).length
  }, [entries])

  const nodes = useMemo(() => {
    const positions = [
      { x: 60, y: 40 }, { x: 100, y: 25 }, { x: 130, y: 55 },
      { x: 40, y: 70 }, { x: 90, y: 75 }, { x: 120, y: 85 },
      { x: 70, y: 10 },
    ]
    return positions.slice(0, Math.max(Math.min(networkCount + 2, 7), 3))
  }, [networkCount])

  return (
    <div className="bg-card border border-border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RiGlobalLine size={16} className="text-purple-400" />
          <span className="text-xs tracking-widest uppercase text-muted-foreground">Network</span>
        </div>
        <span className="text-sm font-serif font-light text-foreground">{networkCount} connections</span>
      </div>
      <div className="flex justify-center">
        <svg width="170" height="100" viewBox="0 0 170 100">
          {nodes.map((n, i) => nodes.slice(i + 1).map((n2, j) => {
            const dist = Math.sqrt(Math.pow(n.x - n2.x, 2) + Math.pow(n.y - n2.y, 2))
            if (dist > 70) return null
            return <line key={`${i}-${j}`} x1={n.x} y1={n.y} x2={n2.x} y2={n2.y} stroke="hsl(270, 40%, 40%)" strokeWidth="0.5" opacity="0.4" style={{ animation: `glowPulse 3s ease-in-out infinite ${(i + j) * 0.3}s` }} />
          }))}
          {nodes.map((n, i) => (
            <React.Fragment key={i}>
              <circle cx={n.x} cy={n.y} r={i === 0 ? 6 : 4} fill={i === 0 ? 'hsl(270, 50%, 55%)' : 'hsl(270, 40%, 45%)'} opacity={i === 0 ? 1 : 0.7} style={{ animation: `sparklePulse ${2 + i * 0.3}s ease-in-out infinite ${i * 0.2}s` }} />
              {i === 0 && <circle cx={n.x} cy={n.y} r="10" fill="none" stroke="hsl(270, 50%, 55%)" strokeWidth="0.5" opacity="0.3" style={{ animation: 'pulseRing 2s ease-out infinite' }} />}
            </React.Fragment>
          ))}
        </svg>
      </div>
    </div>
  )
}

// ---- RELATIONSHIP SCOREBOARD ----

function RelationshipScoreBoard({ entries }: { entries: DomainEntry[] }) {
  const categories = useMemo(() => {
    const cats: Record<string, number> = { family: 0, friends: 0, romantic: 0, professional: 0 }
    if (!Array.isArray(entries)) return Object.entries(cats).map(([name, count]) => ({ name, count }))
    for (const e of entries) {
      if (!Array.isArray(e?.tags)) continue
      for (const tag of e.tags) {
        if (typeof tag !== 'string') continue
        const t = tag.toLowerCase()
        if (t.includes('family') || t.includes('dinner')) cats.family++
        else if (t.includes('friend') || t.includes('call')) cats.friends++
        else if (t.includes('romantic') || t.includes('date') || t.includes('partner')) cats.romantic++
        else if (t.includes('work') || t.includes('colleague') || t.includes('professional')) cats.professional++
      }
    }
    return Object.entries(cats).map(([name, count]) => ({ name, count }))
  }, [entries])

  const icons: Record<string, React.ReactNode> = {
    family: <RiGroupLine size={14} />,
    friends: <RiPhoneLine size={14} />,
    romantic: <RiUserHeartLine size={14} />,
    professional: <RiTeamLine size={14} />,
  }
  const max = Math.max(...categories.map(c => c.count), 1)

  return (
    <div className="bg-card border border-border p-5 space-y-3">
      <div className="flex items-center gap-2">
        <RiHandHeartLine size={16} className="text-pink-400" />
        <span className="text-xs tracking-widest uppercase text-muted-foreground">Connection Types</span>
      </div>
      <div className="space-y-2.5">
        {categories.map((cat, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-pink-400/60 w-5 flex justify-center">{icons[cat.name] ?? <RiGroupLine size={14} />}</span>
            <span className="text-xs text-muted-foreground w-20 capitalize tracking-wider">{cat.name}</span>
            <div className="flex-1 h-2 bg-muted overflow-hidden">
              <div className="h-full bg-pink-500/50 transition-all duration-700" style={{ width: `${(cat.count / max) * 100}%`, animation: `momentumFill 0.8s ease-out ${i * 0.1}s both` }} />
            </div>
            <span className="text-xs text-muted-foreground/60 w-6 text-right">{cat.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- HABIT COMPLETION WHEEL ----

function HabitCompletionWheel({ entries }: { entries: DomainEntry[] }) {
  const segments = useMemo(() => {
    if (!Array.isArray(entries) || entries.length === 0) return { positive: 0, neutral: 0, negative: 0, total: 0 }
    const positive = entries.filter(e => e?.sentiment === 'positive').length
    const negative = entries.filter(e => e?.sentiment === 'negative').length
    const neutral = entries.length - positive - negative
    return { positive, neutral, negative, total: entries.length }
  }, [entries])

  if (segments.total === 0) return null
  const r = 36, sw = 10, cx = 50, cy = 50
  const circumference = 2 * Math.PI * r
  const posArc = (segments.positive / segments.total) * circumference
  const neutArc = (segments.neutral / segments.total) * circumference
  const negArc = (segments.negative / segments.total) * circumference
  const posPct = Math.round((segments.positive / segments.total) * 100)

  return (
    <div className="bg-card border border-border p-5 space-y-3">
      <div className="flex items-center gap-2">
        <RiPieChartLine size={16} className="text-amber-400" />
        <span className="text-xs tracking-widest uppercase text-muted-foreground">Completion Rate</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
          <svg width="100" height="100" className="transform -rotate-90">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(152, 60%, 50%)" strokeWidth={sw} strokeDasharray={`${posArc} ${circumference - posArc}`} strokeDashoffset="0" className="transition-all duration-700" />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(40, 70%, 55%)" strokeWidth={sw} strokeDasharray={`${neutArc} ${circumference - neutArc}`} strokeDashoffset={`${-posArc}`} className="transition-all duration-700" />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(0, 60%, 55%)" strokeWidth={sw} strokeDasharray={`${negArc} ${circumference - negArc}`} strokeDashoffset={`${-(posArc + neutArc)}`} className="transition-all duration-700" />
          </svg>
          <span className="absolute text-lg font-serif font-light text-foreground">{posPct}%</span>
        </div>
        <div className="space-y-2">
          {[
            { label: 'Completed', count: segments.positive, color: 'bg-green-500' },
            { label: 'Partial', count: segments.neutral, color: 'bg-yellow-500' },
            { label: 'Missed', count: segments.negative, color: 'bg-red-400' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-xs text-muted-foreground tracking-wider">{item.label}</span>
              <span className="text-xs text-muted-foreground/60 ml-auto">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---- GOAL TIMELINE ----

function GoalTimeline({ entries }: { entries: DomainEntry[] }) {
  if (!Array.isArray(entries) || entries.length === 0) return null
  return (
    <div className="bg-card border border-border p-5 space-y-3">
      <div className="flex items-center gap-2">
        <RiTimeLine size={16} className="text-sky-400" />
        <span className="text-xs tracking-widest uppercase text-muted-foreground">Goal Timeline</span>
      </div>
      <div className="relative pl-6 space-y-4">
        <div className="absolute left-2 top-1 bottom-1 w-px bg-sky-500/20" />
        {entries.slice(0, 4).map((entry, i) => {
          let progress = 0
          if (Array.isArray(entry?.metrics)) {
            const pm = entry.metrics.find(m => (m?.name ?? '').toLowerCase() === 'progress')
            if (pm) progress = parseFloat(pm.value ?? '0') || 0
          }
          return (
            <div key={i} className="relative" style={{ animation: `fadeInUp 0.3s ease-out ${i * 0.1}s both` }}>
              <div className={`absolute -left-4 top-1 w-3 h-3 rounded-full border-2 ${progress >= 100 ? 'bg-sky-400 border-sky-400' : progress > 0 ? 'bg-sky-500/30 border-sky-400' : 'bg-muted border-border'}`} />
              <div className="space-y-1">
                <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2">{entry?.content ?? ''}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-muted overflow-hidden max-w-[120px]">
                    <div className="h-full bg-sky-500/50 transition-all duration-700" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                  <span className="text-xs text-sky-400/70">{Math.round(progress)}%</span>
                  {entry?.timestamp && (
                    <span className="text-xs text-muted-foreground/40">{new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---- DOMAIN COMPARISON RADAR ----

function DomainComparison({ scores }: { scores: DomainScores }) {
  const domainKeys: DomainKey[] = ['health', 'finance', 'career', 'relationships', 'habits', 'goals']
  const labels = ['Health', 'Finance', 'Career', 'Relations', 'Habits', 'Goals']
  const cx = 90, cy = 90, maxR = 65
  const angleStep = (2 * Math.PI) / 6
  const startAngle = -Math.PI / 2

  const getPoint = (index: number, value: number) => {
    const angle = startAngle + index * angleStep
    return { x: cx + Math.cos(angle) * maxR * value, y: cy + Math.sin(angle) * maxR * value }
  }

  const values = domainKeys.map(k => (scores?.[k] ?? 0) / 100)
  const dataPoints = values.map((v, i) => getPoint(i, v))
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'
  const gridLevels = [0.25, 0.5, 0.75, 1]
  const colors = ['text-rose-400', 'text-emerald-400', 'text-indigo-400', 'text-pink-400', 'text-amber-400', 'text-sky-400']
  const strokeColors = ['hsl(0,65%,55%)', 'hsl(152,60%,50%)', 'hsl(240,60%,65%)', 'hsl(330,60%,60%)', 'hsl(40,70%,55%)', 'hsl(199,60%,50%)']

  return (
    <div className="bg-card border border-border p-6">
      <div className="flex items-center gap-3 mb-4">
        <RiCompassLine size={16} className="text-primary" />
        <span className="text-xs tracking-widest uppercase text-muted-foreground">Life Balance Radar</span>
      </div>
      <div className="flex justify-center">
        <svg width="180" height="180" viewBox="0 0 180 180">
          {gridLevels.map((level, gi) => {
            const pts = Array.from({ length: 6 }, (_, i) => getPoint(i, level))
            const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'
            return <path key={gi} d={path} fill="none" stroke="hsl(30, 5%, 18%)" strokeWidth="0.5" />
          })}
          {Array.from({ length: 6 }, (_, i) => {
            const outer = getPoint(i, 1)
            return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="hsl(30, 5%, 18%)" strokeWidth="0.5" />
          })}
          <path d={dataPath} fill="rgba(191,155,48,0.08)" stroke="hsl(40, 50%, 55%)" strokeWidth="1.5" className="transition-all duration-1000" />
          {dataPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill={strokeColors[i]} className="transition-all duration-700" />
          ))}
          {Array.from({ length: 6 }, (_, i) => {
            const lp = getPoint(i, 1.22)
            return <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fill="hsl(30, 8%, 55%)" fontSize="7" letterSpacing="1">{labels[i]}</text>
          })}
        </svg>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4">
        {domainKeys.map((k, i) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: strokeColors[i] }} />
            <span className="text-xs text-muted-foreground/60 tracking-wider capitalize">{k}</span>
            <span className="text-xs text-foreground ml-auto">{scores?.[k] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- WEEKLY PULSE ----

function WeeklyPulse({ entries }: { entries: Record<string, DomainEntry[]> }) {
  const domainKeys: DomainKey[] = ['health', 'finance', 'career', 'relationships', 'habits', 'goals']
  const strokeColors = ['hsl(0,65%,55%)', 'hsl(152,60%,50%)', 'hsl(240,60%,65%)', 'hsl(330,60%,60%)', 'hsl(40,70%,55%)', 'hsl(199,60%,50%)']

  const weekData = useMemo(() => {
    const result: { label: string; domains: number[] }[] = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dayStr = d.toISOString().split('T')[0]
      const domains = domainKeys.map(dk => {
        const arr = entries[dk]
        if (!Array.isArray(arr)) return 0
        return arr.filter(e => {
          try { return (e?.timestamp ?? '').split('T')[0] === dayStr } catch { return false }
        }).length
      })
      result.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2), domains })
    }
    return result
  }, [entries])

  const maxTotal = Math.max(...weekData.map(d => d.domains.reduce((a, b) => a + b, 0)), 1)

  return (
    <div className="bg-card border border-border p-6">
      <div className="flex items-center gap-3 mb-4">
        <RiBarChartLine size={16} className="text-primary" />
        <span className="text-xs tracking-widest uppercase text-muted-foreground">Weekly Activity Pulse</span>
      </div>
      <div className="flex items-end gap-3 h-24">
        {weekData.map((day, di) => {
          const total = day.domains.reduce((a, b) => a + b, 0)
          const barH = Math.max((total / maxTotal) * 80, 4)
          return (
            <div key={di} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full relative" style={{ height: `${barH}px`, animation: `fadeInUp 0.3s ease-out ${di * 0.05}s both` }}>
                {day.domains.map((count, ci) => {
                  if (count === 0) return null
                  const segH = total > 0 ? (count / total) * 100 : 0
                  return (
                    <div key={ci} className="w-full" style={{ height: `${segH}%`, backgroundColor: strokeColors[ci], opacity: 0.7 }} />
                  )
                })}
              </div>
              <span className="text-xs text-muted-foreground/40">{day.label}</span>
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4">
        {domainKeys.map((dk, i) => (
          <div key={dk} className="flex items-center gap-1.5">
            <div className="w-2 h-2" style={{ backgroundColor: strokeColors[i], opacity: 0.7 }} />
            <span className="text-xs text-muted-foreground/50 capitalize tracking-wider">{dk}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- DOMAIN STAT WIDGETS ----

function StatCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="stat-accent glass-card bg-card border border-border p-4 space-y-2 group hover:border-primary/15 transition-all duration-300 hover:shadow-lg hover:shadow-black/20">
      <div className="flex items-center gap-2">
        <span className={`${accent || 'text-primary/70'} group-hover:scale-110 transition-transform duration-300`}>{icon}</span>
        <span className="text-xs tracking-widest uppercase text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-serif font-light text-foreground" style={{ animation: 'numberCount 0.6s ease-out' }}>{value}</span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
    </div>
  )
}

// ---- ERROR BOUNDARY ----

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
            <h2 className="text-xl font-serif font-medium mb-2 tracking-wider">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-6 py-2 bg-primary text-primary-foreground text-sm tracking-wider rounded-none">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ---- MAIN PAGE ----

export default function Page() {
  // ---- STATE ----
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard')
  const [domainTab, setDomainTab] = useState<DomainTab>('overview')
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
  const [askInput, setAskInput] = useState('')
  const [showAskForm, setShowAskForm] = useState(false)
  const [askResponse, setAskResponse] = useState<string | null>(null)
  const [isLoadingAsk, setIsLoadingAsk] = useState(false)
  const [waterGlasses, setWaterGlasses] = useState<boolean[]>([false, false, false, false, false, false, false, false])
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)

  // ---- DERIVED DATA ----
  const currentInsight = sampleData ? SAMPLE_INSIGHT : insightData
  const currentEntries = sampleData ? SAMPLE_ENTRIES : domainEntries
  const currentChat = sampleData ? SAMPLE_CHAT : chatMessages

  // ---- PERSISTENCE ----
  useEffect(() => {
    try {
      const se = localStorage.getItem('lifeos_entries')
      if (se) { const p = JSON.parse(se); if (p && typeof p === 'object') setDomainEntries(p) }
      const si = localStorage.getItem('lifeos_insight')
      if (si) { const p = JSON.parse(si); if (p && typeof p === 'object') setInsightData(p) }
      const sc = localStorage.getItem('lifeos_chat')
      if (sc) { const p = JSON.parse(sc); if (Array.isArray(p)) setChatMessages(p) }
      const sw = localStorage.getItem('lifeos_water')
      if (sw) { const p = JSON.parse(sw); if (Array.isArray(p)) setWaterGlasses(p) }
    } catch { /* silently fail */ }
  }, [])

  useEffect(() => {
    if (!sampleData) { try { localStorage.setItem('lifeos_entries', JSON.stringify(domainEntries)) } catch {} }
  }, [domainEntries, sampleData])

  useEffect(() => {
    if (!sampleData && insightData) { try { localStorage.setItem('lifeos_insight', JSON.stringify(insightData)) } catch {} }
  }, [insightData, sampleData])

  useEffect(() => {
    if (!sampleData) { try { localStorage.setItem('lifeos_chat', JSON.stringify(chatMessages)) } catch {} }
  }, [chatMessages, sampleData])

  useEffect(() => {
    try { localStorage.setItem('lifeos_water', JSON.stringify(waterGlasses)) } catch {}
  }, [waterGlasses])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentChat, isLoadingChat])

  useEffect(() => {
    if (statusMessage) {
      const t = setTimeout(() => setStatusMessage(null), 4000)
      return () => clearTimeout(t)
    }
  }, [statusMessage])

  // ---- AGENT CALLS ----
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
    const allEntries = Object.entries(domainEntries).map(([domain, entries]) => {
      if (!Array.isArray(entries) || entries.length === 0) return `${domain}: No entries yet`
      return `${domain}:\n${entries.map(e => `- ${e?.content ?? ''}`).join('\n')}`
    }).join('\n\n')
    const hasAny = Object.values(domainEntries).some(arr => Array.isArray(arr) && arr.length > 0)
    const message = hasAny
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

  const handleAskDomain = useCallback(async (domain: DomainKey) => {
    if (sampleData || !askInput.trim()) return
    setIsLoadingAsk(true)
    setActiveAgentId(AGENT_IDS.tracker)
    setAskResponse(null)
    const message = `[Domain: ${domain}] [Query] ${askInput.trim()}`
    try {
      const result = await callAIAgent(message, AGENT_IDS.tracker)
      const data = parseAgentResponse(result)
      if (data) {
        const summary = typeof data?.summary === 'string' ? data.summary : ''
        const suggestions = Array.isArray(data?.suggestions) ? (data.suggestions as string[]) : []
        const combined = summary + (suggestions.length > 0 ? '\n\n**Suggestions:**\n' + suggestions.map(s => `- ${s}`).join('\n') : '')
        setAskResponse(combined || 'No specific insights available for this query.')
      } else {
        setAskResponse('Could not get a response. Please try again.')
      }
    } catch {
      setAskResponse('Failed to get a response. Please try again.')
    }
    setIsLoadingAsk(false)
    setActiveAgentId(null)
  }, [askInput, parseAgentResponse, sampleData])

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
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'I apologize, but I was unable to process your request. Please try again.', timestamp: new Date().toISOString() }])
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.', timestamp: new Date().toISOString() }])
    }
    setIsLoadingChat(false)
    setActiveAgentId(null)
  }, [chatInput, parseAgentResponse, sampleData])

  const handleDeleteEntry = useCallback((domain: DomainKey, index: number) => {
    setDomainEntries(prev => {
      const arr = Array.isArray(prev[domain]) ? [...prev[domain]] : []
      arr.splice(index, 1)
      return { ...prev, [domain]: arr }
    })
    setStatusMessage('Entry removed')
  }, [])

  const toggleWater = useCallback((i: number) => {
    setWaterGlasses(prev => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
  }, [])

  // ---- HELPERS ----
  const getDomainScore = (domain: DomainKey): number => currentInsight?.domain_scores?.[domain] ?? 0
  const getDomainEntries = useCallback((domain: DomainKey): DomainEntry[] => {
    const entries = currentEntries[domain]
    return Array.isArray(entries) ? entries : []
  }, [currentEntries])
  const getEntryCount = (domain: DomainKey): number => getDomainEntries(domain).length
  const getLastEntryDate = (domain: DomainKey): string => {
    const entries = getDomainEntries(domain)
    if (entries.length === 0) return 'No entries'
    const ts = entries[0]?.timestamp
    if (!ts) return '--'
    try { return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) } catch { return '--' }
  }
  const formatTime = (ts: string): string => {
    if (!ts) return ''
    try { return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) } catch { return '' }
  }
  const formatDate = (ts: string): string => {
    if (!ts) return ''
    try { return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) } catch { return '' }
  }

  const getMetricValue = (entries: DomainEntry[], metricName: string): string => {
    if (!Array.isArray(entries)) return '--'
    for (const e of entries) {
      if (!Array.isArray(e?.metrics)) continue
      const m = e.metrics.find(mt => mt?.name?.toLowerCase() === metricName.toLowerCase())
      if (m) return `${m.value ?? ''}${m.unit ? ` ${m.unit}` : ''}`
    }
    return '--'
  }

  const getSentimentCount = (entries: DomainEntry[], sent: string): number => {
    if (!Array.isArray(entries)) return 0
    return entries.filter(e => e?.sentiment === sent).length
  }

  const navItems: { key: ActiveSection; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <RiDashboardLine size={18} /> },
    ...DOMAINS,
  ]

  // ---- DOMAIN STATS RENDERERS ----

  function renderHealthStats(entries: DomainEntry[]) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<RiMoonLine size={16} />} label="Sleep" value={getMetricValue(entries, 'Sleep Duration')} accent="text-indigo-400" />
          <StatCard icon={<RiRunLine size={16} />} label="Activity" value={getMetricValue(entries, 'Distance')} accent="text-green-400" />
          <StatCard icon={<RiRestaurantLine size={16} />} label="Calories" value={getMetricValue(entries, 'Calories')} accent="text-orange-400" />
          <StatCard icon={<RiPulseLine size={16} />} label="Heart Rate" value={getMetricValue(entries, 'Heart Rate')} accent="text-rose-400" />
        </div>
        <MoodTimeline entries={entries} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SleepQualityGauge entries={entries} />
          <NutritionRadar entries={entries} />
        </div>
      </div>
    )
  }

  function renderFinanceStats(entries: DomainEntry[]) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<RiWalletLine size={16} />} label="Expenses" value={getMetricValue(entries, 'Over Budget')} accent="text-red-400" />
          <StatCard icon={<RiStockLine size={16} />} label="Returns" value={getMetricValue(entries, 'Return')} accent="text-emerald-400" />
          <StatCard icon={<RiBankLine size={16} />} label="Invested" value={getMetricValue(entries, 'Amount')} accent="text-sky-400" />
          <StatCard icon={<RiPercentLine size={16} />} label="Savings Rate" value={getMetricValue(entries, 'Savings Rate')} accent="text-primary" />
        </div>
        <BudgetMeter entries={entries} />
        <ExpenseCategoryGrid entries={entries} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SavingsGoalRing entries={entries} />
          <NetWorthTracker entries={entries} />
        </div>
      </div>
    )
  }

  function renderCareerStats(entries: DomainEntry[]) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<RiTrophyLine size={16} />} label="Achievements" value={String(entries.length)} accent="text-amber-400" />
          <StatCard icon={<RiBookLine size={16} />} label="Study Hours" value={getMetricValue(entries, 'Study Hours')} accent="text-indigo-400" />
          <StatCard icon={<RiTeamLine size={16} />} label="Networking" value={String(entries.filter(e => Array.isArray(e?.tags) && e.tags.some(t => typeof t === 'string' && t.includes('network'))).length)} accent="text-pink-400" />
          <StatCard icon={<RiRocketLine size={16} />} label="Progress" value={getMetricValue(entries, 'Progress')} accent="text-purple-400" />
        </div>
        <SkillsProgress entries={entries} />
        <CertificationTracker entries={entries} />
        <NetworkMap entries={entries} />
      </div>
    )
  }

  function renderRelationshipStats(entries: DomainEntry[]) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<RiGroupLine size={16} />} label="Interactions" value={String(entries.length)} accent="text-pink-400" />
          <StatCard icon={<RiHandHeartLine size={16} />} label="Quality Time" value={getMetricValue(entries, 'Duration')} accent="text-rose-400" />
          <StatCard icon={<RiPhoneLine size={16} />} label="Calls" value={String(entries.filter(e => Array.isArray(e?.tags) && e.tags.some(t => typeof t === 'string' && t.includes('call'))).length)} accent="text-purple-400" />
          <StatCard icon={<RiLeafLine size={16} />} label="Gratitude" value={String(getSentimentCount(entries, 'positive'))} accent="text-green-400" />
        </div>
        <InteractionHeatmap entries={entries} />
        <GratitudeWall entries={entries} />
        <RelationshipScoreBoard entries={entries} />
      </div>
    )
  }

  function renderHabitStats(entries: DomainEntry[]) {
    return (
      <div className="space-y-3">
        <StreakDisplay entries={entries} />
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<RiCheckDoubleLine size={16} />} label="Completed" value={String(getSentimentCount(entries, 'positive'))} accent="text-green-400" />
          <StatCard icon={<RiMedalLine size={16} />} label="Total Entries" value={String(entries.length)} accent="text-amber-400" />
        </div>
        <HabitCompletionWheel entries={entries} />
      </div>
    )
  }

  function renderGoalStats(entries: DomainEntry[]) {
    const avgProgress = (() => {
      if (!Array.isArray(entries) || entries.length === 0) return 0
      const pcts = entries.map(e => {
        if (!Array.isArray(e?.metrics)) return 0
        const pm = e.metrics.find(m => (m?.name ?? '').toLowerCase() === 'progress')
        return pm ? parseFloat(pm.value || '0') : 0
      })
      return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
    })()

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<RiFlagLine size={16} />} label="Active Goals" value={String(entries.length)} accent="text-sky-400" />
          <StatCard icon={<RiAwardLine size={16} />} label="Avg Progress" value={`${avgProgress}%`} accent="text-emerald-400" />
        </div>
        <GoalProgressCards entries={entries} />
        <GoalTimeline entries={entries} />
      </div>
    )
  }

  const DOMAIN_STATS_RENDERERS: Record<DomainKey, (entries: DomainEntry[]) => React.ReactNode> = {
    health: renderHealthStats,
    finance: renderFinanceStats,
    career: renderCareerStats,
    relationships: renderRelationshipStats,
    habits: renderHabitStats,
    goals: renderGoalStats,
  }

  // ---- DASHBOARD VIEW ----

  function DashboardView() {
    return (
      <div className="space-y-8 md:space-y-12">
        <div className="section-divider mb-4" />
        <div className="relative flex flex-col items-center">
          {/* Aurora background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-primary/8 via-amber-500/5 to-transparent blur-3xl" style={{ animation: 'auroraFlow 12s ease-in-out infinite' }} />
            <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-gradient-to-bl from-indigo-500/5 via-purple-500/3 to-transparent blur-3xl" style={{ animation: 'auroraFlow2 15s ease-in-out infinite' }} />
            <div className="absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full bg-gradient-to-tr from-rose-500/4 via-pink-500/3 to-transparent blur-3xl" style={{ animation: 'ambientFloat 20s ease-in-out infinite' }} />
          </div>
          <LifeOrb orbState={currentInsight?.orb_state} score={currentInsight?.overall_score} isLoading={isLoadingInsight} />
          <button onClick={handleGetInsights} disabled={isLoadingInsight || sampleData} className="relative mt-4 px-10 py-3 bg-primary text-primary-foreground text-xs font-light tracking-widest uppercase transition-all duration-500 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 rounded-none overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animation: 'subtleShine 4s ease-in-out infinite' }} />
            {isLoadingInsight ? (
              <><div className="w-4 h-4 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /><span>Analyzing Life Data</span></>
            ) : (
              <><RiSparklingLine size={16} /><span>Generate Life Insights</span></>
            )}
          </button>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs tracking-widest uppercase text-muted-foreground font-light">Life Domains</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {DOMAINS.map(({ key, label, icon, description }, domIdx) => {
              const score = getDomainScore(key)
              const entryCount = getEntryCount(key)
              const lastDate = getLastEntryDate(key)
              const entries = getDomainEntries(key)
              const colors = DOMAIN_COLORS[key]
              const latestContent = entries.length > 0 ? (entries[0]?.content ?? '').slice(0, 60) : ''
              return (
                <button key={key} onClick={() => { setActiveSection(key); setSidebarOpen(false); setDomainTab('overview'); setShowEntryForm(false); setAskResponse(null) }} className="group glass-card hover-lift bg-card border border-border p-6 text-left transition-all duration-500 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 relative overflow-hidden rounded-none" style={{ animation: `fadeInUp 0.4s ease-out ${domIdx * 0.08}s both` }}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/0 group-hover:via-primary/20 to-transparent transition-all duration-500" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`${colors.accent} opacity-60 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110`}>{icon}</span>
                          <h3 className="font-serif text-sm tracking-wider uppercase text-foreground">{label}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground/40 tracking-wider ml-8">{description}</p>
                      </div>
                      <ScoreRing score={score} size={48} strokeWidth={3} />
                    </div>
                    {latestContent ? (
                      <p className="text-xs text-muted-foreground/60 leading-relaxed mb-3 line-clamp-2 border-l border-primary/10 pl-3 ml-1">{latestContent}...</p>
                    ) : (
                      <p className="text-xs text-muted-foreground/30 leading-relaxed mb-3 italic ml-1">No entries yet -- start tracking</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><RiTimeLine size={11} />{lastDate}</span>
                      <span>{entryCount} {entryCount === 1 ? 'entry' : 'entries'}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground/30 group-hover:text-primary/70 transition-colors duration-300">
                      <span className="tracking-wider">Explore</span>
                      <RiArrowRightSLine size={14} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {currentInsight && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
            <DomainComparison scores={currentInsight.domain_scores} />
            <WeeklyPulse entries={currentEntries} />
          </div>
        )}

        {currentInsight && (
          <div className="bg-card border border-border" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
            <button onClick={() => setInsightExpanded(!insightExpanded)} className="w-full flex items-center justify-between p-6 text-left">
              <div className="flex items-center gap-3">
                <RiLightbulbLine size={18} className="text-primary" />
                <h3 className="font-serif text-sm tracking-wider uppercase">Life Insights</h3>
                {currentInsight.overall_score > 0 && (
                  <span className="text-xs text-primary/70 tracking-wider">{currentInsight.overall_score}/100</span>
                )}
              </div>
              {insightExpanded ? <RiArrowUpSLine size={20} className="text-muted-foreground" /> : <RiArrowDownSLine size={20} className="text-muted-foreground" />}
            </button>
            {insightExpanded && (
              <div className="px-6 pb-6 space-y-6" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                {currentInsight.summary && (
                  <div className="border-l-2 border-primary/30 pl-4">{renderMarkdown(currentInsight.summary)}</div>
                )}
                <div className="space-y-3">
                  <h4 className="text-xs tracking-widest uppercase text-muted-foreground">Domain Breakdown</h4>
                  {DOMAINS.map(({ key, label }) => {
                    const domScore = currentInsight?.domain_scores?.[key] ?? 0
                    const colors = DOMAIN_COLORS[key]
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className={`text-xs w-28 tracking-wider ${colors.accent}`}>{label}</span>
                        <div className="flex-1 h-2 bg-muted overflow-hidden rounded-none">
                          <div className="h-full bg-primary/70 transition-all duration-1000 ease-out" style={{ width: `${domScore}%` }} />
                        </div>
                        <span className="text-xs text-foreground w-8 text-right font-light">{domScore}</span>
                      </div>
                    )
                  })}
                </div>
                {Array.isArray(currentInsight.patterns) && currentInsight.patterns.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs tracking-widest uppercase text-muted-foreground">Patterns Identified</h4>
                    <ul className="space-y-2">
                      {currentInsight.patterns.map((pattern, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed" style={{ animation: `fadeInUp 0.3s ease-out ${i * 0.1}s both` }}>
                          <RiMindMap size={14} className="text-primary/50 mt-0.5 flex-shrink-0" />
                          <span>{typeof pattern === 'string' ? pattern : ''}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {Array.isArray(currentInsight.recommendations) && currentInsight.recommendations.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs tracking-widest uppercase text-muted-foreground flex items-center gap-2">
                      <RiFlashlightLine size={12} className="text-primary/50" />
                      Recommendations
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {currentInsight.recommendations.slice(0, 3).map((rec, i) => {
                        const domKey = (rec?.domain ?? '').toLowerCase() as DomainKey
                        const domColor = DOMAIN_COLORS[domKey]
                        return (
                          <div key={i} className={`glass-card hover-lift bg-secondary/50 border border-border p-5 space-y-3 relative overflow-hidden hover:border-primary/20 transition-all duration-500`} style={{ animation: `borderGlow 4s ease-in-out infinite ${i * 0.6}s` }}>
                            <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${domColor ? `from-transparent ${domColor.gradient.split(' ')[0].replace('from-', 'via-')}` : 'from-transparent via-primary/20'} to-transparent`} />
                            <div className="flex items-center justify-between">
                              <span className={`text-xs tracking-widest uppercase ${domColor?.accent ?? 'text-primary/70'}`}>{rec?.domain ?? ''}</span>
                              <span className={`text-xs px-2.5 py-0.5 tracking-wider uppercase ${rec?.priority === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/10' : 'bg-primary/10 text-primary border border-primary/10'}`}>{rec?.priority ?? ''}</span>
                            </div>
                            <h5 className="text-sm font-serif font-normal text-foreground tracking-wider">{rec?.title ?? ''}</h5>
                            <p className="text-xs text-muted-foreground leading-relaxed">{rec?.description ?? ''}</p>
                          </div>
                        )
                      })}
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

  // ---- DOMAIN DETAIL VIEW ----

  function DomainDetailView({ domain }: { domain: DomainKey }) {
    const domainConfig = DOMAINS.find(d => d.key === domain)
    const entries = getDomainEntries(domain)
    const score = getDomainScore(domain)
    const quickActions = DOMAIN_QUICK_ACTIONS[domain] || []
    const HeaderGraphic = DOMAIN_HEADERS[domain]

    return (
      <div className="space-y-0">
        <button onClick={() => { setActiveSection('dashboard'); setShowEntryForm(false); setAskResponse(null) }} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4 tracking-wider uppercase">
          <RiArrowLeftLine size={14} />
          <span>Back to Dashboard</span>
        </button>

        {HeaderGraphic()}

        <div className="flex items-center gap-1 mb-6 border-b border-border">
          {(['overview', 'log', 'ask'] as DomainTab[]).map(tab => (
            <button key={tab} onClick={() => { setDomainTab(tab); if (tab === 'ask') setShowAskForm(true) }} className={`px-5 py-3 text-xs tracking-widest uppercase transition-all duration-200 border-b-2 ${domainTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {tab}
            </button>
          ))}
        </div>

        {domainTab === 'overview' && (
          <div className="space-y-6" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, i) => (
                <button key={i} onClick={() => { setDomainTab('log'); setShowEntryForm(true); setEntryInput(action.prefix) }} className="flex items-center gap-2 px-4 py-2.5 bg-secondary/50 border border-border text-xs tracking-wider text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-200 rounded-none">
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 space-y-4">
                <h4 className="text-xs tracking-widest uppercase text-muted-foreground flex items-center gap-2">
                  <RiBarChartLine size={12} className={DOMAIN_COLORS[domain]?.accent ?? 'text-primary/50'} />
                  Stats & Metrics
                </h4>
                {DOMAIN_STATS_RENDERERS[domain](entries)}
                {domain === 'health' && <WaterTracker glasses={waterGlasses} onToggle={toggleWater} />}
                {domain === 'habits' && <HabitHeatGrid entries={entries} />}
              </div>
              <div className="lg:col-span-2 space-y-4">
                <h4 className="text-xs tracking-widest uppercase text-muted-foreground">Score</h4>
                <div className="glass-card bg-card border border-border p-8 flex flex-col items-center gap-4 relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-b ${DOMAIN_COLORS[domain]?.gradient ?? ''} opacity-30`} />
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <ScoreRing score={score} size={130} strokeWidth={5} />
                    <div className="text-center">
                      <p className="font-serif text-4xl tracking-wider text-foreground" style={{ animation: 'numberCount 0.6s ease-out' }}>{score}</p>
                      <p className={`text-xs tracking-widest uppercase mt-1 ${DOMAIN_COLORS[domain]?.accent ?? 'text-muted-foreground'}`}>{domainConfig?.label ?? domain}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground tracking-wider">Total Entries</span>
                    <span className="text-sm text-foreground font-light">{entries.length}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground tracking-wider">Latest</span>
                    <span className="text-sm text-foreground font-light">{getLastEntryDate(domain)}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground tracking-wider">Trend</span>
                    <div className="flex items-center gap-1">
                      {score >= 60 ? <RiArrowUpSLine size={16} className="text-green-400" /> : score >= 40 ? <span className="text-xs text-muted-foreground">--</span> : <RiArrowDownSLine size={16} className="text-red-400" />}
                      <span className="text-xs text-muted-foreground">{score >= 60 ? 'Improving' : score >= 40 ? 'Stable' : 'Needs attention'}</span>
                    </div>
                  </div>
                </div>
                {entries.length > 0 && (
                  <div className="bg-card border border-border p-5 space-y-3">
                    <h5 className="text-xs tracking-widest uppercase text-muted-foreground">Sentiment</h5>
                    {(['positive', 'neutral', 'negative'] as const).map(sent => {
                      const count = getSentimentCount(entries, sent)
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

            {entries.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs tracking-widest uppercase text-muted-foreground">Recent Entries</h4>
                {entries.slice(0, 3).map((entry, i) => (
                  <div key={i} className="bg-card border border-border p-4 flex items-start gap-3" style={{ animation: `fadeInUp 0.3s ease-out ${i * 0.05}s both` }}>
                    <div className={`w-1 self-stretch flex-shrink-0 ${entry?.sentiment === 'positive' ? 'bg-green-500/60' : entry?.sentiment === 'negative' ? 'bg-red-400/60' : 'bg-yellow-500/60'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground/90 leading-relaxed truncate">{entry?.content ?? ''}</p>
                      <span className="text-xs text-muted-foreground/50">{formatDate(entry?.timestamp ?? '')}</span>
                    </div>
                  </div>
                ))}
                <button onClick={() => setDomainTab('log')} className="text-xs text-primary/70 tracking-wider hover:text-primary transition-colors flex items-center gap-1">
                  <span>View all entries</span>
                  <RiArrowRightSLine size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {domainTab === 'log' && (
          <div className="space-y-6" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs tracking-widest uppercase text-muted-foreground">Entry Log</h3>
              <button onClick={() => setShowEntryForm(!showEntryForm)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs tracking-widest uppercase transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 rounded-none">
                <RiAddLine size={14} /><span>New Entry</span>
              </button>
            </div>

            {showEntryForm && (
              <div className="bg-card border border-border p-6 space-y-4" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                <h4 className="text-xs tracking-widest uppercase text-muted-foreground">New Entry</h4>
                <div className="flex flex-wrap gap-2 mb-2">
                  {quickActions.map((action, i) => (
                    <button key={i} onClick={() => setEntryInput(prev => prev.startsWith(action.prefix) ? prev : action.prefix + prev)} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/50 border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all rounded-none">
                      {action.icon}<span>{action.label}</span>
                    </button>
                  ))}
                </div>
                <textarea value={entryInput} onChange={(e) => setEntryInput(e.target.value)} placeholder={`What would you like to log in ${domainConfig?.label ?? domain}?`} className="w-full bg-secondary/30 border border-border p-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 resize-none leading-relaxed rounded-none" rows={4} disabled={sampleData} />
                <div className="flex items-center justify-end gap-3">
                  <button onClick={() => { setShowEntryForm(false); setEntryInput('') }} className="px-4 py-2 text-xs text-muted-foreground tracking-wider uppercase hover:text-foreground transition-colors">Cancel</button>
                  <button onClick={() => handleLogEntry(domain)} disabled={isLoadingTracker || !entryInput.trim() || sampleData} className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground text-xs tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 rounded-none">
                    {isLoadingTracker ? (<><div className="w-3 h-3 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /><span>Logging</span></>) : (<span>Save Entry</span>)}
                  </button>
                </div>
              </div>
            )}

            {entries.length === 0 ? (
              <div className="bg-card border border-border p-12 text-center">
                <RiBarChartLine size={36} className="text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No entries yet for {domainConfig?.label ?? domain}.</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Click &quot;New Entry&quot; to start tracking.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry, i) => (
                  <div key={i} className="bg-card border border-border overflow-hidden group hover-lift" style={{ animation: `fadeInUp 0.3s ease-out ${i * 0.05}s both` }}>
                    <div className="flex">
                      <div className={`w-1 flex-shrink-0 ${entry?.sentiment === 'positive' ? 'bg-green-500/60' : entry?.sentiment === 'negative' ? 'bg-red-400/60' : 'bg-yellow-500/60'}`} />
                      <div className="flex-1 p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <SentimentDot sentiment={entry?.sentiment ?? 'neutral'} />
                            <span className="text-xs text-muted-foreground tracking-wider">{formatDate(entry?.timestamp ?? '')}</span>
                            <span className="text-xs text-muted-foreground/40">{formatTime(entry?.timestamp ?? '')}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setExpandedEntry(expandedEntry === i ? null : i)} className="p-1.5 text-muted-foreground/40 hover:text-foreground transition-colors">
                              <RiEyeLine size={14} />
                            </button>
                            {!sampleData && (
                              <button onClick={() => handleDeleteEntry(domain, i)} className="p-1.5 text-muted-foreground/40 hover:text-red-400 transition-colors">
                                <RiDeleteBinLine size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-foreground/90 leading-relaxed">{entry?.content ?? ''}</p>
                        {Array.isArray(entry?.tags) && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {entry.tags.map((tag, j) => (
                              <span key={j} className="flex items-center gap-1 text-xs px-2 py-0.5 bg-secondary text-secondary-foreground tracking-wider rounded-none">
                                <RiHashtag size={10} className="text-muted-foreground/40" />
                                {typeof tag === 'string' ? tag : ''}
                              </span>
                            ))}
                          </div>
                        )}
                        {Array.isArray(entry?.metrics) && entry.metrics.length > 0 && (
                          <div className="flex flex-wrap gap-3 pt-1">
                            {entry.metrics.map((metric, j) => (
                              <div key={j} className="bg-secondary/50 px-3 py-1.5 flex items-center gap-1.5 rounded-none">
                                <span className="text-xs text-muted-foreground tracking-wider">{metric?.name ?? ''}</span>
                                <span className="text-xs text-primary font-medium">{metric?.value ?? ''}</span>
                                <span className="text-xs text-muted-foreground/50">{metric?.unit ?? ''}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {expandedEntry === i && (
                          <div className="space-y-2 pt-2 border-t border-border/50" style={{ animation: 'fadeInUp 0.2s ease-out' }}>
                            {entry?.summary && (
                              <div className="border-l-2 border-primary/20 pl-3">
                                <p className="text-xs text-muted-foreground italic leading-relaxed">{entry.summary}</p>
                              </div>
                            )}
                            {Array.isArray(entry?.suggestions) && entry.suggestions.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {entry.suggestions.map((sug, j) => (
                                  <span key={j} className="flex items-center gap-1 text-xs text-primary/70">
                                    <RiLightbulbLine size={10} />
                                    {typeof sug === 'string' ? sug : ''}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {domainTab === 'ask' && (
          <div className="space-y-6" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div className="bg-card border border-border p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <RiQuestionLine size={16} className="text-primary" />
                <h4 className="text-xs tracking-widest uppercase text-muted-foreground">Ask about {domainConfig?.label ?? domain}</h4>
              </div>
              <p className="text-xs text-muted-foreground/60 leading-relaxed">Ask questions about your {domainConfig?.label?.toLowerCase() ?? domain} data, get personalized advice, or request analysis of your patterns.</p>
              <div className="flex gap-2">
                <input type="text" value={askInput} onChange={(e) => setAskInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAskDomain(domain) } }} placeholder={`E.g., "How is my ${domainConfig?.label?.toLowerCase() ?? domain} trending?"`} className="flex-1 bg-secondary/30 border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 rounded-none" disabled={sampleData || isLoadingAsk} />
                <button onClick={() => handleAskDomain(domain)} disabled={!askInput.trim() || isLoadingAsk || sampleData} className="px-5 py-2.5 bg-primary text-primary-foreground text-xs tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-none">
                  {isLoadingAsk ? <div className="w-4 h-4 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <RiSendPlaneFill size={14} />}
                </button>
              </div>
            </div>
            {askResponse && (
              <div className="bg-card border border-border p-6" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                <div className="flex items-center gap-2 mb-3">
                  <RiSparklingLine size={14} className="text-primary" />
                  <span className="text-xs tracking-widest uppercase text-muted-foreground">Response</span>
                </div>
                <div className="border-l-2 border-primary/30 pl-4">
                  {renderMarkdown(askResponse)}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <span className="text-xs tracking-widest uppercase text-muted-foreground">Suggested Questions</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  `What are my ${domainConfig?.label?.toLowerCase() ?? domain} trends?`,
                  `How can I improve my ${domainConfig?.label?.toLowerCase() ?? domain}?`,
                  `Summarize my recent ${domainConfig?.label?.toLowerCase() ?? domain} activity`,
                  `What patterns do you see in my ${domainConfig?.label?.toLowerCase() ?? domain} data?`,
                ].map((q, i) => (
                  <button key={i} onClick={() => { setAskInput(q); handleAskDomain(domain) }} disabled={sampleData || isLoadingAsk} className="text-left p-3 bg-secondary/30 border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all disabled:opacity-50 rounded-none">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ---- CHAT PROMPTS ----
  const suggestedPrompts = [
    'What should I focus on this week?',
    'Create a morning routine for me',
    'How can I improve my relationships?',
    'Help me set SMART goals',
  ]

  // ---- RENDER ----

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex relative">
        {/* Ambient background particles */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[15%] left-[10%] w-64 h-64 rounded-full bg-primary/[0.02] blur-3xl" style={{ animation: 'ambientFloat 25s ease-in-out infinite' }} />
          <div className="absolute top-[60%] right-[15%] w-48 h-48 rounded-full bg-indigo-500/[0.015] blur-3xl" style={{ animation: 'ambientFloat 30s ease-in-out infinite 5s' }} />
          <div className="absolute bottom-[20%] left-[30%] w-56 h-56 rounded-full bg-rose-500/[0.01] blur-3xl" style={{ animation: 'ambientFloat 35s ease-in-out infinite 10s' }} />
        </div>
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 flex-shrink-0 flex flex-col border-r border-border/80 transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ background: 'linear-gradient(180deg, hsl(30, 7%, 7%) 0%, hsl(30, 6%, 5%) 100%)' }}>
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h1 className="font-serif text-xl tracking-widest text-foreground">
                <span className="text-primary">Life</span>OS
              </h1>
              <button className="md:hidden p-1 text-muted-foreground" onClick={() => setSidebarOpen(false)}>
                <RiCloseLine size={20} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground/40 tracking-widest mt-1 uppercase">Personal Operating System</p>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />

          <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
            {navItems.map(({ key, label, icon }) => {
              const isActive = activeSection === key
              const domainColor = key !== 'dashboard' ? DOMAIN_COLORS[key as DomainKey] : null
              return (
                <button key={key} onClick={() => { setActiveSection(key); setSidebarOpen(false); setShowEntryForm(false); setDomainTab('overview'); setAskResponse(null) }} className={`w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wider transition-all duration-200 rounded-none ${isActive ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30 border-l-2 border-transparent'}`}>
                  <span className={isActive && domainColor ? domainColor.accent : ''}>{icon}</span>
                  <span className="font-light">{label}</span>
                  {key !== 'dashboard' && getEntryCount(key as DomainKey) > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground/40">{getEntryCount(key as DomainKey)}</span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="p-4 border-t border-border space-y-2">
            <p className="text-xs tracking-widest uppercase text-muted-foreground/40 mb-2">System</p>
            {[
              { id: AGENT_IDS.insight, name: 'Insight Engine', desc: 'Analysis' },
              { id: AGENT_IDS.coach, name: 'Life Coach', desc: 'Guidance' },
              { id: AGENT_IDS.tracker, name: 'Domain Tracker', desc: 'Logging' },
            ].map(agent => (
              <div key={agent.id} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full transition-all ${activeAgentId === agent.id ? 'bg-green-400' : 'bg-muted-foreground/20'}`} style={activeAgentId === agent.id ? { animation: 'glowPulse 1.5s ease-in-out infinite' } : {}} />
                <span className="text-xs text-muted-foreground/70">{agent.name}</span>
                <span className="text-xs text-muted-foreground/30 ml-auto">{agent.desc}</span>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/80 px-4 md:px-8 py-4 flex items-center justify-between shadow-sm shadow-black/10">
            <div className="flex items-center gap-3">
              <button className="md:hidden p-1.5 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setSidebarOpen(true)}>
                <RiMenuLine size={20} />
              </button>
              <div className="flex items-center gap-3">
                <h2 className="font-serif text-sm tracking-widest uppercase text-foreground">
                  {activeSection === 'dashboard' ? 'Command Center' : (DOMAINS.find(d => d.key === activeSection)?.label ?? activeSection)}
                </h2>
                {activeSection !== 'dashboard' && (
                  <div className={`w-1.5 h-1.5 rounded-full ${DOMAIN_COLORS[activeSection as DomainKey]?.accent?.replace('text-', 'bg-') ?? 'bg-primary'}`} />
                )}
              </div>
              {activeAgentId && (
                <span className="text-xs text-primary/60 tracking-wider flex items-center gap-2 ml-2 bg-primary/5 px-3 py-1 border border-primary/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" style={{ animation: 'glowPulse 1.5s ease-in-out infinite' }} />
                  <span>Processing</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground/50 tracking-widest uppercase hidden sm:inline">Demo</span>
              <button onClick={() => setSampleData(!sampleData)} className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${sampleData ? 'bg-primary' : 'bg-muted'}`} aria-label="Toggle sample data">
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all duration-300 ${sampleData ? 'translate-x-5' : 'translate-x-0'}`} style={{ backgroundColor: sampleData ? 'hsl(30, 8%, 6%)' : 'hsl(30, 8%, 55%)' }} />
              </button>
            </div>
          </header>

          {statusMessage && (
            <div className="mx-4 md:mx-8 mt-3 px-4 py-2.5 bg-primary/10 border border-primary/20 text-xs text-primary tracking-wider flex items-center gap-2" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
              <RiCheckLine size={14} />
              {statusMessage}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {activeSection === 'dashboard' ? (
              <DashboardView />
            ) : (
              <DomainDetailView domain={activeSection} />
            )}
          </div>
        </main>

        <button onClick={() => setChatOpen(true)} className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/50 hover:scale-110 rounded-full group" style={{ background: 'linear-gradient(135deg, hsl(40, 55%, 60%) 0%, hsl(40, 50%, 50%) 100%)' }} aria-label="Open Life Coach Chat">
          <RiChat3Line size={22} className="group-hover:scale-110 transition-transform duration-300" />
          <div className="absolute inset-0 rounded-full bg-primary/20" style={{ animation: 'dotPing 3s ease-out infinite' }} />
        </button>

        {chatOpen && (
          <div className="fixed inset-0 bg-black/40 z-40 md:bg-black/20" onClick={() => setChatOpen(false)} />
        )}

        <div className={`fixed top-0 right-0 h-full w-full md:w-[420px] bg-card/95 backdrop-blur-xl border-l border-border z-50 flex flex-col transition-transform duration-300 ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0 relative">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center" style={{ boxShadow: '0 0 12px rgba(191,155,48,0.15)' }}>
                <div className="w-4 h-4 rounded-full bg-primary/60" style={{ animation: 'orbPulse 2s ease-in-out infinite' }} />
              </div>
              <div>
                <h3 className="font-serif text-sm tracking-wider uppercase">Life Coach</h3>
                <span className="text-xs text-muted-foreground/50">AI-powered guidance</span>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <RiCloseLine size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentChat.length === 0 && !isLoadingChat ? (
              <div className="flex flex-col items-center justify-center h-full space-y-8 px-4">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <RiSparklingLine size={24} className="text-primary/50" />
                  </div>
                  <p className="font-serif text-lg tracking-wider text-foreground">Life Coach</p>
                  <p className="text-sm text-muted-foreground/60 leading-relaxed max-w-xs">Your AI companion for personal growth, goal setting, and life optimization.</p>
                </div>
                <div className="space-y-2 w-full">
                  {suggestedPrompts.map((prompt, i) => (
                    <button key={i} onClick={() => handleSendChat(prompt)} disabled={sampleData} className="w-full text-left p-3.5 bg-secondary/30 border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all duration-200 disabled:opacity-50 rounded-none flex items-center gap-3">
                      <RiArrowRightSLine size={14} className="text-primary/40 flex-shrink-0" />
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {currentChat.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`} style={{ animation: `fadeInUp 0.3s ease-out` }}>
                    <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/30 border border-border border-l-2 border-l-primary/30'} p-4 rounded-none`}>
                      {msg.role === 'assistant' ? renderMarkdown(msg.content ?? '') : (
                        <p className="text-sm text-foreground leading-relaxed">{msg.content ?? ''}</p>
                      )}
                      {Array.isArray(msg?.action_items) && msg.action_items.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-border/50 mt-2">
                          <p className="text-xs tracking-widest uppercase text-muted-foreground">Action Items</p>
                          {msg.action_items.map((item, j) => (
                            <div key={j} className="flex items-start gap-2 text-xs bg-secondary/30 p-2 rounded-none">
                              <RiCheckDoubleLine size={12} className="text-primary mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="text-foreground/90">{item?.task ?? ''}</span>
                                {item?.timeframe && <span className="text-muted-foreground/50 ml-1">-- {item.timeframe}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {Array.isArray(msg?.suggested_followups) && msg.suggested_followups.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {msg.suggested_followups.map((followup, j) => (
                            <button key={j} onClick={() => handleSendChat(typeof followup === 'string' ? followup : '')} disabled={sampleData} className="text-xs px-2.5 py-1.5 bg-primary/10 text-primary/80 border border-primary/20 hover:bg-primary/20 transition-colors disabled:opacity-50 rounded-none flex items-center gap-1">
                              <RiArrowRightSLine size={10} />
                              {typeof followup === 'string' ? followup : ''}
                            </button>
                          ))}
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground/30 block mt-1">{formatTime(msg?.timestamp ?? '')}</span>
                    </div>
                  </div>
                ))}
                {isLoadingChat && (
                  <div className="flex justify-start">
                    <div className="bg-secondary/30 border border-border p-2 rounded-none"><TypingIndicator /></div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          <div className="p-4 border-t border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat() } }} placeholder="Ask your life coach..." className="flex-1 bg-secondary/30 border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 rounded-none" disabled={sampleData || isLoadingChat} />
              <button onClick={() => handleSendChat()} disabled={!chatInput.trim() || isLoadingChat || sampleData} className="p-2.5 bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 rounded-none">
                <RiSendPlaneFill size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageErrorBoundary>
  )
}
