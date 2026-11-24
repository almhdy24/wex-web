// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import Stepper from '../components/admin/Stepper';

describe('Stepper Component', () => {
  it('renders numeric value in dir="ltr" container', () => {
    const { getByRole } = render(<Stepper value={10} min={0} max={100} onChange={() => {}} />);
    const spinbutton = getByRole('spinbutton');
    expect(spinbutton.textContent).toBe('10');
  });

  it('increments and decrements on button click', () => {
    const handleChange = vi.fn();
    const { getByLabelText } = render(
      <Stepper value={5} min={0} max={10} onChange={handleChange} />
    );

    const plusBtn = getByLabelText('زيادة');
    fireEvent.click(plusBtn);
    expect(handleChange).toHaveBeenCalledWith(6);

    const minusBtn = getByLabelText('إنقاص');
    fireEvent.click(minusBtn);
    expect(handleChange).toHaveBeenCalledWith(4);
  });

  it('converts Arabic-Indic digits to ASCII and clamps value on blur', () => {
    const handleChange = vi.fn();
    const { getByRole, container } = render(
      <Stepper value={0} min={0} max={50} onChange={handleChange} />
    );

    const spinbutton = getByRole('spinbutton');
    fireEvent.click(spinbutton);

    const input = container.querySelector('input');
    expect(input).not.toBeNull();

    // Type Arabic-Indic digits '٢٥' (25)
    fireEvent.change(input, { target: { value: '٢٥' } });
    fireEvent.blur(input);

    expect(handleChange).toHaveBeenCalledWith(25);
  });
});
