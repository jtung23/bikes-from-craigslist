const puppeteer = require('puppeteer');
const testStrings = require('./testStrings.js');

const query = ['cyclocross']
const maxPrice= 1000
const minFrameSize = 60 // in cm, 

let scrape = async (val) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`https://sfbay.craigslist.org/search/bia?query=${val}`, {
        timeout: 3000000
    });
    await page.waitFor(1000);
    const links = await page.evaluate( () => {
        let data = []
        let searchResults = document.querySelectorAll('.result-image')
        searchResults.forEach(ele => {
            data.push(ele.getAttribute('href'))
        })
        return data
    })
    let i = 0
    let final = []
    for (link of links) {
        await page.goto(link)
        await page.waitForSelector('#titletextonly')

        const obj = await page.evaluate(() => {
            let price = document.querySelector('.price') ? document.querySelector('.price').innerText : null
            if (!priceChecker(price)) {
                return null
            }
            let attrGroup = document.querySelector('p.attrgroup') ? document.querySelector('p.attrgroup').innerHTML : null
            if (!attrChecker(attrGroup)) {
                return null
            }
            let postBody = document.querySelector('#postingbody') ? document.querySelector('#postingbody').innerText : null
            let title = document.querySelector('#titletextonly') ? document.querySelector('#titletextonly').innerText : null
            return {
                price,
                attrGroup,
                postBody,
                title
            }
        })
        if (obj) {
            obj['link'] = link
            final.push(obj)
        }
        console.log(i)
        i++
    }
    console.log(links)
    console.log(links[0])
    browser.close();
}

const priceChecker = (price) => { // checks if theres OBO or if the price is > 1000
    if (price === null) {
        return true
    } else if (price[0] !== "$") { // if OBO
        return true
    } else { // if $***
        let dollar = parseInt(price.slice(1))
        if (dollar > maxPrice) { // set max price at top of page
            return false
        }
    }
    return true
}

const attrChecker = (attrGroup) => { //checks attrgroup & returns true if meets min frame size
    if (!attrGroup.includes('frame size')) { // if no frame size in attrgroup then return true anyway
        return true
    }
    let frameIndex = attrGroup.indexOf('frame') // gets index of framesize
    let frameSection = attrGroup.slice(frameIndex+15,frameIndex+20) //sections off framesize area
    let iso = frameSection.indexOf('<') // gets index of <b> tag
    let num = frameSection.slice(0, iso) // isolates the size only
    
    // parseInt of a str is falsey, NaN
    if (parseInt(num[0])) {
        // if first value is a number then proceed as e.g. 60cm
        let int = parseInt(num.slice(0,2))
        if (int < minFrameSize) {
            return false
        } else {
            return true
        }
    } else {
        // not num so assume is e.g. xxl
        if (num === 'xxl' || num === 'xxxl') {
            return true
        } else {
            return false
        }
    }
}

query.forEach(async(val) => {
    await scrape(val)
})