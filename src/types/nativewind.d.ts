/// <reference types="nativewind/types" />

declare module 'nativewind' {
  import type { ComponentType } from 'react';
  import type { ViewProps, TextProps } from 'react-native';

  type StyledProps = {
    className?: string;
  };

  export function styled<T extends ComponentType<any>>(
    Component: T
  ): ComponentType<StyledProps & React.ComponentProps<T>>;

  export type StyledComponent<T> = ComponentType<StyledProps & React.ComponentProps<T>>;
} 