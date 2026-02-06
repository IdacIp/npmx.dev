import { describe, expect, it, vi } from 'vitest'

// Mock the npm API import that useCharts.ts depends on (~/utils/npm/api)
// We only test the pure exported functions, not the composable's fetch logic.
vi.mock('~/utils/npm/api', () => ({
  fetchNpmDownloadsRange: vi.fn(),
}))

import {
  buildDailyEvolutionFromDaily,
  buildRollingWeeklyEvolutionFromDaily,
  buildMonthlyEvolutionFromDaily,
  buildYearlyEvolutionFromDaily,
  getNpmPackageCreationDate,
} from '../../../../app/composables/useCharts'

// ── buildDailyEvolutionFromDaily ────────────────────────────────────

describe('buildDailyEvolutionFromDaily', () => {
  it('adds timestamps and preserves download counts', () => {
    const result = buildDailyEvolutionFromDaily([
      { day: '2025-03-01', downloads: 10 },
      { day: '2025-03-02', downloads: 20 },
    ])

    expect(result).toEqual([
      { day: '2025-03-01', downloads: 10, timestamp: Date.UTC(2025, 2, 1) },
      { day: '2025-03-02', downloads: 20, timestamp: Date.UTC(2025, 2, 2) },
    ])
  })

  it('sorts by day', () => {
    const result = buildDailyEvolutionFromDaily([
      { day: '2025-03-03', downloads: 3 },
      { day: '2025-03-01', downloads: 1 },
      { day: '2025-03-02', downloads: 2 },
    ])

    expect(result.map(r => r.day)).toEqual(['2025-03-01', '2025-03-02', '2025-03-03'])
  })

  it('returns empty array for empty input', () => {
    expect(buildDailyEvolutionFromDaily([])).toEqual([])
  })
})

// ── buildRollingWeeklyEvolutionFromDaily ─────────────────────────────

describe('buildRollingWeeklyEvolutionFromDaily', () => {
  it('groups daily data into rolling 7-day buckets', () => {
    const daily = Array.from({ length: 14 }, (_, i) => ({
      day: `2025-03-${String(i + 1).padStart(2, '0')}`,
      downloads: 10,
    }))

    const result = buildRollingWeeklyEvolutionFromDaily(daily, '2025-03-01', '2025-03-14')

    expect(result).toHaveLength(2)
    expect(result[0]!.downloads).toBe(70)
    expect(result[0]!.weekStart).toBe('2025-03-01')
    expect(result[0]!.weekEnd).toBe('2025-03-07')
    expect(result[1]!.downloads).toBe(70)
    expect(result[1]!.weekStart).toBe('2025-03-08')
    expect(result[1]!.weekEnd).toBe('2025-03-14')
  })

  it('clamps last week to range end date', () => {
    const daily = [
      { day: '2025-03-01', downloads: 5 },
      { day: '2025-03-02', downloads: 5 },
      { day: '2025-03-08', downloads: 10 },
    ]

    const result = buildRollingWeeklyEvolutionFromDaily(daily, '2025-03-01', '2025-03-09')

    // Last week bucket should be clamped to end date
    const lastWeek = result[result.length - 1]!
    expect(lastWeek.weekEnd).toBe('2025-03-09')
  })

  it('returns empty array for empty input', () => {
    expect(buildRollingWeeklyEvolutionFromDaily([], '2025-03-01', '2025-03-14')).toEqual([])
  })
})

// ── buildMonthlyEvolutionFromDaily ──────────────────────────────────

describe('buildMonthlyEvolutionFromDaily', () => {
  it('aggregates daily data by month', () => {
    const result = buildMonthlyEvolutionFromDaily([
      { day: '2025-01-15', downloads: 10 },
      { day: '2025-01-20', downloads: 5 },
      { day: '2025-02-10', downloads: 20 },
    ])

    expect(result).toEqual([
      { month: '2025-01', downloads: 15, timestamp: Date.UTC(2025, 0, 1) },
      { month: '2025-02', downloads: 20, timestamp: Date.UTC(2025, 1, 1) },
    ])
  })

  it('sorts by month', () => {
    const result = buildMonthlyEvolutionFromDaily([
      { day: '2025-03-01', downloads: 1 },
      { day: '2025-01-01', downloads: 1 },
      { day: '2025-02-01', downloads: 1 },
    ])

    expect(result.map(r => r.month)).toEqual(['2025-01', '2025-02', '2025-03'])
  })

  it('returns empty array for empty input', () => {
    expect(buildMonthlyEvolutionFromDaily([])).toEqual([])
  })
})

// ── buildYearlyEvolutionFromDaily ───────────────────────────────────

describe('buildYearlyEvolutionFromDaily', () => {
  it('aggregates daily data by year', () => {
    const result = buildYearlyEvolutionFromDaily([
      { day: '2024-06-15', downloads: 100 },
      { day: '2024-12-01', downloads: 50 },
      { day: '2025-03-01', downloads: 200 },
    ])

    expect(result).toEqual([
      { year: '2024', downloads: 150, timestamp: Date.UTC(2024, 0, 1) },
      { year: '2025', downloads: 200, timestamp: Date.UTC(2025, 0, 1) },
    ])
  })

  it('returns empty array for empty input', () => {
    expect(buildYearlyEvolutionFromDaily([])).toEqual([])
  })
})

// ── getNpmPackageCreationDate ───────────────────────────────────────

describe('getNpmPackageCreationDate', () => {
  it('returns created date from packument time', () => {
    const result = getNpmPackageCreationDate({
      time: {
        'created': '2020-01-15T10:00:00.000Z',
        'modified': '2025-01-01T00:00:00.000Z',
        '1.0.0': '2020-01-15T10:00:00.000Z',
      },
    })

    expect(result).toBe('2020-01-15T10:00:00.000Z')
  })

  it('returns earliest version date when created is missing', () => {
    const result = getNpmPackageCreationDate({
      time: {
        'modified': '2025-01-01T00:00:00.000Z',
        '1.0.0': '2020-06-01T00:00:00.000Z',
        '2.0.0': '2021-01-01T00:00:00.000Z',
      },
    })

    expect(result).toBe('2020-06-01T00:00:00.000Z')
  })

  it('returns null when time is missing', () => {
    expect(getNpmPackageCreationDate({})).toBeNull()
  })
})
