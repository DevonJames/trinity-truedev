import React, { useState } from 'react';
import Modal from '../../helpers/modal';
import coinbaseLogo from '../../../../public/images/icons/coinbase.png';
import { crypto } from '../../../helpers-functions/cryptoCurrencies';
import './subcomponent.css';

import DepositWithdrawOptions from './DepositWithdrawOptions'
import BuyCryptoModal from './BuyCryptoModal';
import NetworkTransfer from './NetworkTransfer';
import CoinbaseTrasnferToWallet from './CoinbaseTransferToWallet';



import { connect } from 'react-redux';

//todo: show coinbase account balance and or limit?
//todo: add icons for Buy: Currencies && Pay W: Options
//todo: connect confirm button to acutally send transatcion: quote = false.
//todo: add checkbox, that will switch functions from placeBuyOrderWithoutFees, to placeBuyOrderWithFees will accounts for fees.
//todo: add button that will switch buyCurrency to allow user to buy in Crypto amount, currently defaulted to USD dollar worth.
//! todo: add error messages!
//todo: create a transacation ID to avoid dupes
//todo: Coinbase will send BTC from coinbase wallet directly to MRR Wallet || Nice Hash Wallet || Trinity Wallet
//todo: fix Coinbase Scopes
//todo: add copy element to txid - successuful <NetworkTrasnferSend />

const Deposit = props => {
    const [showCoinbaseTrasnferToWallet, setShowCoinbaseTrasnferToWallet] = useState(false);
    const [showNetworkTransfer, setShowNetworkTransfer] = useState(false);
    const [showBuySellModal, setShowBuySellModal] = useState(false);
    const [showDepositCrypto, setShowDepositCrypto] = useState({
        visible: false,
        crypto: '',
        name: ''
    });
    


    const DepositModal = () => {
        return (
            <Modal
                handleClick={props.handleClick}
                title={'Deposit'}
                headerStyle={{
                    backgroundColor: '#0082f9',
                    color: '#ffffff',
                }}
                modalBody={
                    Object.keys(crypto).map((coin, i) => {
                        return (
                            <div
                            onClick={() => {
                                setShowDepositCrypto(
                                    {
                                        visible: !showDepositCrypto.visible,
                                        code: crypto[coin].code,
                                        name: crypto[coin].name,
                                        icon: crypto[coin].icon
                                    }
                                )
                            }}
                            style={{
                                cursor: 'pointer',
                                display: 'flex', justifyContent: 'space-evenly', padding: '10px', alignItems: 'flex-start'}}
                            key={i}>
                                <img src={crypto[coin].icon}></img>
                                <div>

                                <p>{crypto[coin].code}</p>
                                </div>
                                <i className="fas fa-chevron-right"></i>

                            </div>
                        )
                    })
                }
            />
        );
    };


    const CoinbaseLogo = () =>{ return <img width='32px' height='32px' style={{borderRadius: '25%'}} src={coinbaseLogo}></img>}


    const renderComponents = () => {
    

        if (showDepositCrypto.visible) {
           return <DepositWithdrawOptions 
           coinbaseInDB={props.coinbaseInDB}
            handleClick={() => {
                setShowDepositCrypto({
                visible: !showDepositCrypto.visible,
                        })}}
            title={`Deposit ${showDepositCrypto.code}`}
            code={showDepositCrypto.code}
            coinbaseLogo={<CoinbaseLogo />}
            handleCoinbaseClick={() => {
                setShowBuySellModal(!showBuySellModal)
                setShowDepositCrypto({
                ...showDepositCrypto,
                visible: !showDepositCrypto.visible,
                        })        
            }}
            handleCryptoAddressClick={() => {
                setShowNetworkTransfer(!showNetworkTransfer)
                setShowDepositCrypto({
                ...showDepositCrypto,
                visible: !showDepositCrypto.visible,
                        })
            }
            }

           />
        } else if(showBuySellModal) {
            return (
                 <BuyCryptoModal 
                exitModal={props.exitModal}
                title={'Buy'}
                submitTitle={'Buy'}
                handleClick={() => {
                setShowBuySellModal(!showBuySellModal)
                setShowDepositCrypto({
                ...showDepositCrypto,
                visible: !showDepositCrypto.visible,
                        })  
            }}
                crypto={showDepositCrypto.crypto}          
             />
                )
        } else if(showNetworkTransfer) {
            return (
                <NetworkTransfer
                exitModal={props.exitModal}
                 handleClick={() => {
                setShowNetworkTransfer(!showNetworkTransfer)
                setShowDepositCrypto({
                ...showDepositCrypto,
                visible: !showDepositCrypto.visible,
                        })  
                }}
                showDepositCrypto={showDepositCrypto}          
             />
            )
            //! currently no visible - can add this as a button in wallet? 
        } else if(showCoinbaseTrasnferToWallet) {
            return <CoinbaseTrasnferToWallet
                 exitModal={props.exitModal}
                  handleClick={() => {
                 setShowNetworkTransfer(!showNetworkTransfer)
                 setShowDepositCrypto({
                 ...showDepositCrypto,
                 visible: !showDepositCrypto.visible,
                         })  
                 }}
                 showDepositCrypto={showDepositCrypto}    
             />
         } else {
            return <DepositModal />;
        }
    };

    return renderComponents();
};

const mapStateToProps = state => {
    return {
        error: state.error,
        accounts: state.coinbase.accounts,
        paymentMethods: state.coinbase.paymentMethods,
        coinbaseLoaded: state.coinbase.coinbaseLoaded,
        // coinbaseAuth: state.auth.user[coinbase] ? state.auth.user.coinbase : null

    };
};

export default connect(mapStateToProps, {})(Deposit);
