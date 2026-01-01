import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

describe('Label', () => {
  it('renders label element', () => {
    render(<Label>Test Label</Label>)
    expect(screen.getByText('Test Label')).toBeInTheDocument()
  })

  it('associates with form controls via htmlFor', () => {
    render(
      <>
        <Label htmlFor="test-input">Test Label</Label>
        <Input id="test-input" />
      </>
    )

    const label = screen.getByText('Test Label')
    const input = screen.getByRole('textbox')

    expect(label).toHaveAttribute('for', 'test-input')
    expect(input).toHaveAttribute('id', 'test-input')
  })

  it('associates with form controls via nested input', () => {
    render(
      <Label>
        Test Label
        <Input />
      </Label>
    )

    const label = screen.getByText('Test Label')
    const input = screen.getByRole('textbox')

    expect(label).toContainElement(input)
  })

  it('handles click events', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Label htmlFor="test-input">Test Label</Label>
        <Input id="test-input" />
      </>
    )

    const label = screen.getByText('Test Label')
    const input = screen.getByRole('textbox')

    await user.click(label)

    expect(input).toHaveFocus()
  })
})
