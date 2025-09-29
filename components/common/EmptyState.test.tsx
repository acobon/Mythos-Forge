import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import EmptyState from './EmptyState';
import { UsersIcon } from './Icons';

describe('EmptyState component', () => {
    it('renders correctly without children', () => {
        const { getByText } = render(
            <EmptyState
                icon={<UsersIcon />}
                title="No Users"
                description="There are no users to display."
            />
        );
        expect(getByText('No Users').parentElement).toMatchSnapshot();
    });

    it('renders correctly with children', () => {
        const { getByText } = render(
            <EmptyState
                icon={<UsersIcon />}
                title="No Users"
                description="There are no users to display."
            >
                <button>Add User</button>
            </EmptyState>
        );
        expect(getByText('No Users').parentElement).toMatchSnapshot();
    });
});
