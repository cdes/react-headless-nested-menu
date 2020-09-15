type refFunction = (instance: HTMLElement | null) => void
type refObject = React.MutableRefObject<HTMLElement | null>

// Thanks to downshift.js
export function handleRefs(...refs: (refFunction | refObject)[]): refFunction {
  return (instance) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(instance)
      } else if (ref) {
        ref.current = instance
      }
    })
  }
}

export const getDirection = () => (document.dir === 'rtl' ? 'rtl' : 'ltr')

function getPath(target: EventTarget | null): (Window | EventTarget)[] {
  let path: (Window | EventTarget)[] = []
  let currentElem: EventTarget | null = target
  while (currentElem) {
    path.push(currentElem)
    currentElem = (currentElem as HTMLElement).parentElement
  }

  if (path.indexOf(window) === -1 && path.indexOf(document) === -1) path.push(document)
  if (path.indexOf(window) === -1) path.push(window)
  return path
}

export default function getEventPath(event: Event) {
  let path = (event.composedPath && event.composedPath()) || getPath(event.target)
  let target = event.target

  if (path !== null) {
    // Safari doesn't include Window, and it should.
    path = path.indexOf(window) < 0 ? [...path, window] : path
    return path
  }

  if (target === window) {
    return [window]
  }

  function getParents(node?: Node, memo?: Node[]): Node[] {
    memo = memo || []

    if (!node?.parentNode) {
      return memo
    } else {
      return getParents(node.parentNode, [...memo, node.parentNode])
    }
  }

  return [target, ...getParents(target as Node), window]
}
