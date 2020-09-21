import * as React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import { Items, useNestedMenu } from '../src/react-headless-nested-menu'

const simpleList = [
  {
    id: 'ckeri9fsh00003g657lmpwrly',
    label: 'Name',
  },
  {
    id: 'ckeri9fsh00013g65k5aosl1l',
    label: 'Photo',
  },
  {
    id: 'ckeri9fsh00023g65zjdr0wdx',
    label: 'Email',
  },
];

const Basic: React.FC = () => {
  const {
    getToggleButtonProps,
    getMenuProps,
    getMenuOffsetStyles,
    getCloseTriggerProps,
    getItemProps,
    getOpenTriggerProps,
    toggleMenu,
    isSubMenuOpen,
    isOpen
  } = useNestedMenu({
    items: simpleList,
  })
  const renderItem = (item: Items[0]) => (
    <div
      {...getItemProps(item)}
      className="relative my-1 first:mt-0 last:mb-0"
      {...getOpenTriggerProps('onPointerEnter', item)}
      onClick={(event) => {
        event.stopPropagation()
        toggleMenu()
      }}
    >
      <div
        className={isSubMenuOpen(item) ? 'sub-open': 'sub-closed'}
      >
        {item.label}
        {item.subMenu && <span className="chevron" />}
      </div>

      {/* Only show submenu when there's a submenu & it's open */}
      {item.subMenu && isSubMenuOpen(item) && renderMenu(item.subMenu, item)}
    </div>
  )
  const renderMenu = (items: Items, parentItem?: Items[0]) => (
    <div
      {...getMenuProps(parentItem)}
      style={{
        position: 'absolute',
        ...getMenuOffsetStyles(parentItem),
      }}
      className={typeof parentItem === 'undefined' ? 'root' : 'sub'}
      {...getCloseTriggerProps('onPointerLeave', parentItem)}
    >
      <div>{items.map((item) => renderItem(item))}</div>

      {/* Hit Area */}
      {parentItem && (
        <div
          style={{
            position: 'absolute',
            top: -8,
            bottom: -8,
            left: -8,
            right: -8,
            zIndex: -1,
          }}
        ></div>
      )}
    </div>
  )
  return (
    <div>
      <button className="toggle-btn" {...getToggleButtonProps()}>
        Toggle
      </button>
      {isOpen && renderMenu(simpleList)}
    </div>
  )
}

describe('Hook', () => {
  it('renders basic menu', () => {
    const { container, queryByText } = render(<Basic />);
    const btn = queryByText('Toggle');
    expect(btn).toBeDefined();
    expect(queryByText('Name')).toBe(null);
    expect(queryByText('Photo')).toBe(null);
    expect(queryByText('Email')).toBe(null);
    fireEvent.click(btn!);
    expect(queryByText('Name')).toBeDefined();
    expect(queryByText('Photo')).toBeDefined();
    expect(queryByText('Email')).toBeDefined();
  })
})
