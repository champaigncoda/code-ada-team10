import './App.css'
import { FloorPlanEditor } from './features/editor/FloorPlanEditor'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Room Designer</h1>
      </header>
      <main className="app-main">
        <FloorPlanEditor />
      </main>
    </div>
  )
}

export default App
