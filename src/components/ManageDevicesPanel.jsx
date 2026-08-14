import { useState } from 'react'
import { usePlayer } from '../store/PlayerContext'
import { AddDeviceModal } from './AddDeviceModal'
import { deviceInitials } from '../lib/avatar'
import { Icon } from './Icon'

export function ManageDevicesPanel() {
  const { devices, removeDevice } = usePlayer()
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmId, setConfirmId] = useState(null)

  return (
    <div className="flex-1 min-w-0 h-full overflow-y-auto pb-20 md:pb-0 px-1">
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <h2 className="font-display-tech text-tertiary text-[16px] tracking-widest lcd-text-glow">
          MANAGE DEVICES / PLAYLISTS
        </h2>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="chrome-button text-tertiary font-label-caps text-[10px] py-2 px-4 rounded-sm hover:text-white hover:border-tertiary transition-colors flex items-center gap-2"
        >
          <Icon name="add" className="text-[14px]" />
          PAIR NEW DEVICE
        </button>
      </div>

      <div className="glass-panel chrome-bezel rounded-lg p-3 space-y-2">
        {devices.map((device) => (
          <div
            key={device.id}
            className="flex items-center gap-3 rounded-sm border border-outline-variant/30 bg-surface-container-low p-3"
          >
            <div className="w-10 h-10 rounded-full chrome-bezel flex items-center justify-center shrink-0 overflow-hidden">
              {device.avatarUrl ? (
                <img src={device.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-label-caps text-[12px] text-tertiary">{deviceInitials(device.name)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-label-caps text-[11px] text-on-surface truncate">{device.name}</p>
              <p className="font-label-caps text-[9px] text-outline truncate">
                {device.sourceType === 'playlist' ? 'PLAYLIST' : 'SEARCH'}: {device.sourceValue}
              </p>
            </div>
            <span
              className={`font-label-caps text-[8px] px-1.5 py-0.5 rounded-sm border shrink-0 ${
                device.isUserAdded ? 'text-tertiary border-tertiary/50' : 'text-on-surface-variant border-outline-variant/50'
              }`}
            >
              {device.isUserAdded ? 'USER' : 'BUILT-IN'}
            </span>
            {device.isUserAdded &&
              (confirmId === device.id ? (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-label-caps text-[8px] text-error">FORGET?</span>
                  <button
                    type="button"
                    onClick={() => {
                      removeDevice(device.id)
                      setConfirmId(null)
                    }}
                    className="chrome-button font-label-caps text-[8px] px-2 py-1 rounded-sm text-error hover:text-white transition-colors"
                  >
                    YES
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    className="chrome-button font-label-caps text-[8px] px-2 py-1 rounded-sm text-on-surface-variant hover:text-white transition-colors"
                  >
                    NO
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(device.id)}
                  className="text-on-surface-variant hover:text-error transition-colors shrink-0"
                  aria-label={`Forget ${device.name}`}
                >
                  <Icon name="link_off" className="text-[18px]" />
                </button>
              ))}
          </div>
        ))}
      </div>

      <AddDeviceModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}