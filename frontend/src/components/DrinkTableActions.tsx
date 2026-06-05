type DrinkTableActionsProps = {
  onEdit: () => void
  onDelete: () => void
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
      />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
      />
    </svg>
  )
}

export default function DrinkTableActions({
  onEdit,
  onDelete,
}: DrinkTableActionsProps) {
  return (
    <>
      <button
        type="button"
        className="drinks-table__icon-btn"
        aria-label="Edit drink"
        onClick={onEdit}
      >
        <EditIcon />
      </button>
      <button
        type="button"
        className="drinks-table__icon-btn drinks-table__icon-btn--danger"
        aria-label="Delete drink"
        onClick={onDelete}
      >
        <DeleteIcon />
      </button>
    </>
  )
}
