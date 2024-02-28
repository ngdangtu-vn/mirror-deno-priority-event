export type ParamListener<N extends keyof PriorityEventMap, T = PriorityEventMap[N]> = T extends
   (arg: infer A) => unknown ? A : T

export type ReturnListener<N extends keyof PriorityEventMap> = PriorityEventMap[N] extends
   (arg: unknown) => infer R ? R : unknown

// deno-lint-ignore no-explicit-any
export type Listener<A = any, R = any> = (
   this: {
      name: string
      priority: number
      event: string
      emitter: PriorityEvent
   },
   argv: A,
   orig_argv?: A,
) => R

/**
 * Event emitter with flexible priority
 *
 * @credit
 * - https://en.wikipedia.org/wiki/Event-driven_architecture
 * - https://www.freecodecamp.org/news/how-to-code-your-own-event-emitter-in-node-js-a-step-by-step-guide-e13b7e7908e1
 * - https://developer.wordpress.org/plugins/hooks
 */
class PriorityEvent {
   static #instance: PriorityEvent
   #ls: Map<keyof PriorityEventMap, [number, Listener][]>

   private constructor() {
      this.#ls = new Map()
   }

   /**
    * Add listener
    */
   addListener<N extends keyof PriorityEventMap>(
      name: N,
      listener: Listener<ParamListener<N>, ReturnListener<N>>,
      priority = 10,
   ) {
      const has_ev = this.#ls.has(name)
      if (!has_ev) this.#ls.set(name, [])

      this.#ls.get(name)!.push([priority, listener])
   }

   /**
    * Remove listener
    */
   rmListener<N extends keyof PriorityEventMap>(
      name: N,
      listener: Listener<ParamListener<N>, ReturnListener<N>>,
      priority = 10,
   ) {
      const ls = this.#ls.get(name)!
      if (!ls) return void 0

      for (let i = 0; i < ls.length; i++) {
         const same_prority = ls[i][0] === priority
         const match_fn = ls[i][1].toString() === listener.toString()
         const is_found = same_prority && match_fn

         if (!is_found) continue
         ls.splice(i, 1)
         break
      }
   }

   async listen<N extends keyof PriorityEventMap>(name: N, orig_argv: ParamListener<N>) {
      const ls = this.#ls.get(name)
      if (!ls || ls.length === 0) return void 0

      const sorted_ls = ls.sort((l, r) => l[0] - r[0])

      let passable_result: ParamListener<N> | null = orig_argv
      for (const [priority, listener] of sorted_ls) {
         const result = await listener.call(
            { name: listener.name, priority, event: name, emitter: this },
            passable_result,
            orig_argv,
         ) as ParamListener<N> | null
         passable_result = result === undefined ? orig_argv : result
      }
      return passable_result
   }

   listenSync<N extends keyof PriorityEventMap>(name: N, orig_argv: ParamListener<N>) {
      const ls = this.#ls.get(name)
      if (!ls || ls.length === 0) return void 0

      const sorted_ls = ls.sort((l, r) => l[0] - r[0])

      let passable_result: ParamListener<N> | null = orig_argv
      for (const [priority, listener] of sorted_ls) {
         const result = listener.call(
            { name: listener.name, priority, event: name, emitter: this },
            passable_result,
            orig_argv,
         ) as ParamListener<N> | null
         passable_result = result === undefined ? orig_argv : result
      }
      return passable_result
   }

   lsEvents() {
      return Array.from(this.#ls.keys())
   }

   lsListeners(name: keyof PriorityEventMap) {
      if (!this.#ls.has(name)) return null
      return Array.from(this.#ls.get(name)!.keys())
   }

   static init() {
      PriorityEvent.#instance ??= new PriorityEvent()
      return PriorityEvent.#instance
   }

   static async apply<N extends keyof PriorityEventMap>(name: N, argv: ParamListener<N>) {
      await PriorityEvent.init().listen(name, argv)
   }
   static filter<N extends keyof PriorityEventMap>(name: N, argv: ParamListener<N>) {
      return PriorityEvent.init().listen(name, argv)
   }

   static applySync<N extends keyof PriorityEventMap>(name: N, argv: ParamListener<N>) {
      PriorityEvent.init().listenSync(name, argv)
   }
   static filterSync<N extends keyof PriorityEventMap>(name: N, argv: ParamListener<N>) {
      return PriorityEvent.init().listenSync(name, argv)
   }
}

/**
 * Add new listerner to an event
 *
 * @param name Event name
 * @param listener Event listener
 * @param priority Listener priority
 */
export function on<N extends keyof PriorityEventMap>(
   name: N,
   listener: Listener<ParamListener<N>, ReturnListener<N>>,
   priority = 10,
) {
   PriorityEvent.init().addListener(name, listener, priority)
}

/**
 * Remove a listerner away an event
 *
 * The listener can only be removed
 * if the priority is matched to when it was set.
 *
 * @param name Event name
 * @param listener Event listener
 * @param priority Listener priority
 */
export function off<N extends keyof PriorityEventMap>(
   name: N,
   listener: Listener<ParamListener<N>, ReturnListener<N>>,
   priority = 10,
) {
   PriorityEvent.init().rmListener(name, listener, priority)
}

/**
 * @param name Event name
 * @param argv Listener parameter
 */
export async function apply<N extends keyof PriorityEventMap>(name: N, argv: ParamListener<N>) {
   await PriorityEvent.apply(name, argv)
}

/**
 * @param name Event name
 * @param argv Listener parameter
 * @returns { Promise<ReturnListener | ParamListener | null | undefined> }
 */
export function filter<N extends keyof PriorityEventMap>(name: N, argv: ParamListener<N>) {
   return PriorityEvent.filter(name, argv)
}

/**
 * Sync version of apply()
 *
 * @param name Event name
 * @param argv Listener parameter
 */
export function applySync<N extends keyof PriorityEventMap>(name: N, argv: ParamListener<N>) {
   PriorityEvent.applySync(name, argv)
}

/**
 * Sync version of filter()
 *
 * @param name Event name
 * @param argv Listener parameter
 * @returns { ReturnListener | ParamListener | null | undefined }
 */
export function filterSync<N extends keyof PriorityEventMap>(name: N, argv: ParamListener<N>) {
   return PriorityEvent.filterSync(name, argv)
}
