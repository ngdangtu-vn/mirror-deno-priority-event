#!/usr/bin/env -S deno run 

import { filter, on } from '../mod.ts'

type Status = 'fresh' | 'stale'

declare global {
   interface PriorityEventMap {
      'quality-assurance/apple': (a: Status[]) => Status[]
   }
}

function collect_apples(m = 1, x = 999_999) {
   return Array.from(
      { length: Math.floor(Math.random() * (x - m + 1) + m) },
      (_) => Math.round(Math.random()) === 0 ? 'fresh' : 'stale',
   )
}

/** Somewhere in your program/plugins */
on(
   'quality-assurance/apple',
   (box) => box.filter((apple_status) => apple_status === 'fresh'),
)

/** Later on, another somewhere in your program */
const apple_box = collect_apples()
const fresh_apple = await filter('quality-assurance/apple', apple_box)

if (!fresh_apple || fresh_apple.length < 1) {
   console.log('What a season! There is no good apple at all~')
} else {
   console.log(
      `Only ${fresh_apple.length} fresh apples out of ${apple_box.length} apples in the box.`,
   )
}
