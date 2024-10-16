const Emitter = (() => {
    const subscribers: Record<string, (() => void)[]> = {}
    return {
        subscribe: (ev: string, cb: () => void) : () => void => {
            if (!subscribers[ev]) {
                subscribers[ev] = []
            }

            subscribers[ev].push(cb)

            return () => {
                subscribers[ev] = subscribers[ev].filter(x => x != cb)
            }
        },
        trigger: (ev: string) => {
            subscribers[ev] && subscribers[ev].forEach(cb => cb())
        }
    }
})()

export const events = {
    eventChannelsChanged: 'eventChannelsChanged'
}

export default Emitter