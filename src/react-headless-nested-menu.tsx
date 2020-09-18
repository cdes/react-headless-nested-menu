// Import here Polyfills if needed. Recommended core-js (npm i -D core-js)
// ...

import React from 'react'
import produce, { Draft } from 'immer'
import getEventPath, { handleRefs, getDirection } from './utils'

const { useRef, useReducer, useEffect, useCallback } = React

interface MenuItem {
  id: string
  label: string
  subMenu?: Items
}

export type Items = MenuItem[]

interface ToggleAction {
  type: 'toggle'
}

interface OpenPathAction {
  type: 'open-path'
  id: string
}

interface ClosePathAction {
  type: 'close-path'
  id: string
}

type Action = ToggleAction | OpenPathAction | ClosePathAction

interface NestedMenuState {
  items: Items
  isOpen: boolean
  currentPath: string[]
}

const reducer = produce((draft: Draft<NestedMenuState>, action: Action) => {
  switch (action.type) {
    case 'toggle':
      draft.isOpen = !draft.isOpen
      draft.currentPath = []
      break

    case 'open-path':
      draft.currentPath.push(action.id)
      break
    case 'close-path':
      const index = draft.currentPath.indexOf(action.id)
      draft.currentPath.splice(index)
      break
    default:
      break
  }
})

interface NestedMenuProps {
  items?: Items
  isOpen?: boolean
  defaultOpenPath?: string[]
}

interface HitAreaProps {
  anchor?: DOMRect
  menu?: DOMRect
}

export const useNestedMenu = ({
  items = [],
  isOpen = false,
  defaultOpenPath = [],
}: NestedMenuProps) => {
  const [state, dispatch] = useReducer(reducer, {
    items,
    isOpen,
    currentPath: defaultOpenPath,
  })

  const globalClickHandler = useCallback(
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

  useEffect(() => {
    if (state.isOpen) {
      document.addEventListener('click', globalClickHandler)
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
        id: item.id,
      })
    }
  }

  const closePath = (item: MenuItem) => {
    if (item.subMenu) {
      dispatch({
        type: 'close-path',
        id: item.id,
      })
    }
  }

  const isSubMenuOpen = (item: MenuItem) => state.currentPath.indexOf(item.id) !== -1

  const toggleButtonRef = useRef(null!)

  const getToggleButtonProps = () => ({
    onClick() {
      toggleMenu()
    },
    ref: toggleButtonRef,
  })

  const menuRefs = useRef<{ [key: string]: HTMLElement }>({})

  const getMenuProps = (item?: MenuItem) => ({
    key: item?.id || 'root',
    ref: handleRefs((itemNode) => {
      if (itemNode) {
        menuRefs.current[item?.id || 'root'] = itemNode
      }
    }),
  })

  const itemRefs = useRef<{ [key: string]: HTMLElement }>({})

  const getItemProps = (item: MenuItem) => ({
    key: item.id,
    ref: handleRefs((itemNode) => {
      if (itemNode) {
        itemRefs.current[item.id] = itemNode
      }
    }),
  })

  const getMenuOffsetStyles = (currentItem?: MenuItem) => {
    const item = currentItem ? itemRefs.current[currentItem.id] : null
    const level =
      state.currentPath.length === 0
        ? 0 // root menu
        : currentItem && state.currentPath.includes(currentItem.id)
        ? 1 // submenu, indent
        : 0
    const button = toggleButtonRef.current as HTMLElement

    const dir = getDirection()
    const direction = dir === 'ltr' ? 'left' : 'right'
    const rootX =
      dir === 'ltr'
        ? button.getBoundingClientRect().right
        : window.innerWidth - button.getBoundingClientRect().left

    return {
      top: item ? 0 : button.getBoundingClientRect().top,
      [direction]: item ? button.getBoundingClientRect().width * level : rootX,
      width: button.getBoundingClientRect().width,
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

  // still not working properly
  const anchorRef = useRef<HTMLElement>()
  const menuRef = useRef<HTMLElement>()

  return {
    getToggleButtonProps,
    getMenuProps,
    getItemProps,
    getMenuOffsetStyles,
    getOpenTriggerProps,
    getCloseTriggerProps,
    getToggleTriggerProps,
    getItemPath,
    items: state.items,
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
