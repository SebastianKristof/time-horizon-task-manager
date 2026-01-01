import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from '@/components/ui/checkbox'

describe('Checkbox', () => {
  it('renders checkbox element', () => {
    render(<Checkbox />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeInTheDocument()
  })

  it('toggles checked state', async () => {
    const user = userEvent.setup()
    render(<Checkbox />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)
    expect(checkbox).toBeChecked()

    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })

  it('handles disabled state', () => {
    render(<Checkbox disabled />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeDisabled()
  })

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup()
    render(<Checkbox checked disabled />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
    expect(checkbox).toBeDisabled()

    await user.click(checkbox)
    expect(checkbox).toBeChecked() // Should remain checked
  })

  it('accepts controlled checked state', () => {
    const { rerender } = render(<Checkbox checked />)
    expect(screen.getByRole('checkbox')).toBeChecked()

    rerender(<Checkbox checked={false} />)
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })
})
