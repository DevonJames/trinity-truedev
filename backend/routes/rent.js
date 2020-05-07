require('dotenv').config();
const express = require('express');
const router = express.Router();
const controller = require('../spartanBot');
const request = require('request');
const events = require('events');
const emitter = new events();
const User = require('../models/user');
const wss = require('./socket').wss;
const bip32 = require('bip32');
const https = require('https');
const { Account, Networks, Address } = require('@oipwg/hdmw');

const getPriceBtcUsd = async () => {
    let promise = new Promise((resolve, reject)=> {
        https.get('https://api.coinbase.com/v2/exchange-rates?currency=BTC', (response) => {
        let todo = '';

        // called when a data chunk is received.
        response.on('data', (chunk) => {
            todo += chunk;
        })

        // called when the complete response is received.
        response.on('end', () => {
            resolve(JSON.parse(todo))
        })

        }).on("error", (error) => {
            console.log("Error: " + error.message);
            reject("Error: " + error.message)
        })
    })
    return promise
}


const Rent = async (token, percent) => {
    if (token === "FLO") {
        return await new Promise((resolve, reject) => {
            https.get('https://livenet.flocha.in/api/status?q=getInfos', (response) => {
                let body = ''
                response.on('data', (chunk) => {
                    body += chunk;
                });

                response.on('end', () => {
                    let data = JSON.parse(body)
                    let difficulty = data.info.difficulty
                    let hashrate = difficulty * Math.pow(2, 32) / 40
                    let Networkhashrate = hashrate / 1000000000000;  // TH/s
                    let Rent = Networkhashrate * (-percent / (-1 + percent)) // * 1000000 for MRR to MH/s
                    let MinPercentFromMinHashrate = 1000000000000 * .01 / ((difficulty * Math.pow(2, 32) / 40) + (1000000000000 * .01))
                    resolve({ Rent, MinPercentFromMinHashrate, difficulty, Networkhashrate })
                });
                
            }).on("error", (error) => {
                console.log("Error: " + error.message);
                reject("Error: " + error.message)
            });
        })
    }

    if (token === "RVN") {
        return await new Promise((resolve, reject) => {
            request({ url: 'https://rvn.2miners.com/api/stats' }, (err, res, body) => {
                if (err) {
                    reject(err)
                }
                let data = JSON.parse(body);
                let difficulty = data.nodes[0].difficulty;
                let hashrate = difficulty * Math.pow(2, 32) / 60;
                let Networkhashrate = hashrate / 1000000000000; // TH/s
                let Rent = Networkhashrate * (-percent / (-1 + percent))   // * 1000000 for MRR to MH/s
                let MinPercentFromMinHashrate = 1000000000000 * .01 / ((difficulty * Math.pow(2, 32) / 40) + (1000000000000 * .01))
                resolve({ Rent, MinPercentFromMinHashrate, difficulty, Networkhashrate })
            })
        })
    }
}

async function processUserInput(req, res) {
    // let msg = {data: 'hey buddy'}
    // emitter.emit('rented', msg)

    let options = req.body
    let { profitReinvestment, updateUnsold, dailyBudget, autoRent, spot, alwaysMineXPercent,
        autoTrade, morphie, supportedExchange, profile_id, Xpercent, userId, token } = options;

    try {
        const rent = await Rent(token, Xpercent / 100)
        let user = await User.findById({ _id: userId })

        // User.findOneAndUpdate({'profiles._id': '5eac4e09e40612427b2e8531'},{profiles}, {new: true}, (err, data)=> {
        //     if(err) console.log('err', err)
        //     console.log('data', data)
        // })

        console.log('options rent.js 99', options)
        let getAddress = (index, xPub, token, usedIndexes) => {
            const EXTERNAL_CHAIN = 0
            const currency = token === "RVN" ? 'raven' : token.toLowerCase()

            if (usedIndexes.length) {
                for (let i = 0; i < usedIndexes.length; i++) {
                    if (usedIndexes[i] === index) index++
                }
            }
          
            const paymentRecieverAddressGenerator = new Account(bip32.fromBase58(xPub, Networks[currency].network), Networks[currency], false)
            let usedAddresses = paymentRecieverAddressGenerator.getUsedAddresses(EXTERNAL_CHAIN)
            let address = paymentRecieverAddressGenerator.getAddress(EXTERNAL_CHAIN, index).getPublicAddress(0)

            // LEFT OFF AT FINAL CONDITIONAL 
            if (usedAddresses.length > 0) {
                getAddress(index++, xPub, currency) // Recursion until there is an address with no transactions
            }
            return { address, index }
        }


        let MinPercentFromMinHashrate = rent.MinPercentFromMinHashrate
        let paymentRecieverXPub = user.wallet[token.toLowerCase()].xPrv
        let btcxPrv = user.wallet.btc.xPrv


        if (MinPercentFromMinHashrate > Xpercent / 100) {
            return {
                update: true,
                message: `Your pecent of the network ${Xpercent} changed to ${(MinPercentFromMinHashrate * 100.1).toFixed(2)}%, to ` +
                    `continute renting with ${Xpercent}% for the MiningRigRental market, change percentage and switch renting on again.`,
                Xpercent: (MinPercentFromMinHashrate * 100.1).toFixed(2),
                autoRent: false
            }
        }

        // If user rents for first time with no xPub will save xPub ( paymentRecieverXPub ) to the DB
        for (let profile of user.profiles) {
            if (profile._id.toString() === profile_id) {

                // If user doesn't have a generated address will generate a new one and save address and index to DB
                if (profile.address.publicAddress === '') {
                    let usedIndexes = user.indexes
                    let newAddress = getAddress(0, paymentRecieverXPub, token, usedIndexes)
                    let btcAddress = getAddress(0, btcxPrv, 'bitcoin', usedIndexes)

                    profile.address.publicAddress = newAddress.address
                    profile.address.btcAddress = btcAddress.address
                    options.address = newAddress.address
                    let index = newAddress.index
                    user.indexes.push(index)

                    await user.save()
                    break;
                } else {
                    options.address = profile.address.publicAddress
                }
            }
        }

        if (!user) {
            return 'Can\'t find user. setup.js line#16'
        }

        options.to_do = {
            rent: {
                rent: true,
            }
        }
        options.PriceBtcUsd = getPriceBtcUsd
        options.NetworkHashRate = rent.Networkhashrate
        options.MinPercent = rent.MinPercentFromMinHashrate
        options.emitter = emitter
        // options.duration = token == "FLO" ? 24 : 3
        options.duration = 3
        options.newRent = Rent
        options.difficulty = rent.difficulty
        options.hashrate = rent.Rent
        options.rentType = 'Manual'
        return options
    } catch (e) {
        console.log('Catch error rent.js line 182: .' + e )
        return { err: 'Catch error rent.js line 182: .' + e }
    }
}

/* POST settings  page */
router.post('/', async (req, res) => {
    emitter.once('rented', async (msg) => {
        const user = await User.findById({ _id: req.body.userId })
  
        console.log('msg: from rented', msg)
        try {
            res.status(200).json({ data: msg })
        } catch (err) {
            res.status(500).json({ err: err })
        }
    })
    try {
        let userInput = await processUserInput(req, res).then(data => data).catch(err => err)
        console.log('processUserInput ', userInput)
        
        if (userInput['update']) {
            return res.json(userInput)
        }
        let data = controller(userInput);
    } catch(e) {

    }
    
    // Any data that has been updated with a message, it updates the user to proceed again

});

module.exports = router;