import React, { forwardRef, useRef } from 'react';
import { Dimensions, TouchableOpacity } from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import { AppView } from './appview.component';
import { AppText } from './apptext.component';
import { $ } from '../styles';
import { CustomIcon, CustomIcons } from './customicons.component';
import { AppButton } from './appbutton.component';
type BottomSheetProps = {
    children: React.ReactNode;
    Buttonname?: string,
    screenname: string
    Save: () => void;
    close: () => void;

}
export const BottomSheetComponent = forwardRef<any, BottomSheetProps>((props, ref) => {
    const bottomSheetRef = useRef<any>(null);
    React.useImperativeHandle(ref, () => ({
        open: () => bottomSheetRef.current?.open(),
        close: () => bottomSheetRef.current?.close(),
    }));

    const screenHeight = Dimensions.get('window').height;

    return (
        <AppView>


            {/* Bottom Sheet */}
            <RBSheet
                ref={bottomSheetRef}
                height={screenHeight / 1.5} // Customize height
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

                <AppText style={[$.text_tint_4, $.fs_medium]}>{props.screenname}</AppText>

                <AppView style={[$.flex_1]}>

                    {props.children}
                </AppView>
                <AppView
                    style={[
                        $.flex_row,
                        $.justify_content_center,

                    ]}>
                    <AppButton
                        name="Cancel"
                        style={[$.bg_tint_10, $.flex_1, $.mr_small]}
                        textstyle={[$.text_danger]}
                        onPress={
                            () => { props.close() }
                        }
                    />
                    <AppButton
                        name="Save"
                        style={[$.bg_success, $.flex_1]}
                        textstyle={[$.text_tint_11]}
                        onPress={() => { props.Save() }}
                    />
                </AppView>
            </RBSheet>
        </AppView>
    );
});
