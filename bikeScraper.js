const puppeteer = require('puppeteer');
const stringify = require('csv-stringify');
const fs = require('fs');
// const testStrings = require('./testStrings.js');

const query = ['cyclocross']
const maxPrice= 1000
const minFrameSize = 60 // in cm,

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
        num = num.toLowerCase();
        if (num === 'xxl' || num === 'xxxl') {
            return true
        } else {
            return false
        }
    }
}

const removeTags = string =>{
    return string.replace(/<[^>]*>/g, ' ')
                 .replace(/\s{2,}/g, ' ')
                 .trim();
  }
const scrape = async (val) => {
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
            let attrGroup = document.querySelector('p.attrgroup') ? document.querySelector('p.attrgroup').innerHTML : null
            attrGroup = attrGroup.replace(/\s+/g,' ').trim();
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
            let checkedPrice= priceChecker(obj.price) // returns true or false
            let checkedAttr = attrChecker(obj.attrGroup) // returns true or false
            obj.attrGroup = removeTags(obj.attrGroup) // removes html tags
            if (!checkedPrice) {
                continue
            } else if (!checkedAttr) {
                continue
            } else {
                final.push(obj)
            }
        }
        i++
    }
    
    browser.close();

    stringify(final, (err, output) =>{
        fs.appendFile('./formList.csv', output, 'utf8', function (err) {
            if (err) {
            console.log('Some error occured - file either not saved or corrupted file saved.');
            } else{
            console.log('It\'s saved!');
            }
        });
    })
}

query.forEach(async(val) => {
    await scrape(val)
})