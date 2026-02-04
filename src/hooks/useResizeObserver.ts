import { onBeforeUnmount, onMounted, unref, type Ref } from 'vue'

type MaybeRef<T> = T | Ref<T>

export function useResizeObserver(
  target: MaybeRef<HTMLElement | { $el: HTMLElement } | null>,
  callback: ResizeObserverCallback,
) {
  let observer: ResizeObserver | null = null

  onMounted(() => {
    const value = unref(target)
    if (!value) return

    const el = value instanceof HTMLElement ? value : value.$el

    observer = new ResizeObserver(callback)
    observer.observe(el)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
  })
}
