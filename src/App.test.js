const puppeteer = require("puppeteer");

const isDebugging = () => {
    const debugging_mode = {
        headless: false,
        slowMo: 250,
        devtools: true
    };
    return process.env.NODE_ENV === 'debug' ? debugging_mode : {};
};

let browser;
let page;

beforeAll(async () => {
    browser = await puppeteer.launch(isDebugging());
    page = await browser.newPage();
    await page.goto("http://localhost:3000");
    page.setViewport({width: 500, height: 2400});
});

afterAll(() => {
    if (isDebugging()) {
        browser.close();
    }
});

describe('on page load', () => {
    test('h1 loads correctly', async () => {
        const html = await page.$eval('[data-testid="pagetitle"]', e => e.innerHTML);
        expect(html).toBe('Dibujos eden anime 💕');
    }, 16000);
});