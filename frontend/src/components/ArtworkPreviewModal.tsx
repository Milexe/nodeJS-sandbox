import { useEffect, useId, useRef, type MouseEvent } from 'react'
import type { ArtsearchArtwork } from '../types/artsearch'
import { artworkImageFilename } from '../utils/artworkImage'

type ArtworkPreviewModalProps = {
  artwork: ArtsearchArtwork | null
  onClose: () => void
}

export default function ArtworkPreviewModal({
  artwork,
  onClose,
}: ArtworkPreviewModalProps) {
  const titleId = useId()
  const overlayPressed = useRef(false)

  useEffect(() => {
    if (!artwork) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [artwork, onClose])

  if (!artwork) {
    return null
  }

  const downloadFilename = artworkImageFilename(artwork.image, artwork.id)

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
        className="modal modal--artwork-preview"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="modal__header">
          <h3 id={titleId} className="modal__title">
            Artwork preview
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

        <div className="modal__body artwork-preview__body">
          <img
            className="artwork-preview__image"
            src={artwork.image}
            alt={artwork.title}
          />
          <p className="artwork-preview__title">{artwork.title}</p>
        </div>

        <div className="modal__actions modal__actions--footer">
          <a
            className="modal__button modal__button--secondary artwork-preview__download"
            href={artwork.image}
            download={downloadFilename}
            target="_blank"
            rel="noopener noreferrer"
          >
            Download
          </a>
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
