#!/usr/bin/env -S deno run 

import { apply, off, on } from '../mod.ts'

declare global {
   interface PriorityEventMap {
      'deno/load': Event
   }
}

// 3rd
on(
   'deno/load',
   (e) => console.log(`This is the very first listener of ${e.type} event.`),
)

// 1st
on(
   'deno/load',
   (e) =>
      console.log(
         `This is the second listener of ${e.type} event. Yet it runs before the first =))`,
      ),
   9,
)

// 4th
on(
   'deno/load',
   function () {
      console.log(`This is the last msg from "${this.name || 'anonymous'}" function`)
   },
   99,
)

// 2nd
on(
   'deno/load',
   function debug() {
      console.log(
         `Placed at last but display in second is "${this.name}" function. Because it has priority ${this.priority} but was submit later than the one in line 18.`,
      )
   },
   9,
)

// ?th
function neverhappen() {
   console.log(
      `To turn off the ${neverhappen.name} function, use 'off()' with the same priority for 'on()'.`,
   )
}
on('deno/load', neverhappen, 1)
off('deno/load', neverhappen, 1)

// 5th
on(
   'deno/load',
   function debug() {
      const total_listerners = this.emitter.countListeners(this.event as keyof PriorityEventMap)
      const grammar = total_listerners > 1 ? 'listerner was' : 'listerners were'
      console.log(`» In the end, we have ${total_listerners} ${grammar} submitted`)
   },
   100,
)

// emitting listeners
globalThis.addEventListener(
   'load',
   (e) => apply('deno/load', e),
)
