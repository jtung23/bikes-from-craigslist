const request = require('request');
const cheerio = require('cheerio');

request('https://sfbay.craigslist.org/search/bia?query=cyclocross', function(err, res, html) {
    if (!err && res.statusCode == 200) {
        const $ = cheerio.load(html)
        let arr = []
        $('.result-row').each((i, val) =>{
            newString = $(val).text().replace(/\s+/g,' ').trim();
            arr.push(newString)
        })
        console.log(arr[0])
    }
})
