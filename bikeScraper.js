const puppeteer = require('puppeteer');

let scrape = async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://sfbay.craigslist.org/search/bia?query=cyclocross');
        // Scrape
    await page.click('li.result-row:nth-child(1) > a:nth-child(1)');
    await page.waitFor(1000);
    const result = await page.evaluate( () => {
        let title = document.querySelector('#titletextonly').innerText
        let price = document.querySelector('.price').innerText
        let postBody = document.querySelector('#postingbody').innerText
        let attrGroup = document.querySelector('p.attrgroup').innerHTML
        return {
            title,
            price,
            postBody,
            attrGroup
        }
    })
    browser.close();
    return result;
}

scrape().then((value) => {
    console.log(value); // Success!
});