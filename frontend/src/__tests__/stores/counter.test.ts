import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCounterStore } from '@/stores/counter'

describe('useCounterStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with count at 0', () => {
    const store = useCounterStore()
    expect(store.count).toBe(0)
  })

  it('doubleCount is 0 when count is 0', () => {
    const store = useCounterStore()
    expect(store.doubleCount).toBe(0)
  })

  it('increment increases count by 1', () => {
    const store = useCounterStore()
    store.increment()
    expect(store.count).toBe(1)
  })

  it('doubleCount reflects count * 2', () => {
    const store = useCounterStore()
    store.increment()
    store.increment()
    store.increment()
    expect(store.doubleCount).toBe(6)
  })

  it('multiple increments accumulate', () => {
    const store = useCounterStore()
    for (let i = 0; i < 10; i++) {
      store.increment()
    }
    expect(store.count).toBe(10)
    expect(store.doubleCount).toBe(20)
  })

  it('store exposes count, doubleCount and increment', () => {
    const store = useCounterStore()
    expect(typeof store.count).toBe('number')
    expect(typeof store.doubleCount).toBe('number')
    expect(typeof store.increment).toBe('function')
  })

  it('each store instance shares the same reactive state within the same Pinia', () => {
    const store1 = useCounterStore()
    const store2 = useCounterStore()
    store1.increment()
    expect(store2.count).toBe(1)
  })

  it('different Pinia instances have isolated state', () => {
    const pinia1 = createPinia()
    const pinia2 = createPinia()
    setActivePinia(pinia1)
    const store1 = useCounterStore()
    setActivePinia(pinia2)
    const store2 = useCounterStore()
    store1.increment()
    expect(store2.count).toBe(0)
  })
})
