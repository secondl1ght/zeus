import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Button from './../components/Button';
import CopyButton from './CopyButton';
import { localeString } from './../utils/LocaleUtils';
import { themeColor } from './../utils/ThemeUtils';

const secondaryLogo = require('../images/secondary.png');

interface CollapsedQRProps {
    value: string;
    showText?: string;
    collapseText?: string;
    copyText?: string;
    hideText?: boolean;
}

interface CollapsedQRState {
    collapsed: boolean;
}

export default class CollapsedQR extends React.Component<
    CollapsedQRProps,
    CollapsedQRState
> {
    state = {
        collapsed: true
    };

    toggleCollapse = () => {
        this.setState({
            collapsed: !this.state.collapsed
        });
    };

    render() {
        const { collapsed } = this.state;
        const { value, showText, copyText, collapseText, hideText } =
            this.props;

        return (
            <React.Fragment>
                {!hideText && (
                    <Text
                        style={{
                            ...styles.value,
                            color: themeColor('secondaryText')
                        }}
                    >
                        {value}
                    </Text>
                )}
                {!collapsed && (
                    <View style={styles.qrPadding}>
                        <QRCode value={value} size={350} logo={secondaryLogo} />
                    </View>
                )}
                <Button
                    title={
                        collapsed
                            ? showText ||
                              localeString('components.CollapsedQr.show')
                            : collapseText ||
                              localeString('components.CollapsedQr.hide')
                    }
                    icon={{
                        name: 'qrcode',
                        type: 'font-awesome',
                        size: 25,
                        color: '#fff'
                    }}
                    containerStyle={{
                        marginTop: collapsed ? 10 : 0,
                        marginBottom: 10
                    }}
                    onPress={() => this.toggleCollapse()}
                />
                <CopyButton copyValue={value} title={copyText} />
            </React.Fragment>
        );
    }
}

const styles = StyleSheet.create({
    value: {
        marginBottom: 15,
        paddingLeft: 20
    },
    qrPadding: {
        backgroundColor: 'white',
        alignItems: 'center',
        alignSelf: 'center',
        padding: 5,
        marginBottom: 10
    }
});
