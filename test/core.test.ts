import { assert, assertEquals } from 'test'
import PriorityEvent, { type Listener } from 'core'

declare global {
   interface PriorityEventMap {
      'deno/load': Event
      'deno/beforeunload': Event
      'deno/unload': Event
      'deno/unhandledrejection': PromiseRejectionEvent
      'deno/rejectionhandled': PromiseRejectionEvent
      'core/void-event': unknown
      'core/filter-event': (a: number) => `#${string}`
      'core/test-listener': (a: unknown) => void
   }
}

function f404() {}

const e = PriorityEvent.init()

Deno.test('[class] PriorityEvent', async (t) => {
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

      const actual = e.lsEvents()
      assertEquals<number>(actual.length, 5)
      assertEquals<(keyof PriorityEventMap)[]>(actual, [
         'deno/load',
         'deno/beforeunload',
         'deno/unload',
         'deno/unhandledrejection',
         'deno/rejectionhandled',
      ])
   })

   await t.step('remove the listener of 5 events', () => {
      e.rmListener('deno/load', f404)
      e.rmListener('deno/beforeunload', f404)
      e.rmListener('deno/unload', f404)
      e.rmListener('deno/unhandledrejection', f404)
      e.rmListener('deno/rejectionhandled', f404)

      assertEquals<number>(e.lsEvents().length, 0)
   })

   await t.step('add 5 listeners to "core/void-event" event with different priority', () => {
      e.addListener('core/void-event', f404, 9999)
      e.addListener('core/void-event', f404, 0)
      e.addListener('core/void-event', f404, 9)
      e.addListener('core/void-event', f404, 11)
      e.addListener('core/void-event', f404, 100)

      const actual = e.lsListeners('core/void-event')
      assertEquals<number | undefined>(actual?.length, 5)
      assertEquals<[number, Listener][] | null>(
         actual,
         [
            [9999, f404],
            [0, f404],
            [9, f404],
            [11, f404],
            [100, f404],
         ],
         'expect the listener list stays unsorted',
      )
   })

   await t.step('emit "core/void-event"', () => {
      e.emitSync('core/void-event', undefined)
      assertEquals<[number, Listener][] | null>(
         e.lsListeners('core/void-event'),
         [
            [0, f404],
            [9, f404],
            [11, f404],
            [100, f404],
            [9999, f404],
         ],
         'expect the listener list to get sorted by priority from 0 → n',
      )
   })

   await t.step('listen "core/filter-event" event to receive new value', () => {
      e.addListener('core/filter-event', (n) => `#${n.toString(16).toUpperCase()}`)
      const hex = e.emitSync('core/filter-event', 0x77DD77)!
      assertEquals(hex as unknown as string, '#77DD77')
   })
})

Deno.test('[function] Listener', async (t) => {
   await t.step('add anonymous arrow syntax', () => {
      e.addListener('core/test-listener', () => assertEquals(this, undefined), 8)
   })

   await t.step('add anonymous tranditional syntax', () => {
      const expect = {
         name: '',
         priority: 9,
         emitter: e,
         event: 'core/test-listener',
      }
      e.addListener('core/test-listener', function () {
         assertEquals(this, expect)
      }, 9)
   })

   await t.step('add "test" function', () => {
      const expect = {
         name: 'test',
         priority: 10,
         emitter: e,
         event: 'core/test-listener',
      }
      e.addListener('core/test-listener', function test() {
         assertEquals(this, expect)
      })
   })

   await t.step('checking the input argument', () => {
      const expect = {
         name: 'test',
         priority: 0,
         emitter: e,
         event: 'core/test-listener',
      }

      e.addListener('core/test-listener', function test(arg) {
         assertEquals(this, expect)
         assert(
            typeof arg === 'number',
            'The argument from listen() function is 0xFFF, expect number type.',
         )
         assertEquals(arg, 4095)
         assertEquals(arg.toString(16).toLowerCase(), 'fff')
      }, 0)

      e.emit('core/test-listener', 0xFFF)
   })
})
