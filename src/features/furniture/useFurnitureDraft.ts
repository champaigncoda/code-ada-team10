import { useState } from 'react'
import type { FurnitureCategory, FurnitureDimensionAxis } from '../../types/furniture'
import {
  changeFurnitureCategory,
  changeFurnitureColor,
  changeFurnitureDimension,
  draftFromDefaults,
  parseFurnitureDraft,
  resolveFurniturePreview,
  type FurnitureDraft,
} from './furnitureConfig'

export function useFurnitureDraft(initial: FurnitureDraft = draftFromDefaults()) {
  const [draft, setDraft] = useState(initial)
  const [preview, setPreview] = useState(() => {
    const parsed = parseFurnitureDraft(initial)
    if (!parsed) throw new Error('Furniture preview requires a valid default draft')
    return parsed
  })

  function applyDraft(next: FurnitureDraft) {
    setDraft(next)
    setPreview((current) => resolveFurniturePreview(next, current))
  }

  return {
    draft,
    preview,
    selectCategory: (category: FurnitureCategory) => applyDraft(changeFurnitureCategory(draft, category)),
    changeDimension: (axis: FurnitureDimensionAxis, input: string) =>
      applyDraft(changeFurnitureDimension(draft, axis, input)),
    changeColor: (color: string) => applyDraft(changeFurnitureColor(draft, color)),
  }
}
