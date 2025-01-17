import * as React from 'react';
import {
    ActivityIndicator,
    ActionSheetIOS,
    Modal,
    Platform,
    StyleSheet,
    Text,
    View,
    ScrollView,
    TextInput,
    TouchableOpacity
} from 'react-native';
import Clipboard from '@react-native-community/clipboard';
import { Picker } from '@react-native-picker/picker';
import { CheckBox, Header, Icon } from 'react-native-elements';
import { inject, observer } from 'mobx-react';
import AddressUtils, { DEFAULT_LNDHUB } from './../../utils/AddressUtils';
import LndConnectUtils from './../../utils/LndConnectUtils';
import { localeString } from './../../utils/LocaleUtils';
import { themeColor } from './../../utils/ThemeUtils';
import Button from './../../components/Button';
import CollapsedQR from './../../components/CollapsedQR';
import DropdownSetting from './../../components/DropdownSetting';
import SettingsStore, { INTERFACE_KEYS } from './../../stores/SettingsStore';

interface AddEditNodeProps {
    navigation: any;
    SettingsStore: SettingsStore;
}

interface AddEditNodeState {
    nickname: string; //
    host: string; // lnd
    port: string | number; // lnd
    macaroonHex: string; // lnd
    url: string; // spark, eclair
    accessKey: string; // spark
    lndhubUrl: string; // lndhub
    username: string | undefined; // lndhub
    password: string | undefined; // lndhub, eclair
    existingAccount: boolean; // lndhub
    implementation: string;
    certVerification: boolean;
    saved: boolean;
    active: boolean;
    index: number;
    newEntry: boolean;
    suggestImport: string;
    showLndHubModal: boolean;
    showCertModal: boolean;
    enableTor: boolean;
}

@inject('SettingsStore')
@observer
export default class AddEditNode extends React.Component<
    AddEditNodeProps,
    AddEditNodeState
> {
    isComponentMounted = false;

    state = {
        nickname: '',
        host: '',
        port: '',
        macaroonHex: '',
        saved: false,
        index: 0,
        active: false,
        newEntry: false,
        implementation: 'lnd',
        certVerification: false,
        enableTor: false,
        existingAccount: false,
        suggestImport: '',
        url: '',
        lndhubUrl: DEFAULT_LNDHUB,
        showLndHubModal: false,
        showCertModal: false,
        username: '',
        password: '',
        accessKey: ''
    };

    async UNSAFE_componentWillMount() {
        const { SettingsStore } = this.props;
        const { settings } = SettingsStore;

        if (settings.privacy && settings.privacy.clipboard) {
            const clipboard = await Clipboard.getString();

            if (
                clipboard.includes('lndconnect://') ||
                clipboard.includes('lndhub://') ||
                clipboard.includes('bluewallet:')
            ) {
                this.setState({
                    suggestImport: clipboard
                });
            }
        }
    }

    importClipboard = () => {
        const { suggestImport } = this.state;

        if (suggestImport.includes('lndconnect://')) {
            const { host, port, macaroonHex } =
                LndConnectUtils.processLndConnectUrl(suggestImport);

            this.setState({
                host,
                port,
                macaroonHex,
                suggestImport: '',
                enableTor: host.includes('.onion')
            });
        } else if (
            suggestImport.includes('lndhub://') ||
            suggestImport.includes('bluewallet:')
        ) {
            const { username, password, host } =
                AddressUtils.processLNDHubAddress(suggestImport);

            const existingAccount = !!username;

            if (host) {
                this.setState({
                    username,
                    password,
                    lndhubUrl: host,
                    implementation: 'lndhub',
                    suggestImport: '',
                    enableTor: host.includes('.onion'),
                    existingAccount
                });
            } else {
                this.setState({
                    username,
                    password,
                    implementation: 'lndhub',
                    suggestImport: '',
                    existingAccount
                });
            }
        }

        Clipboard.setString('');
    };

    clearImportSuggestion = () => {
        this.setState({
            suggestImport: ''
        });
    };

    async componentDidMount() {
        this.isComponentMounted = true;
        this.initFromProps(this.props);
    }

    componentWillUnmount() {
        this.isComponentMounted = false;
    }

    UNSAFE_componentWillReceiveProps(nextProps: any) {
        this.initFromProps(nextProps);
    }

    initFromProps(props: any) {
        const { navigation } = props;

        const node = navigation.getParam('node', null);
        const index = navigation.getParam('index', null);
        const active = navigation.getParam('active', null);
        const saved = navigation.getParam('saved', null);
        const newEntry = navigation.getParam('newEntry', null);

        if (node) {
            const {
                nickname,
                host,
                port,
                macaroonHex,
                url,
                lndhubUrl,
                existingAccount,
                accessKey,
                username,
                password,
                implementation,
                certVerification,
                enableTor
            } = node;

            this.setState({
                nickname,
                host,
                port,
                macaroonHex,
                url,
                lndhubUrl,
                existingAccount,
                accessKey,
                username,
                password,
                implementation: implementation || 'lnd',
                certVerification,
                index,
                active,
                saved,
                newEntry,
                enableTor
            });
        } else {
            this.setState({
                index,
                active,
                newEntry
            });
        }
    }

    saveNodeConfiguration = () => {
        const { SettingsStore, navigation } = this.props;
        const {
            nickname,
            host,
            port,
            url,
            enableTor,
            lndhubUrl,
            existingAccount,
            macaroonHex,
            accessKey,
            username,
            password,
            implementation,
            certVerification,
            index
        } = this.state;
        const { setSettings, settings } = SettingsStore;
        const { privacy, passphrase, fiat, locale } = settings;
        const { lurkerMode } = privacy;

        if (
            implementation === 'lndhub' &&
            (!lndhubUrl || !username || !password)
        ) {
            throw new Error('lndhub settings missing.');
        }

        const node = {
            nickname,
            host,
            port,
            url,
            lndhubUrl,
            existingAccount,
            macaroonHex,
            accessKey,
            username,
            password,
            implementation,
            certVerification,
            enableTor
        };

        let nodes: any;
        if (settings.nodes) {
            nodes = settings.nodes;
            nodes[index] = node;
        } else {
            nodes = [node];
        }

        setSettings(
            JSON.stringify({
                nodes,
                theme: settings.theme,
                selectedNode: settings.selectedNode,
                onChainAddress: settings.onChainAddress,
                fiat,
                locale,
                lurkerMode,
                passphrase,
                privacy: settings.privacy
            })
        ).then(() => {
            this.setState({
                saved: true
            });

            if (nodes.length === 1) {
                navigation.navigate('Wallet', { refresh: true });
            } else {
                navigation.navigate('Settings', { refresh: true });
            }
        });
    };

    deleteNodeConfig = () => {
        const { SettingsStore, navigation } = this.props;
        const { setSettings, settings } = SettingsStore;
        const { index } = this.state;
        const { nodes, lurkerMode, passphrase, fiat, locale } = settings;

        const newNodes: any = [];
        for (let i = 0; nodes && i < nodes.length; i++) {
            if (index !== i) {
                newNodes.push(nodes[i]);
            }
        }

        setSettings(
            JSON.stringify({
                nodes: newNodes,
                theme: settings.theme,
                selectedNode:
                    index === settings.selectedNode ? 0 : settings.selectedNode,
                onChainAddress: settings.onChainAddress,
                fiat,
                locale,
                lurkerMode,
                passphrase,
                privacy: settings.privacy
            })
        ).then(() => {
            navigation.navigate('Wallet', { refresh: true });
        });
    };

    setNodeConfigurationAsActive = () => {
        const { SettingsStore, navigation } = this.props;
        const { setSettings, settings } = SettingsStore;
        const { index } = this.state;
        const { nodes, lurkerMode, passphrase, fiat, locale } = settings;

        setSettings(
            JSON.stringify({
                nodes,
                theme: settings.theme,
                selectedNode: index,
                onChainAddress: settings.onChainAddress,
                fiat,
                locale,
                lurkerMode,
                passphrase,
                privacy: settings.privacy
            })
        );

        this.setState({
            active: true
        });

        navigation.navigate('Wallet', { refresh: true });
    };

    render() {
        const { navigation, SettingsStore } = this.props;
        const {
            nickname,
            host,
            port,
            url,
            lndhubUrl,
            macaroonHex,
            accessKey,
            username,
            password,
            saved,
            active,
            index,
            newEntry,
            implementation,
            certVerification,
            enableTor,
            existingAccount,
            suggestImport,
            showLndHubModal,
            showCertModal
        } = this.state;
        const {
            loading,
            createAccountError,
            createAccountSuccess,
            settings,
            createAccount
        } = SettingsStore;

        const BackButton = () => (
            <Icon
                name="arrow-back"
                onPress={() =>
                    navigation.navigate('Settings', { refresh: true })
                }
                color="#fff"
                underlayColor="transparent"
            />
        );

        const CertInstallInstructions = () => (
            <View style={styles.button}>
                <Button
                    title={localeString(
                        'views.Settings.AddEditNode.certificateButton'
                    )}
                    onPress={() => {
                        this.setState({
                            showCertModal: false
                        });
                        navigation.navigate('CertInstallInstructions');
                    }}
                    titleStyle={{
                        color: 'white'
                    }}
                    secondary
                />
            </View>
        );

        const displayValue = INTERFACE_KEYS.filter(
            (value: any) => value.value === implementation
        )[0].key;

        const NodeInterface = () => (
            <DropdownSetting
                title={localeString('views.Settings.AddEditNode.nodeInterface')}
                selectedValue={displayValue}
                onValueChange={(value: string) => {
                    this.setState({
                        implementation: value,
                        saved: false,
                        certVerification: value === 'lndhub' ? true : false
                    });
                }}
                values={INTERFACE_KEYS}
            />
        );

        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: themeColor('background'),
                    color: themeColor('text')
                }}
            >
                <Header
                    leftComponent={<BackButton />}
                    centerComponent={{
                        text: localeString(
                            'views.Settings.AddEditNode.nodeConfig'
                        ),
                        style: { color: '#fff' }
                    }}
                    backgroundColor="#1f2328"
                />
                {!!suggestImport && (
                    <View style={styles.clipboardImport}>
                        <Text style={{ color: 'white' }}>
                            {localeString(
                                'views.Settings.AddEditNode.connectionStringClipboard'
                            )}
                        </Text>
                        <Text style={{ color: 'white', padding: 15 }}>
                            {suggestImport.length > 100
                                ? `${suggestImport.substring(0, 100)}...`
                                : suggestImport}
                        </Text>
                        <Text style={{ color: 'white' }}>
                            {localeString(
                                'views.Settings.AddEditNode.importPrompt'
                            )}
                        </Text>
                        <View style={styles.button}>
                            <Button
                                title={localeString(
                                    'views.Settings.AddEditNode.import'
                                )}
                                onPress={() => this.importClipboard()}
                                titleStyle={{
                                    color: 'rgba(92, 99,216, 1)'
                                }}
                                tertiary
                            />
                        </View>
                        <View style={styles.button}>
                            <Button
                                title={localeString('general.cancel')}
                                onPress={() => this.clearImportSuggestion()}
                                titleStyle={{
                                    color: 'rgba(92, 99,216, 1)'
                                }}
                                tertiary
                            />
                        </View>
                    </View>
                )}

                {loading && (
                    <View style={{ padding: 10 }}>
                        <ActivityIndicator size="large" color="#0000ff" />
                    </View>
                )}

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={showLndHubModal || showCertModal}
                >
                    <View style={styles.centeredView}>
                        <View style={styles.modal}>
                            {showLndHubModal && (
                                <>
                                    <Text style={{ fontSize: 40 }}>
                                        {localeString('general.warning')}
                                    </Text>
                                    <Text style={{ paddingTop: 20 }}>
                                        {localeString(
                                            'views.Settings.AddEditNode.lndhubWarning'
                                        )}
                                    </Text>
                                    <Text
                                        style={{
                                            paddingTop: 20,
                                            paddingBottom: 20
                                        }}
                                    >
                                        {localeString(
                                            'views.Settings.AddEditNode.lndhubFriend'
                                        )}
                                    </Text>
                                    <View style={styles.button}>
                                        <Button
                                            title={localeString(
                                                'views.Settings.AddEditNode.lndhubUnderstand'
                                            )}
                                            onPress={() => {
                                                createAccount(
                                                    lndhubUrl,
                                                    certVerification
                                                ).then((data: any) => {
                                                    if (data) {
                                                        this.setState({
                                                            username:
                                                                data.login,
                                                            password:
                                                                data.password,
                                                            existingAccount:
                                                                true
                                                        });
                                                    }

                                                    this.setState({
                                                        showLndHubModal: false
                                                    });
                                                });
                                            }}
                                            secondary
                                        />
                                    </View>
                                    <View style={styles.button}>
                                        <Button
                                            title={localeString(
                                                'general.cancel'
                                            )}
                                            onPress={() =>
                                                this.setState({
                                                    showLndHubModal: false
                                                })
                                            }
                                            secondary
                                        />
                                    </View>
                                </>
                            )}
                            {showCertModal && (
                                <>
                                    <Text style={{ fontSize: 40 }}>
                                        {localeString('general.warning')}
                                    </Text>
                                    <Text style={{ paddingTop: 20 }}>
                                        {localeString(
                                            'views.Settings.AddEditNode.certificateWarning1'
                                        )}
                                    </Text>
                                    <Text
                                        style={{
                                            paddingTop: 20,
                                            paddingBottom: 20
                                        }}
                                    >
                                        {localeString(
                                            'views.Settings.AddEditNode.certificateWarning2'
                                        )}
                                    </Text>
                                    <CertInstallInstructions />
                                    <View style={styles.button}>
                                        <Button
                                            title={localeString(
                                                'views.Settings.AddEditNode.certificateUnderstand'
                                            )}
                                            onPress={() => {
                                                this.saveNodeConfiguration();
                                                this.setState({
                                                    showCertModal: false
                                                });
                                            }}
                                            buttonStyle={{
                                                borderRadius: 30
                                            }}
                                            secondary
                                        />
                                    </View>
                                    <View style={styles.button}>
                                        <Button
                                            title={localeString(
                                                'general.cancel'
                                            )}
                                            onPress={() =>
                                                this.setState({
                                                    showCertModal: false
                                                })
                                            }
                                            buttonStyle={{
                                                borderRadius: 30,
                                                backgroundColor: 'grey'
                                            }}
                                            secondary
                                        />
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                </Modal>

                {false && (
                    <View style={{ height: 200 }}>
                        <View style={{ alignItems: 'center', top: 40 }}></View>
                        <Text
                            style={{
                                alignSelf: 'center',
                                top: 50,
                                fontSize: 23,
                                color: themeColor('text')
                            }}
                        >
                            {nickname
                                ? nickname
                                : host
                                ? `${host}:${port}`
                                : ''}
                        </Text>
                        <View
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                top: 60
                            }}
                        >
                            {false && (
                                <View
                                    style={{
                                        backgroundColor: '#FFB040',
                                        height: 26,
                                        width: 70,
                                        borderRadius: 8,
                                        right: 5
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: themeColor('text'),
                                            alignSelf: 'center',
                                            padding: 2
                                        }}
                                    >
                                        Mainnet
                                    </Text>
                                </View>
                            )}
                            {enableTor && (
                                <View
                                    style={{
                                        backgroundColor: '#8A3ABD',
                                        height: 26,
                                        width: 70,
                                        borderRadius: 8,
                                        left: 5
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: themeColor('text'),
                                            alignSelf: 'center',
                                            padding: 2
                                        }}
                                    >
                                        Tor
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                <ScrollView style={{ flex: 1, padding: 15 }}>
                    <View style={styles.form}>
                        {!!createAccountError &&
                            implementation === 'lndhub' &&
                            !loading && (
                                <Text style={{ color: 'red', marginBottom: 5 }}>
                                    {createAccountError}
                                </Text>
                            )}

                        {!!createAccountSuccess &&
                            implementation === 'lndhub' &&
                            !loading && (
                                <Text
                                    style={{ color: 'green', marginBottom: 5 }}
                                >
                                    {createAccountSuccess}
                                </Text>
                            )}

                        <View>
                            <Text
                                style={{ color: themeColor('secondaryText') }}
                            >
                                {localeString(
                                    'views.Settings.AddEditNode.nickname'
                                )}
                            </Text>
                            <TextInput
                                placeholder={'My lightning node'}
                                value={nickname}
                                onChangeText={(text: string) =>
                                    this.setState({
                                        nickname: text,
                                        saved: false
                                    })
                                }
                                numberOfLines={1}
                                style={{
                                    ...styles.textInput,
                                    color: themeColor('text')
                                }}
                                editable={!loading}
                                placeholderTextColor="gray"
                            />
                        </View>

                        <NodeInterface />

                        {(implementation === 'spark' ||
                            implementation == 'eclair') && (
                            <>
                                <Text
                                    style={{
                                        color: themeColor('secondaryText')
                                    }}
                                >
                                    {localeString(
                                        'views.Settings.AddEditNode.host'
                                    )}
                                </Text>
                                <TextInput
                                    placeholder={'http://192.168.1.2:9737'}
                                    value={url}
                                    onChangeText={(text: string) =>
                                        this.setState({
                                            url: text.trim(),
                                            saved: false
                                        })
                                    }
                                    numberOfLines={1}
                                    style={{
                                        ...styles.textInput,
                                        color: themeColor('text')
                                    }}
                                    editable={!loading}
                                    placeholderTextColor="gray"
                                />

                                {implementation === 'spark' && (
                                    <>
                                        <Text
                                            style={{
                                                color: themeColor(
                                                    'secondaryText'
                                                )
                                            }}
                                        >
                                            {localeString(
                                                'views.Settings.AddEditNode.accessKey'
                                            )}
                                        </Text>
                                        <TextInput
                                            placeholder={'...'}
                                            value={accessKey}
                                            onChangeText={(text: string) => {
                                                this.setState({
                                                    accessKey: text.trim(),
                                                    saved: false
                                                });
                                            }}
                                            numberOfLines={1}
                                            style={{
                                                ...styles.textInput,
                                                color: themeColor('text')
                                            }}
                                            editable={!loading}
                                            placeholderTextColor="gray"
                                        />
                                    </>
                                )}
                                {implementation === 'eclair' && (
                                    <>
                                        <Text
                                            style={{
                                                color: themeColor(
                                                    'secondaryText'
                                                )
                                            }}
                                        >
                                            {localeString(
                                                'views.Settings.AddEditNode.password'
                                            )}
                                        </Text>
                                        <TextInput
                                            placeholder={'...'}
                                            value={password}
                                            onChangeText={(text: string) => {
                                                this.setState({
                                                    password: text.trim(),
                                                    saved: false
                                                });
                                            }}
                                            numberOfLines={1}
                                            style={{
                                                ...styles.textInput,
                                                color: themeColor('text')
                                            }}
                                            editable={!loading}
                                            placeholderTextColor="gray"
                                        />
                                    </>
                                )}
                            </>
                        )}
                        {implementation === 'lndhub' && (
                            <>
                                <Text
                                    style={{
                                        color: themeColor('secondaryText')
                                    }}
                                >
                                    {localeString(
                                        'views.Settings.AddEditNode.host'
                                    )}
                                </Text>
                                <TextInput
                                    placeholder={DEFAULT_LNDHUB}
                                    value={lndhubUrl}
                                    onChangeText={(text: string) =>
                                        this.setState({
                                            lndhubUrl: text.trim(),
                                            saved: false
                                        })
                                    }
                                    numberOfLines={1}
                                    style={{
                                        ...styles.textInput,
                                        color: themeColor('text')
                                    }}
                                    editable={!loading}
                                    placeholderTextColor="gray"
                                />

                                <View
                                    style={{
                                        marginTop: 5
                                    }}
                                >
                                    <CheckBox
                                        title={localeString(
                                            'views.Settings.AddEditNode.existingAccount'
                                        )}
                                        checked={existingAccount}
                                        onPress={() =>
                                            this.setState({
                                                existingAccount:
                                                    !existingAccount
                                            })
                                        }
                                    />
                                </View>

                                {existingAccount && (
                                    <>
                                        <Text
                                            style={{
                                                color: themeColor(
                                                    'secondaryText'
                                                )
                                            }}
                                        >
                                            {localeString(
                                                'views.Settings.AddEditNode.username'
                                            )}
                                        </Text>
                                        <TextInput
                                            placeholder={'...'}
                                            value={username}
                                            onChangeText={(text: string) =>
                                                this.setState({
                                                    username: text.trim(),
                                                    saved: false
                                                })
                                            }
                                            numberOfLines={1}
                                            style={{
                                                ...styles.textInput,
                                                color: themeColor('text')
                                            }}
                                            editable={!loading}
                                            placeholderTextColor="gray"
                                        />

                                        <Text
                                            style={{
                                                color: themeColor(
                                                    'secondaryText'
                                                )
                                            }}
                                        >
                                            {localeString(
                                                'views.Settings.AddEditNode.password'
                                            )}
                                        </Text>
                                        <TextInput
                                            placeholder={'...'}
                                            value={password}
                                            onChangeText={(text: string) =>
                                                this.setState({
                                                    password: text.trim(),
                                                    saved: false
                                                })
                                            }
                                            numberOfLines={1}
                                            style={{
                                                ...styles.textInput,
                                                color: themeColor('text')
                                            }}
                                            editable={!loading}
                                            secureTextEntry={saved}
                                            placeholderTextColor="gray"
                                        />
                                        {saved && (
                                            <CollapsedQR
                                                showText={localeString(
                                                    'views.Settings.AddEditNode.showAccountQR'
                                                )}
                                                collapseText={localeString(
                                                    'views.Settings.AddEditNode.hideAccountQR'
                                                )}
                                                value={
                                                    `lndhub://${username}:${password}` +
                                                    (lndhubUrl ===
                                                    DEFAULT_LNDHUB
                                                        ? ''
                                                        : `@${lndhubUrl}`)
                                                }
                                                hideText
                                            />
                                        )}
                                    </>
                                )}
                            </>
                        )}
                        {(implementation === 'lnd' ||
                            implementation === 'c-lightning-REST') && (
                            <>
                                <Text
                                    style={{
                                        color: themeColor('secondaryText')
                                    }}
                                >
                                    {localeString(
                                        'views.Settings.AddEditNode.host'
                                    )}
                                </Text>
                                <TextInput
                                    placeholder={'localhost'}
                                    value={host}
                                    onChangeText={(text: string) =>
                                        this.setState({
                                            host: text.trim(),
                                            saved: false
                                        })
                                    }
                                    numberOfLines={1}
                                    style={{
                                        ...styles.textInput,
                                        color: themeColor('text')
                                    }}
                                    editable={!loading}
                                    placeholderTextColor="gray"
                                />

                                <Text
                                    style={{
                                        color: themeColor('secondaryText')
                                    }}
                                >
                                    {localeString(
                                        'views.Settings.AddEditNode.restPort'
                                    )}
                                </Text>
                                <TextInput
                                    keyboardType="numeric"
                                    placeholder={'443/8080'}
                                    value={port}
                                    onChangeText={(text: string) =>
                                        this.setState({
                                            port: text.trim(),
                                            saved: false
                                        })
                                    }
                                    numberOfLines={1}
                                    style={{
                                        ...styles.textInput,
                                        color: themeColor('text')
                                    }}
                                    editable={!loading}
                                    placeholderTextColor="gray"
                                />

                                <Text
                                    style={{
                                        color: themeColor('secondaryText')
                                    }}
                                >
                                    {localeString(
                                        'views.Settings.AddEditNode.macaroon'
                                    )}
                                </Text>
                                <TextInput
                                    placeholder={'0A...'}
                                    value={macaroonHex}
                                    onChangeText={(text: string) =>
                                        this.setState({
                                            macaroonHex: text.trim(),
                                            saved: false
                                        })
                                    }
                                    numberOfLines={1}
                                    style={{
                                        ...styles.textInput,
                                        color: themeColor('text')
                                    }}
                                    editable={!loading}
                                    placeholderTextColor="gray"
                                />
                            </>
                        )}

                        <View
                            style={{
                                marginTop: 5
                            }}
                        >
                            <CheckBox
                                title={'Use Tor'}
                                checked={enableTor}
                                onPress={() =>
                                    this.setState({
                                        enableTor: !enableTor,
                                        saved: false
                                    })
                                }
                            />
                        </View>
                        {!enableTor && (
                            <View
                                style={{
                                    marginTop: 5
                                }}
                            >
                                <CheckBox
                                    title={localeString(
                                        'views.Settings.AddEditNode.certificateVerification'
                                    )}
                                    checked={certVerification}
                                    onPress={() =>
                                        this.setState({
                                            certVerification: !certVerification,
                                            saved: false
                                        })
                                    }
                                />
                            </View>
                        )}
                    </View>

                    {!existingAccount && implementation === 'lndhub' && (
                        <View style={styles.button}>
                            <Button
                                title={localeString(
                                    'views.Settings.AddEditNode.createLndhub'
                                )}
                                onPress={() => {
                                    if (lndhubUrl === DEFAULT_LNDHUB) {
                                        this.setState({
                                            showLndHubModal: true
                                        });
                                    } else {
                                        createAccount(
                                            lndhubUrl,
                                            certVerification,
                                            enableTor
                                        ).then((data: any) => {
                                            if (data) {
                                                this.setState({
                                                    username: data.login,
                                                    password: data.password,
                                                    existingAccount: true
                                                });
                                            }
                                        });
                                    }
                                }}
                            />
                        </View>
                    )}

                    <View style={styles.button}>
                        <Button
                            title={
                                saved
                                    ? localeString(
                                          'views.Settings.AddEditNode.nodeSaved'
                                      )
                                    : localeString(
                                          'views.Settings.AddEditNode.saveNode'
                                      )
                            }
                            onPress={() => {
                                if (!saved && !certVerification && !enableTor) {
                                    this.setState({ showCertModal: true });
                                } else {
                                    this.saveNodeConfiguration();
                                }
                            }}
                            buttonStyle={{
                                backgroundColor: saved ? '#fff' : '#261339',
                                borderRadius: 30
                            }}
                            titleStyle={{
                                color: saved ? 'black' : 'white'
                            }}
                        />
                    </View>

                    {!saved && certVerification && !enableTor && (
                        <CertInstallInstructions />
                    )}

                    {saved && !newEntry && (
                        <View style={styles.button}>
                            <Button
                                title={
                                    active
                                        ? localeString(
                                              'views.Settings.AddEditNode.nodeActive'
                                          )
                                        : localeString(
                                              'views.Settings.AddEditNode.setNodeActive'
                                          )
                                }
                                onPress={() =>
                                    this.setNodeConfigurationAsActive()
                                }
                                titleStyle={{
                                    color: active ? 'white' : 'purple'
                                }}
                            />
                        </View>
                    )}

                    {(implementation === 'lnd' ||
                        implementation === 'c-lightning-REST') && (
                        <View style={styles.button}>
                            <Button
                                title={localeString(
                                    'views.Settings.AddEditNode.scanLndconnect'
                                )}
                                onPress={() =>
                                    navigation.navigate(
                                        'LNDConnectConfigQRScanner',
                                        {
                                            index
                                        }
                                    )
                                }
                                titleStyle={{
                                    color: themeColor('background')
                                }}
                                secondary
                            />
                        </View>
                    )}

                    {(implementation === 'lnd' ||
                        implementation === 'c-lightning-REST') && (
                        <View style={styles.button}>
                            <Button
                                title={localeString(
                                    'views.Settings.AddEditNode.scanBtcpay'
                                )}
                                onPress={() =>
                                    navigation.navigate(
                                        'BTCPayConfigQRScanner',
                                        {
                                            index
                                        }
                                    )
                                }
                                secondary
                            />
                        </View>
                    )}

                    {implementation === 'lndhub' && (
                        <View style={styles.button}>
                            <Button
                                title={localeString(
                                    'views.Settings.AddEditNode.scanLndhub'
                                )}
                                onPress={() =>
                                    navigation.navigate('LNDHubQRScanner', {
                                        index
                                    })
                                }
                                buttonStyle={{
                                    borderRadius: 30
                                }}
                                secondary
                            />
                        </View>
                    )}

                    {saved && (
                        <View style={styles.button}>
                            <Button
                                title={localeString(
                                    'views.Settings.AddEditNode.deleteNode'
                                )}
                                onPress={() => this.deleteNodeConfig()}
                                secondary
                            />
                        </View>
                    )}
                </ScrollView>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    textInput: {
        fontSize: 20,
        width: '100%',
        height: 60,
        top: 10,
        backgroundColor: '#31363F',
        borderRadius: 6,
        marginBottom: 20,
        paddingLeft: 5
    },
    error: {
        color: 'red'
    },
    form: {
        paddingTop: 20,
        paddingLeft: 5,
        paddingRight: 5,
        width: '100%'
    },
    pickerWrapper: {
        paddingLeft: 5,
        paddingRight: 5
    },
    picker: {
        height: 50
    },
    button: {
        paddingTop: 10,
        paddingBottom: 10,
        width: 350,
        alignSelf: 'center'
    },
    clipboardImport: {
        padding: 10,
        backgroundColor: 'rgba(92, 99,216, 1)',
        color: 'white'
    },
    modal: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 22
    },
    nodeInterface: {
        paddingTop: 10,
        paddingBottom: 10
    }
});
