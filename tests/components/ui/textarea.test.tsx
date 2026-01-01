import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Textarea } from '@/components/ui/textarea'

describe('Textarea', () => {
  it('renders textarea element', () => {
    render(<Textarea />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('handles multi-line input', async () => {
    const user = userEvent.setup()
    render(<Textarea />)

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Line 1{Enter}Line 2')

    expect(textarea).toHaveValue('Line 1\nLine 2')
  })

  it('handles value changes', async () => {
    const user = userEvent.setup()
    render(<Textarea />)

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Test value')

    expect(textarea).toHaveValue('Test value')
  })

  it('accepts placeholder', () => {
    render(<Textarea placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('handles disabled state', () => {
    render(<Textarea disabled />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeDisabled()
  })

  it('respects rows attribute', () => {
    render(<Textarea rows={5} />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('rows', '5')
  })
})
