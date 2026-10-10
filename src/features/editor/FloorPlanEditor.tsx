import { CalibrationPanel } from '../calibration/components/CalibrationPanel'
import { getReferenceEdgeIndex, isCalibrationEditable } from '../calibration/calibrationState'
import { RoomGenerationPanel } from '../room/components/RoomGenerationPanel'
import { RoomViewer } from '../viewer/components/RoomViewer'
import { EditorStatus } from './components/EditorStatus'
import { EditorToolbar } from './components/EditorToolbar'
import { ErrorBanner } from './components/ErrorBanner'
import { FloorPlanCanvas } from './components/FloorPlanCanvas'
import { UploadDropzone } from './components/UploadDropzone'
import {
  selectCanConfirmCalibration,
  selectCanGenerateRoom,
  selectGeneratedRoomSource,
  selectWallLengthsMeters,
} from './editorSelectors'
import './FloorPlanEditor.css'
import { useFloorPlanEditor } from './useFloorPlanEditor'

export function FloorPlanEditor() {
  const editor = useFloorPlanEditor()
  const { floorPlan, polygon, isClosed, calibration, error, roomHeightInput, activeView } = editor.state
  const vertexCount = polygon.vertices.length
  const referenceEdgeIndex = getReferenceEdgeIndex(calibration)
  const wallLengthsMeters = selectWallLengthsMeters(editor.state)
  const generatedSource = selectGeneratedRoomSource(editor.state)

  if (activeView === 'viewer' && generatedSource) {
    return (
      <RoomViewer
        source={generatedSource}
        session={editor.state.furnitureSession}
        onAction={editor.applyFurniture}
        onReturnToEditor={editor.returnToEditor}
      />
    )
  }

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
          <EditorStatus
            vertexCount={vertexCount}
            isClosed={isClosed}
            isCalibrationConfirmed={calibration.status === 'confirmed'}
          />
        </>
      )}
      {floorPlan ? (
        <div className="editor-workspace">
          {canvasFrame}
          <div className="editor-sidebar">
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
            <RoomGenerationPanel
              heightInput={roomHeightInput}
              isCalibrationConfirmed={calibration.status === 'confirmed'}
              canGenerate={selectCanGenerateRoom(editor.state)}
              onHeightChange={editor.changeRoomHeight}
              onGenerate={editor.generateRoom}
            />
          </div>
        </div>
      ) : (
        canvasFrame
      )}
    </section>
  )
}
