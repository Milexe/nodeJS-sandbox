import { useId, useRef, type MouseEvent, type ReactNode } from 'react'

type InfoDialogProps = {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}

export default function InfoDialog({
  open,
  title,
  children,
  onClose,
}: InfoDialogProps) {
  const titleId = useId()
  const overlayPressed = useRef(false)

  if (!open) {
    return null
  }

  function handleOverlayMouseDown(event: MouseEvent<HTMLDivElement>) {
    overlayPressed.current = event.target === event.currentTarget
  }

  function handleOverlayMouseUp(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && overlayPressed.current) {
      onClose()
    }
    overlayPressed.current = false
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={handleOverlayMouseUp}
    >
      <div
        className="modal modal--info"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="modal__header">
          <h3 id={titleId} className="modal__title">
            {title}
          </h3>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="modal__body">{children}</div>

        <div className="modal__actions modal__actions--footer">
          <button
            type="button"
            className="modal__button modal__button--primary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
