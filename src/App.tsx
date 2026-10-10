import { useState } from 'react'
import './App.css'
import { type AppWorkspace, WORKSPACE_LABELS } from './features/app/workspace'
import { FloorPlanEditor } from './features/editor/FloorPlanEditor'
import { FurnitureStudio } from './features/furniture/components/FurnitureStudio'

function App() {
  const [workspace, setWorkspace] = useState<AppWorkspace>('room')

  return (
    <div className="app">
      <header className="app-header">
        <h1>Room Designer</h1>
        <nav className="app-nav" aria-label="Workspace">
          {(['room', 'furniture'] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={`app-nav__button${workspace === item ? ' app-nav__button--current' : ''}`}
              aria-current={workspace === item ? 'page' : undefined}
              onClick={() => setWorkspace(item)}
            >
              {WORKSPACE_LABELS[item]}
            </button>
          ))}
        </nav>
      </header>
      <main className="app-main">
        <div hidden={workspace !== 'room'}>
          <FloorPlanEditor onOpenFurniture={() => setWorkspace('furniture')} />
        </div>
        {workspace === 'furniture' && <FurnitureStudio />}
      </main>
    </div>
  )
}

export default App
