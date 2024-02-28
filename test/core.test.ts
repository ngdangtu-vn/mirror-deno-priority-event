import { assertEquals } from 'test'
import PriorityEvent, { type Listener } from 'core'

declare global {
   interface PriorityEventMap {
      'deno/load': Event
      'deno/beforeunload': Event
      'deno/unload': Event
      'deno/unhandledrejection': PromiseRejectionEvent
      'deno/rejectionhandled': PromiseRejectionEvent
      'void-event': unknown
      'filter-event': (a: number) => `#${string}`
      'test-listener': unknown
   }
}

function f404() {}

Deno.test('[class] PriorityEvent', async (t) => {
   const e = PriorityEvent.init()

   await t.step('must have only 1 instance!', () => {
      const newinstance = PriorityEvent.init()
      assertEquals<PriorityEvent>(e, newinstance)
   })

   await t.step('add 5 events (each has 1 listener)', () => {
      e.addListener('deno/load', f404)
      e.addListener('deno/beforeunload', f404)
      e.addListener('deno/unload', f404)
      e.addListener('deno/unhandledrejection', f404)
      e.addListener('deno/rejectionhandled', f404)

      const all = e.lsEvents()
      assertEquals<number>(all.length, 5)
      assertEquals<(keyof PriorityEventMap)[]>(all, [
         'deno/load',
         'deno/beforeunload',
         'deno/unload',
         'deno/unhandledrejection',
         'deno/rejectionhandled',
      ])
   })

   await t.step('remove 5 events', () => {
      e.rmListener('deno/load', f404)
      e.rmListener('deno/beforeunload', f404)
      e.rmListener('deno/unload', f404)
      e.rmListener('deno/unhandledrejection', f404)
      e.rmListener('deno/rejectionhandled', f404)

      assertEquals<number>(e.lsEvents().length, 0)
   })

   await t.step('add 5 listeners to "void-event" event with different priority', () => {
      e.addListener('void-event', f404, 9999)
      e.addListener('void-event', f404, 0)
      e.addListener('void-event', f404, 9)
      e.addListener('void-event', f404, 11)
      e.addListener('void-event', f404, 100)

      const all = e.lsListeners('void-event')
      assertEquals<number | undefined>(all?.length, 5)
      assertEquals<[number, Listener][] | null>(
         all,
         [
            [9999, f404],
            [0, f404],
            [9, f404],
            [11, f404],
            [100, f404],
         ],
         'expect the order of the listener list not change from the input',
      )
   })

   await t.step('listen "void-event" event after add all listerners', () => {
      e.listenSync('void-event', undefined)
      assertEquals<[number, Listener][] | null>(
         e.lsListeners('void-event'),
         [
            [0, f404],
            [9, f404],
            [11, f404],
            [100, f404],
            [9999, f404],
         ],
         'expect the listener list to get reordering by priority from 0 → n',
      )
   })

   await t.step('listen "filter-event" event to receive new value', () => {
      e.addListener('filter-event', (n) => `#${n.toString(16).toUpperCase()}`)
      const hex = e.listenSync('filter-event', 0x77DD77)!
      assertEquals(hex as unknown as string, '#77DD77')
   })
})

Deno.test('[function] Listener', async (t) => {
   const e = PriorityEvent.init()

   await t.step('add anonymous arrow syntax', () => {
      const expect = {
         name: '',
         priority: 8,
         emitter: e,
         event: 'test-listener',
      }
      e.addListener('test-listener', () => assertEquals(this, expect), 8)
   })

   await t.step('add anonymous tranditional syntax', () => {
      const expect = {
         name: '',
         priority: 9,
         emitter: e,
         event: 'test-listener',
      }
      e.addListener('test-listener', function () {
         assertEquals(this, expect)
      }, 9)
   })

   await t.step('add "test" function', () => {
      const expect = {
         name: 'test',
         priority: 10,
         emitter: e,
         event: 'test-listener',
      }
      e.addListener('test-listener', function test() {
         assertEquals(this, expect)
      })
   })
})
