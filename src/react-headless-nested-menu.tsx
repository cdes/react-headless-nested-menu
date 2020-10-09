import React, { useState } from 'react'
import produce, { Draft } from 'immer'
import { usePopper } from 'react-popper'
import { Placement, PositioningStrategy } from '@popperjs/core'
import { Options as OffetOptions } from '@popperjs/core/lib/modifiers/offset'

import getEventPath, { handleRefs, getDirection } from './utils'
export interface MenuItem {
  id: string
  label: string
  subMenu?: Items
}

export type Items = MenuItem[]

/**
 * @ignore
 */
interface ToggleAction {
  type: 'toggle'
}

/**
 * @ignore
 */
interface OpenPathAction {
  type: 'open-path'
  item: MenuItem
}

/**
 * @ignore
 */
interface ClosePathAction {
  type: 'close-path'
  item: MenuItem
}

type Action = ToggleAction | OpenPathAction | ClosePathAction

/**
 * @ignore
 */
interface NestedMenuState {
  items: Items
  isOpen: boolean
  currentPath: string[]
  currentPathItems: MenuItem[]
}

/**
 * @ignore
 */
const reducer = produce((draft: Draft<NestedMenuState>, action: Action) => {
  switch (action.type) {
    case 'toggle':
      draft.isOpen = !draft.isOpen
      draft.currentPath = []
      draft.currentPathItems = []
      break

    case 'open-path':
      draft.currentPath.push(action.item.id)
      draft.currentPathItems.push(action.item)
      break
    case 'close-path':
      const index = draft.currentPath.indexOf(action.item.id)
      draft.currentPath.splice(index)
      draft.currentPathItems.splice(index)
      break
    default:
      break
  }
})

/**
 * The props you pass to `useNestedMenu(props) as args`
 *
 * @category Types
 */
interface NestedMenuProps {
  items?: Items
  isOpen?: boolean
  defaultOpenPath?: string[]
  placement?: Placement
  offset?: OffetOptions['offset']
  strategy?: PositioningStrategy
}

// interface HitAreaProps {
//   anchor?: DOMRect
//   menu?: DOMRect
// }

/**
 *
 * @category Hooks
 */
export const useNestedMenu = ({
  items = [],
  isOpen = false,
  defaultOpenPath = [],
  placement,
  offset,
  strategy,
}: NestedMenuProps) => {
  const [state, dispatch] = React.useReducer(reducer, {
    items,
    isOpen,
    currentPath: defaultOpenPath,
    currentPathItems: [],
  })

  const globalClickHandler = React.useCallback(
    (event: MouseEvent) => {
      const path = getEventPath(event)
      const items = Object.keys(itemRefs.current).map((id) => itemRefs.current[id]) as EventTarget[]
      const menus = Object.keys(menuRefs.current).map((id) => menuRefs.current[id]) as EventTarget[]

      const isClickInside = path.some(
        (target) =>
          target !== null && (items.indexOf(target) !== -1 || menus.indexOf(target) !== -1)
      )

      if (!isClickInside && state.isOpen) {
        toggleMenu()
      }
    },
    [state.isOpen]
  )

  React.useEffect(() => {
    if (state.isOpen) {
      document.addEventListener('click', globalClickHandler)
    }
    return () => {
      document.removeEventListener('click', globalClickHandler)
    }
  }, [state.isOpen, globalClickHandler])

  const toggleMenu = () => {
    if (state.isOpen) {
      document.removeEventListener('click', globalClickHandler)
    }
    dispatch({
      type: 'toggle',
    })
  }

  const openPath = (item: MenuItem) => {
    if (item.subMenu) {
      dispatch({
        type: 'open-path',
        item,
      })
    }
  }

  const closePath = (item: MenuItem) => {
    if (item.subMenu) {
      dispatch({
        type: 'close-path',
        item,
      })
    }
  }

  const isSubMenuOpen = (item: MenuItem) => state.currentPath.indexOf(item.id) !== -1

  const toggleButtonRef = React.useRef(null!)

  const getToggleButtonProps = () => ({
    onClick() {
      toggleMenu()
    },
    ref: toggleButtonRef,
  })

  const menuRefs = React.useRef<{ [key: string]: HTMLElement }>({})
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null)

  const getMenuProps = (item?: MenuItem) => {
    if (item) {
      return {
        key: item.id,
        ref: handleRefs((itemNode) => {
          if (itemNode) {
            menuRefs.current[item.id] = itemNode
          }
        }),
        style: getMenuOffsetStyles(item),
      }
    } else {
      return {
        key: 'root',
        ref: handleRefs((itemNode) => {
          setPopperElement(itemNode)
        }),
        style: styles.popper,
        ...attributes.popper,
      }
    }
  }

  const itemRefs = React.useRef<{ [key: string]: HTMLElement }>({})

  const getItemProps = (item: MenuItem) => ({
    key: item.id,
    ref: handleRefs((itemNode) => {
      if (itemNode) {
        itemRefs.current[item.id] = itemNode
      }
    }),
  })

  const getMenuOffsetStyles = (currentItem?: MenuItem): React.CSSProperties => {
    if (!currentItem) return {}
    const item = itemRefs.current[currentItem.id]

    const dir = getDirection()

    return {
      position: 'absolute',
      top: 0,
      [dir === 'ltr' ? 'left' : 'right']: item.clientWidth,
    }
  }

  const getOpenTriggerProps = (event: 'onPointerEnter' | 'onClick', item: MenuItem) => ({
    [event]: function () {
      if (item.subMenu && !state.currentPath.includes(item.id)) {
        openPath(item)
        anchorRef.current = itemRefs.current[item.id]
        menuRef.current = menuRefs.current[item.id]
      }
    },
    // ref: itemRefs.current[item.id]
  })

  const getCloseTriggerProps = (event: 'onPointerLeave' | 'onClick', item?: MenuItem) => ({
    [event]: function (event: React.PointerEvent) {
      event.stopPropagation()
      if (item) {
        closePath(item)
      }
    },
  })

  const getToggleTriggerProps = (event: 'onPointerLeave' | 'onClick', item?: MenuItem) => ({
    [event]: function (event: React.PointerEvent) {
      event.stopPropagation()
      if (item) {
        if (isSubMenuOpen(item)) {
          closePath(item)
        } else {
          openPath(item)
          anchorRef.current = itemRefs.current[item.id]
          menuRef.current = menuRefs.current[item.id]
        }
      }
    },
  })

  const getItemPath = (item: MenuItem) => [...state.currentPath, item.id]
  const getItemPathAsItems = (item: MenuItem) => [...state.currentPathItems, item]

  // still not working properly
  const anchorRef = React.useRef<HTMLElement>()
  const menuRef = React.useRef<HTMLElement>()

  const { styles, attributes } = usePopper(toggleButtonRef.current, popperElement, {
    placement: placement,
    strategy: strategy,
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: offset,
        },
      },
      {
        name: 'flip',
        enabled: false,
      },
    ],
  })

  return {
    getToggleButtonProps,
    getMenuProps,
    getItemProps,
    getMenuOffsetStyles,
    getOpenTriggerProps,
    getCloseTriggerProps,
    getToggleTriggerProps,
    getItemPath,
    getItemPathAsItems,
    isOpen: state.isOpen,
    currentPath: state.currentPath,
    openPath,
    closePath,
    isSubMenuOpen,
    toggleMenu,
    // HitArea: (
    //   <HitArea
    //     anchor={anchorRef.current?.getBoundingClientRect()}
    //     menu={menuRef.current?.getBoundingClientRect()}
    //   />
    // )
  }
}
