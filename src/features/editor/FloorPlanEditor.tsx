import { CalibrationPanel } from '../calibration/components/CalibrationPanel'
import { getReferenceEdgeIndex, isCalibrationEditable } from '../calibration/calibrationState'
import { EditorStatus } from './components/EditorStatus'
import { EditorToolbar } from './components/EditorToolbar'
import { ErrorBanner } from './components/ErrorBanner'
import { FloorPlanCanvas } from './components/FloorPlanCanvas'
import { UploadDropzone } from './components/UploadDropzone'
import { selectCanConfirmCalibration, selectWallLengthsMeters } from './editorSelectors'
import './FloorPlanEditor.css'
import { useFloorPlanEditor } from './useFloorPlanEditor'

export function FloorPlanEditor() {
  const editor = useFloorPlanEditor()
  const { floorPlan, polygon, isClosed, calibration, error } = editor.state
  const vertexCount = polygon.vertices.length
  const referenceEdgeIndex = getReferenceEdgeIndex(calibration)
  const wallLengthsMeters = selectWallLengthsMeters(editor.state)

  const canvasFrame = (
    <div className="editor-canvas-frame">
      {error && <ErrorBanner error={error} onDismiss={editor.dismissError} />}
      {floorPlan ? (
        <FloorPlanCanvas
          key={floorPlan.image.url}
          floorPlan={floorPlan}
          vertices={polygon.vertices}
          isClosed={isClosed}
          isEdgeSelectionEnabled={isCalibrationEditable(calibration)}
          referenceEdgeIndex={referenceEdgeIndex}
          wallLengthsMeters={wallLengthsMeters}
          onCanvasClick={editor.clickCanvas}
          onEdgeSelect={editor.selectReferenceEdge}
        />
      ) : (
        <UploadDropzone onFileSelected={editor.uploadFile} />
      )}
    </div>
  )

  return (
    <section className="floor-plan-editor" aria-label="2D floor plan editor">
      {floorPlan && (
        <>
          <EditorToolbar
            image={floorPlan.image}
            canUndo={!isClosed && vertexCount > 0}
            canClear={vertexCount > 0}
            onFileSelected={editor.uploadFile}
            onUndo={editor.undoLastVertex}
            onClear={editor.clearPolygon}
          />
          <EditorStatus vertexCount={vertexCount} isClosed={isClosed} />
        </>
      )}
      {floorPlan ? (
        <div className="editor-workspace">
          {canvasFrame}
          <CalibrationPanel
            isPolygonClosed={isClosed}
            vertexCount={vertexCount}
            status={calibration.status}
            referenceEdgeIndex={referenceEdgeIndex}
            lengthInput={calibration.lengthInput}
            wallLengthsMeters={wallLengthsMeters}
            canConfirm={selectCanConfirmCalibration(editor.state)}
            onSelectWall={editor.selectReferenceEdge}
            onLengthChange={editor.changeReferenceLength}
            onConfirm={editor.confirmCalibration}
            onRecalibrate={editor.startRecalibration}
          />
        </div>
      ) : (
        canvasFrame
      )}
    </section>
  )
}
