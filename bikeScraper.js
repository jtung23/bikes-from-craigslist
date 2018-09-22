const puppeteer = require('puppeteer');
const stringify = require('csv-stringify');
const fs = require('fs');
// const testStrings = require('./testStrings.js');
const query = ['https://sfbay.craigslist.org/search/bia?s=0', 'https://sfbay.craigslist.org/search/bia?s=120', 'https://sfbay.craigslist.org/search/bia?s=240']
// const query = ['https://sfbay.craigslist.org/search/bia?s=0']
// const query = ['https://sfbay.craigslist.org/search/bia?s=120']
// const query = ['https://sfbay.craigslist.org/search/bia?s=240']
const maxPrice= 600
const cmminFrameSize = 60
const inminFrameSize = 23

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
    
    // parseInt of a str is falsey, NaN
    if (parseInt(attrGroup[0])) {
        // if first value is a number then proceed as e.g. 60cm
        let int = parseInt(attrGroup.slice(0,2))
        // console.log(int)
        if (attrGroup.includes('"') || attrGroup.includes('in')) {
            if (int < inminFrameSize) {
                return false
            } else {
                return true
            } 
        } else {
            if (int < cmminFrameSize) {
               return false
            } else {
               return true
            }
        }
    } else {
        return false
        // not attrGroup so assume is e.g. xxl
        // attrGroup = attrGroup.toLowerCase();
        // if (attrGroup.includes('xl') || attrGroup.includes('xxl') || attrGroup.includes('large')) {
        //     return true
        // } else {
        //     return false
        // }
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
    await page.goto(val, {
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
        await page.waitForSelector('body')

        const obj = await page.evaluate(() => {
            let price = document.querySelector('.price') ? document.querySelector('.price').innerText : null
            let attrGroup = document.querySelector('p.attrgroup') ? document.querySelector('p.attrgroup').innerHTML : null
            attrGroup = attrGroup.replace(/\s+/g,' ').trim();
            let frameIndex = attrGroup.indexOf('frame') // gets index of framesize
            let frameSection = attrGroup.slice(frameIndex+15,frameIndex+30) //sections off framesize area
            let iso = frameSection.indexOf('<') // gets index of <b> tag
            let num = frameSection.slice(0, iso) // isolates the size only
            let postBody = document.querySelector('#postingbody') ? document.querySelector('#postingbody').innerText : null
            let title = document.querySelector('#titletextonly') ? document.querySelector('#titletextonly').innerText : null
            return {
                title,
                price,
                attrGroup: num,
                postBody,
                link: window.location.href
            }
        })

        if (obj) {
            let checkedPrice= priceChecker(obj.price) // returns true or false
            let checkedAttr = attrChecker(obj.attrGroup) // returns true or false
            // obj.attrGroup = removeTags(obj.attrGroup) // removes html tags
            // console.log(checkedPrice, checkedAttr)
            if (checkedPrice && checkedAttr) {
                final.push(obj)
            }
        }
        i++
    }
    
    browser.close();

    stringify(final, (err, output) =>{
        fs.appendFile('./bikeList.csv', output, 'utf8', function (err) {
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