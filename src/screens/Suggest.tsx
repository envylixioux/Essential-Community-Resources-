import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApp } from '../lib/AppContext'
import { resolveCategory } from '../lib/categories'
import { t } from '../lib/i18n'
import { submitSuggestion } from '../lib/resources'
import { CATEGORIES, type AccessType, type Category } from '../lib/types'

const ACCESS_TYPES: AccessType[] = [
  'walk-in',
  'appointment',
  'hotline-only',
  'online',
  'application',
]

const ACCESS_LABELS: Record<AccessType, { en: string; es: string }> = {
  'walk-in': { en: 'Walk in, no appointment', es: 'Entrada libre, sin cita' },
  appointment: { en: 'By appointment', es: 'Con cita' },
  'hotline-only': { en: 'Phone or text only', es: 'Solo teléfono o mensaje' },
  online: { en: 'Online only', es: 'Solo en línea' },
  application: { en: 'Apply first', es: 'Debe solicitar primero' },
}

type Status = 'idle' | 'sending' | 'sent' | 'failed'

export default function Suggest() {
  const { locale } = useApp()
  const [params] = useSearchParams()
  const [status, setStatus] = useState<Status>('idle')
  const [name, setName] = useState('')

  // Arriving from an empty filter carries that category across, so the reader
  // is not asked to pick again what they just picked. resolveCategory also
  // accepts the pre-rename names for one release cycle.
  const [category, setCategory] = useState<Category>(
    () => resolveCategory(params.get('category') ?? '') ?? 'food-and-meals',
  )
  const [accessType, setAccessType] = useState<AccessType>('walk-in')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !description.trim()) return

    setStatus('sending')
    try {
      // Lands in `submissions` as pending. Nothing here reaches the directory
      // until a person reviews it and promotes it into `resources`.
      await submitSuggestion({
        name: name.trim(),
        category,
        access_type: accessType,
        description: description.trim(),
        address: address.trim() || null,
        phone: phone.trim() || null,
        notes: notes.trim() || null,
      })
      setStatus('sent')
    } catch {
      setStatus('failed')
    }
  }

  if (status === 'sent') {
    return (
      <div className="page">
        <h2>{t('suggestTitle', locale)}</h2>
        <p className="notice">{t('submitThanks', locale)}</p>
      </div>
    )
  }

  return (
    <div className="page">
      <h2>{t('suggestTitle', locale)}</h2>
      <p>{t('suggestIntro', locale)}</p>
      <p className="field-hint">{t('noAccountNeeded', locale)}</p>

      <form onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span>
            {t('fieldName', locale)} <span aria-hidden="true">*</span>
            <span className="visually-hidden">({t('required', locale)})</span>
          </span>
          <input
            type="text"
            value={name}
            required
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
          />
        </label>

        <label className="field">
          <span>{t('fieldCategory', locale)}</span>
          <select value={category} onChange={(event) => setCategory(event.target.value as Category)}>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {t(item, locale)}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>{t('fieldAccess', locale)}</span>
          <select
            value={accessType}
            onChange={(event) => setAccessType(event.target.value as AccessType)}
          >
            {ACCESS_TYPES.map((item) => (
              <option key={item} value={item}>
                {ACCESS_LABELS[item][locale]}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>
            {t('fieldDescription', locale)} <span aria-hidden="true">*</span>
            <span className="visually-hidden">({t('required', locale)})</span>
          </span>
          <textarea
            value={description}
            required
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        <label className="field">
          <span>{t('fieldAddress', locale)}</span>
          <input
            type="text"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            autoComplete="off"
          />
        </label>

        <label className="field">
          <span>{t('fieldPhone', locale)}</span>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            autoComplete="off"
          />
        </label>

        <label className="field">
          <span>{t('fieldNotes', locale)}</span>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>

        {status === 'failed' ? <p className="field-error">{t('submitFailed', locale)}</p> : null}

        <button type="submit" className="btn" disabled={status === 'sending'}>
          {status === 'sending' ? t('submitting', locale) : t('submit', locale)}
        </button>
      </form>
    </div>
  )
}
