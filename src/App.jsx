import { useState } from 'react'
import { PlayerProvider } from './store/PlayerContext'
import { BackgroundShader } from './components/BackgroundShader'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { NowPlayingHost } from './components/NowPlayingHost'
import { TransmissionQueue } from './components/TransmissionQueue'
import { SignalLost } from './components/SignalLost'
import { MobileNav } from './components/MobileNav'
import { QueueDrawer } from './components/QueueDrawer'
import { LibraryView } from './components/LibraryView'
import { ManageDevicesPanel } from './components/ManageDevicesPanel'
import { RadioView } from './components/RadioView'
import { InfoView } from './components/InfoView'

export default function App() {
  const [view, setView] = useState('devices')
  const [queueOpen, setQueueOpen] = useState(false)

  return (
    <PlayerProvider>
      <div className="relative h-screen flex flex-col overflow-hidden">
        <BackgroundShader />
        <div className="absolute inset-0 scanline-overlay z-10" />

        <Header onToggleQueue={() => setQueueOpen((v) => !v)} onNavigate={setView} />

        <div className="flex flex-1 pt-16 z-20 relative h-full overflow-hidden">
          <Sidebar activeView={view} onNavigate={setView} />
          <main className="flex-1 px-4 md:px-6 lg:px-10 flex gap-6 overflow-hidden pb-16 md:pb-0 min-w-0">
            {/* Views stay mounted so Library page-cache and scroll position survive switches */}
            <div className={`${view === 'devices' ? 'flex' : 'hidden'} flex-1 gap-6 min-w-0 h-full`}>
              <div className="flex-1 max-w-2xl flex flex-col h-full min-w-0">
                <NowPlayingHost />
              </div>
              <div className="hidden lg:flex w-80 flex-col shrink-0">
                <TransmissionQueue />
              </div>
            </div>
            <div className={`${view === 'library' ? 'flex' : 'hidden'} flex-1 min-w-0 h-full`}>
              <LibraryView />
            </div>
            <div className={`${view === 'radio' ? 'flex' : 'hidden'} flex-1 min-w-0 h-full`}>
              <RadioView />
            </div>
            <div className={`${view === 'info' ? 'flex' : 'hidden'} flex-1 min-w-0 h-full`}>
              <InfoView />
            </div>
            <div className={`${view === 'settings' ? 'flex' : 'hidden'} flex-1 min-w-0 h-full`}>
              <ManageDevicesPanel />
            </div>
          </main>
        </div>

        <MobileNav activeView={view} onNavigate={setView} />
        <QueueDrawer open={queueOpen} onClose={() => setQueueOpen(false)} />
        <SignalLost />
      </div>
    </PlayerProvider>
  )
}