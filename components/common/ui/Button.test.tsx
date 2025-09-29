import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from './Button';

describe('Button component', () => {
    it('renders primary button correctly', () => {
        const { getByText } = render(<Button>Click Me</Button>);
        expect(getByText('Click Me')).toMatchSnapshot();
    });

    it('renders secondary button correctly', () => {
        const { getByText } = render(<Button variant="secondary">Click Me</Button>);
        expect(getByText('Click Me')).toMatchSnapshot();
    });

    it('renders destructive button correctly', () => {
        const { getByText } = render(<Button variant="destructive">Delete</Button>);
        expect(getByText('Delete')).toMatchSnapshot();
    });

    it('renders ghost button correctly', () => {
        const { getByText } = render(<Button variant="ghost">Cancel</Button>);
        expect(getByText('Cancel')).toMatchSnapshot();
    });

    it('renders disabled button correctly', () => {
        const { getByText } = render(<Button disabled>Disabled</Button>);
        expect(getByText('Disabled')).toMatchSnapshot();
    });

    it('renders large button correctly', () => {
        const { getByText } = render(<Button size="lg">Large</Button>);
        expect(getByText('Large')).toMatchSnapshot();
    });
});
