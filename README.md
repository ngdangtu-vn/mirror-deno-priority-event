# Priority Event Emitter

A simple event emitter inspired from WordPress hook system with fully type support for TypeScript.

## Why this?

- Simple, just a single file
  - No dependency/library at all
  - So simple that you can compile it to browser script with no trouble. (maybe :?)
- Support priority like WordPress
- Support TypeScript

## How to use

[![super easy barely an inconvenience](https://i.imgur.com/RzoYR0X.png)](https://imgur.com/RzoYR0X)

```jsonc
// ./deno.jsonc
{
   "compilerOptions": {
      "types": ["./types.d.ts"]
   }
}
```

```ts
// ./types.d.ts
declare global {
   // https://docs.deno.com/runtime/manual/runtime/program_lifecycle
   interface PriorityEventMap {
      'deno/load': Event
      'deno/beforeunload': Event
      'deno/unload': Event
      'deno/unhandledrejection': PromiseRejectionEvent
      'deno/rejectionhandled': PromiseRejectionEvent
   }
}
export {}
```

```ts
// ./main.ts
import { apply, filter, off, on } from 'https://deno.land/x/priority_event/mod.ts'

on(
   'deno/load',
   (e) => console.log(`This listener will be fired once ${e.type} event gets emitted`),
)

globalThis.addEventListener(
   'load',
   (e) => apply('deno/load', e),
)
```

More reference in [`examples/`](./examples/)

## Self-note

To copy repo from Gitlab to Github, after clone, run this command:

```shell
git config --local core.hooksPath .repo/
```

## Credit

- "super easy barely an inconvenience" meme is proverbial catchphrase made by comedian Ryan George, [learn more](https://digitalcultures.net/slang/internet-culture/super-easy-barely-an-inconvenience/).
