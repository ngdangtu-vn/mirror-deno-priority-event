import { assertEquals } from 'test'
import PriorityEvent, { apply, applySync, filter, filterSync, type Listener, off, on } from 'core'

declare global {
   interface PriorityEventMap {
      'helper/on': () => void
      'helper/off': unknown
      'helper/apply': unknown
      'helper/filter': (a: number) => `#${string}`
   }
}

function f404() {}

const e = PriorityEvent.init()

Deno.test('[listener] on', async (t) => {
   on('helper/on', f404)
   on('helper/on', f404, 1)
   on('helper/on', f404, 2)
   on('helper/on', f404, 3)
   on('helper/on', f404, 11)

   await t.step('before the event is emitted', () => {
      const actual = e.lsListeners('helper/on')
      const expect: [number, Listener][] = [
         [10, f404],
         [1, f404],
         [2, f404],
         [3, f404],
         [11, f404],
      ]
      assertEquals<number>(
         actual?.length || 0,
         expect.length,
         'expect 5 listeners',
      )
      assertEquals<[number, Listener][] | null>(
         actual,
         expect,
         'expect unsorted order (as input)',
      )
   })

   await t.step('after the event is emitted', () => {
      apply('helper/on', undefined)
      assertEquals<[number, Listener][] | null>(
         e.lsListeners('helper/on'),
         [
            [1, f404],
            [2, f404],
            [3, f404],
            [10, f404],
            [11, f404],
         ],
         'expect sorted order',
      )
   })
})

Deno.test('[listener] off', async (t) => {
   on('helper/off', f404)
   on('helper/off', f404, 1)
   on('helper/off', f404, 2)
   on('helper/off', f404, 3)
   on('helper/off', f404, 11)

   await t.step('add 5 listeners', () => {
      assertEquals(
         e.lsListeners('helper/off'),
         [
            [10, f404],
            [1, f404],
            [2, f404],
            [3, f404],
            [11, f404],
         ],
         'expect 5 listeners',
      )
   })

   off('helper/off', f404)
   off('helper/off', f404, 1)
   off('helper/off', f404, 2)
   off('helper/off', f404, 66) // incorrect priority » 3
   off('helper/off', f404, 77) // incorrect priority » 11

   await t.step('attempt to remove 5 listeners (expect to fail 2)', () => {
      assertEquals<[number, Listener][] | null>(
         e.lsListeners('helper/off'),
         [
            [3, f404],
            [11, f404],
         ],
         'expect 2 listeners left as removing listeners with incorrect priority',
      )
   })
})

Deno.test('[emit] apply', () => {
   on('helper/apply', (n) => assertEquals(n, 0x77DD77))
   apply('helper/apply', 0x77DD77)
})

Deno.test('[emit] filter', async () => {
   on('helper/filter', (n) => `#${n.toString(16).toUpperCase()}`)
   const hex = filter('helper/filter', 0x77DD77)
   assertEquals(await hex, '#77DD77')
})
