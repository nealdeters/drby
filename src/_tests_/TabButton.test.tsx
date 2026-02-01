import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { TabButton } from '../components/TabButton';

describe('TabButton', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <TabButton title="Test Tab" active={false} onPress={() => {}} />
    );
    expect(getByText(/Test Tab/i)).toBeTruthy();
  });

  it('calls onPress when clicked', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <TabButton title="Test Tab" active={false} onPress={onPress} />
    );
    fireEvent.click(getByText(/Test Tab/i));
    expect(onPress).toHaveBeenCalled();
  });
});