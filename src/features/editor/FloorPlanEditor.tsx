import { EditorStatus } from './components/EditorStatus'
import { EditorToolbar } from './components/EditorToolbar'
import { ErrorBanner } from './components/ErrorBanner'
import { FloorPlanCanvas } from './components/FloorPlanCanvas'
import { UploadDropzone } from './components/UploadDropzone'
import './FloorPlanEditor.css'
import { useFloorPlanEditor } from './useFloorPlanEditor'

export function FloorPlanEditor() {
  const { state, uploadFile, clickCanvas, undoLastVertex, clearPolygon, dismissError } = useFloorPlanEditor()
  const { floorPlan, polygon, isClosed, error } = state
  const vertexCount = polygon.vertices.length

  return (
    <section className="floor-plan-editor" aria-label="2D floor plan editor">
      {floorPlan && (
        <>
          <EditorToolbar
            image={floorPlan.image}
            canUndo={!isClosed && vertexCount > 0}
            canClear={vertexCount > 0}
            onFileSelected={uploadFile}
            onUndo={undoLastVertex}
            onClear={clearPolygon}
          />
          <EditorStatus vertexCount={vertexCount} isClosed={isClosed} />
        </>
      )}
      <div className="editor-canvas-frame">
        {error && <ErrorBanner error={error} onDismiss={dismissError} />}
        {floorPlan ? (
          <FloorPlanCanvas
            key={floorPlan.image.url}
            floorPlan={floorPlan}
            vertices={polygon.vertices}
            isClosed={isClosed}
            onCanvasClick={clickCanvas}
          />
        ) : (
          <UploadDropzone onFileSelected={uploadFile} />
        )}
      </div>
    </section>
  )
}
