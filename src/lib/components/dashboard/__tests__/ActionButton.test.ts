import { render, screen } from '@testing-library/svelte';
import { vi } from 'vitest';
import ActionButton from '../ActionButton.svelte';

describe('ActionButton', () => {
	it('should render with primary variant by default', () => {
		render(ActionButton, {
			props: {
				children: () => 'Click me'
			}
		});
		
		const button = screen.getByRole('button', { name: 'Click me' });
		expect(button).toBeInTheDocument();
		expect(button).toHaveClass('primary');
	});

	it('should show loading state', () => {
		render(ActionButton, {
			props: {
				loading: true,
				children: () => 'Loading...'
			}
		});
		
		const button = screen.getByRole('button');
		expect(button).toHaveClass('loading');
	});

	it('should be disabled when disabled prop is true', () => {
		render(ActionButton, {
			props: {
				disabled: true,
				children: () => 'Disabled'
			}
		});
		
		const button = screen.getByRole('button');
		expect(button).toBeDisabled();
	});

	it('should call onclick when clicked', async () => {
		const mockClick = vi.fn();
		const { component } = render(ActionButton, {
			props: {
				onclick: mockClick,
				children: () => 'Click me'
			}
		});
		
		const button = screen.getByRole('button');
		await button.click();
		
		expect(mockClick).toHaveBeenCalledTimes(1);
	});
});