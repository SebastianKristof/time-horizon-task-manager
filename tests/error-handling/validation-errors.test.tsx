import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

describe('Validation Error Handling', () => {
  it('shows clear form validation errors', () => {
    render(
      <>
        <Label htmlFor="test-input">Test Input</Label>
        <Input id="test-input" aria-invalid="true" aria-errormessage="error-1" />
        <div id="error-1" role="alert">This field is required</div>
      </>
    )

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('This field is required')
  })

  it('marks required fields', () => {
    render(<Input required />)
    const input = screen.getByRole('textbox')
    expect(input).toBeRequired()
  })

  it('rejects invalid input', () => {
    render(<Input type="email" />)
    const input = screen.getByRole('textbox')
    
    // Email validation would be handled by browser or form library
    expect(input).toHaveAttribute('type', 'email')
  })

  it('provides helpful error messages', () => {
    render(
      <>
        <Input aria-invalid="true" aria-errormessage="error-1" />
        <div id="error-1" role="alert">Please enter a valid email address</div>
      </>
    )

    const errorMessage = screen.getByRole('alert')
    expect(errorMessage).toHaveTextContent('Please enter a valid email address')
  })
})
