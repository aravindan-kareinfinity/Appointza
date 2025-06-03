import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import { AppView } from './appview.component';
import { AppText } from './apptext.component';
import { $ } from '../styles';
import { CustomIcon, CustomIcons } from './customicons.component';
import { AppButton } from './appbutton.component';
import { Button } from './button.component';
type BottomSheetProps = {
    children: React.ReactNode;
    Buttonname?: string,
    screenname: string
    Save: () => void;
    close: () => void;
    showbutton?: boolean;

}
export const BottomSheetComponent = forwardRef<any, BottomSheetProps>((props, ref) => {
    const bottomSheetRef = useRef<any>(null);
    React.useImperativeHandle(ref, () => ({
        open: () => bottomSheetRef.current?.open(),
        close: () => bottomSheetRef.current?.close(),
    }));
    const [showbutton, setShowbutton] = useState<boolean>(props?.showbutton ?? true);

    useEffect(() => {
        setShowbutton(props?.showbutton ?? true);
    }, []);

    const screenHeight = Dimensions.get('window').height;

    return (
        <AppView>


            {/* Bottom Sheet */}
            <RBSheet
                ref={bottomSheetRef}
                height={screenHeight / 2} // Customize height
                openDuration={250} // Animation duration
                // closeOnDragDown={true}
                closeOnPressMask={true}
                customStyles={{
                    container: {
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        padding: 20,
                        backgroundColor: 'white',
                    },
                    draggableIcon: {
                        backgroundColor: '#ccc'
                    }
                }}
            >

                <AppText style={[$.fw_semibold, $.mb_medium, $.fs_medium, {color: '#333'}]}>{props.screenname}</AppText>

                <ScrollView style={[$.flex_1,$.text_primary5]}>

                    {props.children}
                </ScrollView>
           { showbutton &&    <AppView
                    style={[
                        $.flex_row,
                        $.justify_content_center,

                    ]}>
                        <Button title={'Cancel'} variant='cancel' style={[ $.flex_1, $.mr_small]}
                        onPress={
                            () => { props.close() }
                        }/>
                 <Button title={'Save'} variant='save' style={[$.flex_1]}
                        textStyle={[$.text_tint_11]}
                        onPress={() => { props.Save() }}
                    />
                </AppView>}
            </RBSheet>
        </AppView>
    );
});
