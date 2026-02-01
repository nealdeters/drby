import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TabButton } from './TabButton';

describe('TabButton', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <TabButton title="Test Tab" active={false} onPress={() => {}} />
    );
    expect(getByText('Test Tab')).toBeTruthy();
  });

  it('calls onPress when clicked', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <TabButton title="Test Tab" active={false} onPress={onPress} />
    );
    fireEvent.press(getByText('Test Tab'));
    expect(onPress).toHaveBeenCalled();
  });
});