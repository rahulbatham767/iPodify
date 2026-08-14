import { Icon } from './Icon'

const ITEMS = [
  { key: 'library', icon: 'library_music', label: 'Library' },
  { key: 'devices', icon: 'bluetooth', label: 'Devices' },
  { key: 'radio', icon: 'settings_input_antenna', label: 'Radio' },
  { key: 'info', icon: 'help', label: 'Info' },
  { key: 'settings', icon: 'tune', label: 'Settings' },
]

export function MobileNav({ activeView, onNavigate }) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-container-low border-t border-black shadow-[0_-2px_0_0_rgba(0,0,0,0.8)]">
      <ul className="flex">
        {ITEMS.map((item) => {
          const active = activeView === item.key
          return (
            <li key={item.key} className="flex-1">
              <button
                type="button"
                onClick={() => onNavigate(item.key)}
                className={`w-full flex flex-col items-center gap-1 py-2.5 transition-colors active:scale-[0.97] ${
                  active
                    ? 'bg-primary-container/40 border-t-2 border-tertiary text-tertiary-fixed'
                    : 'text-on-surface-variant hover:text-tertiary'
                }`}
              >
                <Icon name={item.icon} filled={active} className="text-[20px]" />
                <span className="font-label-caps text-[9px]">{item.label.toUpperCase()}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}