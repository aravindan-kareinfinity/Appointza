import {ReactNode} from 'react';
import {AppText} from './apptext.component';
import {$} from '../styles';

export const HeaderTitle = (props: {children: ReactNode}) => (
  <AppText style={[$.text_center]}>{props.children}</AppText>
);
