import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner component', () => {
    it('renders correctly with default props', () => {
        const { container } = render(<Spinner />);
        expect(container.firstChild).toMatchSnapshot();
    });

    it('renders correctly with size="sm"', () => {
        const { container } = render(<Spinner size="sm" />);
        expect(container.firstChild).toMatchSnapshot();
    });

    it('renders correctly with size="lg"', () => {
        const { container } = render(<Spinner size="lg" />);
        expect(container.firstChild).toMatchSnapshot();
    });
});
