import type { EditorError } from '../editorReducer'

interface ErrorBannerProps {
  readonly error: EditorError
  readonly onDismiss: () => void
}

export function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  return (
    <div className="error-banner" role="alert">
      <div>
        <p className="error-banner__message">{error.message}</p>
        {error.details.length > 0 && (
          <ul className="error-banner__details">
            {error.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        )}
      </div>
      <button type="button" className="error-banner__dismiss" onClick={onDismiss} aria-label="Dismiss error">
        ×
      </button>
    </div>
  )
}
