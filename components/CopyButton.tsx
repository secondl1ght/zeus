import * as React from 'react';
import Clipboard from '@react-native-community/clipboard';
import Button from './../components/Button';
import { localeString } from './../utils/LocaleUtils';

interface CopyButtonProps {
    title?: string;
    copyValue: string;
}

interface CopyButtonState {
    copied: boolean;
}

export default class CopyButton extends React.Component<
    CopyButtonProps,
    CopyButtonState
> {
    isComponentMounted = false;

    state = {
        copied: false
    };

    componentDidMount() {
        this.isComponentMounted = true;
    }

    componentWillUnmount() {
        this.isComponentMounted = false;
    }

    copyToClipboard = () => {
        const { copyValue } = this.props;
        this.setState({
            copied: true
        });

        Clipboard.setString(copyValue);

        setTimeout(() => {
            if (this.isComponentMounted) {
                this.setState({
                    copied: false
                });
            }
        }, 5000);
    };

    render() {
        const { copied } = this.state;
        const { title } = this.props;

        const buttonTitle = copied
            ? localeString('components.CopyButton.copied')
            : title || localeString('components.CopyButton.copy');

        return (
            <Button
                title={buttonTitle}
                icon={{
                    name: 'content-copy',
                    size: 25
                }}
                containerStyle={{
                    marginBottom: 20
                }}
                onPress={() => this.copyToClipboard()}
                secondary
            />
        );
    }
}
