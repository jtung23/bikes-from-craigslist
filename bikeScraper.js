const puppeteer = require('puppeteer');
const textStrings = require('./textStrings.js');

const query = ['cyclocross']
const maxPrice= 1000

let postTest = "'I built up each part of this bike including the wheels. When I have time to ride I always go for the full suspension so this bike never gets ridden and it deserves to. It is in good working order!\n\n text or call 3one0 seven two 1 five 7 two 8\n -Bill\n\n Steel Rock Lobster frame 56 Cm\n Sram Rival 10 speed shifter\n Praxis 10 speed cassette 40/11\n Sram Red carbon crank arms 172.5 mm\n Praxis chain ring 40 tooth\n Sram X7 MTB rear derailuer\n Shimano XT spd pedals\n Shimano 105 hubs\n WTB ChrisCross wheels\n WTB Nano 40 front tire Tubeless\n WTB ChrisCross back tire Tubeless\n Bontrager RXL 7 degree 100 mm stem\n Bontrager Race aluminum bars 46 cm\n Bontrager RL carbon fork\n Bontrager Montrose elite hollow titanium seat\n Paul cantilever brakes!\n Gravity dropper 3 position seat post\n I do not recall the bottom bracket or headset make but they are quality and in good working order\n\n\n\n\n',"
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
    for (link of links) {
        await page.goto(link)
        await page.waitForSelector('#titletextonly')
        const obj = await page.evaluate(() => {
            let price = document.querySelector('.price') ? document.querySelector('.price').innerText : null
            let attrGroup = document.querySelector('p.attrgroup') ? document.querySelector('p.attrgroup').innerHTML : null
            let postBody = document.querySelector('#postingbody') ? document.querySelector('#postingbody').innerText : null
            let title = document.querySelector('#titletextonly') ? document.querySelector('#titletextonly').innerText : null
            return {
                price,
                attrGroup,
                postBody,
                title
            }
        })
        obj['link'] = link
        links[i] = obj
        console.log(i)
        i++
    }
    console.log(links)
    console.log(links[0])

        //     if (priceChecker(price)) { // if meets price condition then continue
                
        //         return {
        //             title,
        //             price,
        //             postBody,
        //             attrGroup
        //         }          
        //     }

        // })
    // })
    browser.close();
}

const priceChecker = (price) => { // checks if theres OBO or if the price is > 1000
    if (price[0] !== "$") { // if OBO
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
    let frameIndex = attrGroup // gets index of framesize
    let frameSection = attrGroup.slice(frameIndex, 10) //sections off framesize area
    let num = frameSection.slice(frameSection.length-4).trim()
    num = parseInt(num.slice(0,num.length-1))
    console.log(num)
    if (num > 60) {
        return true
    } else {
        return false
    }
}

const postChecker = (postBody) => { //checks postBody & returns true if meets min frame size
}

query.forEach(async(val) => {
    await scrape(val)
})