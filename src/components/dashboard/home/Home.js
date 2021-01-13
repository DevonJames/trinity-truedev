import React from 'react';
import Wallet from '../sub-components/wallet/Wallet';
import OpenOrders from './inner-components/OpenOrders';
import Profile from './inner-components/Profile'
import SalesHistory from './inner-components/SalesHistory';
import CurrentRentals from './inner-components/CurrentRentals';
import './home.css'

//todo: Tables - show current 5; if there is more than 5, 'Show more'. If none - display 'none'


const Home = () => {
    return (
        <main>   
            <Wallet />
            <Profile />
            <OpenOrders />
            <SalesHistory />
            <CurrentRentals />
        </main>
    );
};

export default Home;
