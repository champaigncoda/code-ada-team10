import { useState } from 'react'
import './App.css'
import { isFurnitureStudioRequested } from './features/app/workspace'
import { FloorPlanEditor } from './features/editor/FloorPlanEditor'
import { FurnitureStudio } from './features/furniture/components/FurnitureStudio'

function App() {
  const [studioOpen, setStudioOpen] = useState(() => isFurnitureStudioRequested(window.location))

  function setStudio(open: boolean) {
    const url = new URL(window.location.href)
    if (open) {
      url.searchParams.set('studio', 'furniture')
    } else {
      url.searchParams.delete('studio')
      if (url.hash === '#furniture-studio') url.hash = ''
    }
    window.history.replaceState({}, '', url)
    setStudioOpen(open)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Room Designer</h1>
        {studioOpen && (
          <button type="button" className="button button--secondary" onClick={() => setStudio(false)}>
            Back to room
          </button>
        )}
      </header>
      <main className="app-main">
        <div hidden={studioOpen}>
          <FloorPlanEditor />
        </div>
        {studioOpen && <FurnitureStudio />}
      </main>
    </div>
  )
}

export default App
