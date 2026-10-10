import './App.css'
import { EditorPlaceholder } from './features/editor/EditorPlaceholder'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Room Designer</h1>
      </header>
      <main className="app-main">
        <EditorPlaceholder />
      </main>
    </div>
  )
}

export default App
