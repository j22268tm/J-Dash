const axios = require('axios');
const { chromium } = require('playwright');

const launchOptions = {
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process'
    ],
    headless: true,
};

module.exports = {
    POST: async (url, path, data) => {
        return new Promise((resolve) => {
            console.log(`Sending POST request to: ${url}${path}`);
            axios.post(url + path, data).then(res => { resolve({ success: true, data: res.data, error: null }); }).catch(err => { console.error("Axios POST request failed."); if (err.response) { console.error("Response Data:", err.response.data); console.error("Response Status:", err.response.status); } else if (err.request) { console.error("Request Data:", err.request); } else { console.error("Error Message:", err.message); } resolve({ success: false, data: null, error: err }); });
        });
    },
    GetLoginData: async function(username, password) {
        let res = await this.POST(process.env.ENDPOINT, process.env.API_LOGIN, { 'data': { 'encryptedLoginPassword': null, 'judgeLoginPossibleFlg': false, 'loginUserId': username, 'plainLoginPassword': password }, 'encryptedLoginPassword': password, 'langCd': '', 'loginUserId': username, 'plainLoginPassword': null, 'productCd': 'ap', 'subProductCd': 'apa' });
        if (!res.success) return false;
        res = res.data;
        res = decodeURIComponent(res);
        res = JSON.parse(res);
        return res.data;
    },
    GetLoginDataURI: async function(username, password) {
        const data = await this.GetLoginData(username, password);
        if (!data) return false;
        data.encryptedPassword = encodeURIComponent(data.encryptedPassword);
        return data;
    },
    GetSchedule: async function(username, encryptedPassword, semester = 0, term = 0) {
        let res = await this.POST(process.env.ENDPOINT, process.env.API_SCHEDULE, { 'data':{ 'gakkiNo': semester, 'kaikoNendo': term }, 'encryptedLoginPassword':encryptedPassword, 'langCd':'', 'loginUserId': username, 'plainLoginPassword':null, 'productCd':'ap', 'subProductCd':'apa' });
        if (!res.success) return false;
        res = res.data;
        res = decodeURIComponent(res);
        res = JSON.parse(res);
        return { 'origin': res, 'semester': res.data.gakkiNo, 'term': res.data.nendo, 'termDisplayName': res.data.gakkiName, 'schedule': res.data.jgkmDtoList };
    },
    GetLectureStatus: async function(username, encryptedPassword, lecture) {
        let res = await this.POST(process.env.ENDPOINT, process.env.API_LECTURE, { 'data': { 'gakkiNo': lecture.gakkiNo, 'jigenNo': lecture.jigenNo, 'jugyoCd': lecture.jugyoCd, 'jugyoKbn': lecture.jugyoKbn, 'kaikoNendo': lecture.kaikoNendo, 'kaikoYobi': lecture.kaikoYobi, 'nendo': lecture.nendo }, 'encryptedLoginPassword': encryptedPassword, 'langCd': '', 'loginUserId': username, 'plainLoginPassword': null, 'productCd': 'ap', 'subProductCd': 'apa' });
        if (!res.success) return false;
        res = res.data;
        res = decodeURIComponent(res);
        res = JSON.parse(res);
        return res;
    },
    GetHomeUrl: async function(username, password) {
        let url = process.env.ENDPOINT + process.env.API_WEBACCESS;
        let query = { 'encryptedPassword': decodeURIComponent(password), 'formId': null, 'funcId': null, 'paramaterMap': null, 'password': null, 'userId': username };
        query = JSON.stringify(query);
        query = encodeURIComponent(query);
        url += '?webApiLoginInfo=' + query;
        return url;
    },
    GetLectureSyllabusUrl: async function(username, password, lecture) {
        let url = process.env.ENDPOINT + process.env.API_WEBACCESS;
        let query = { 'encryptedPassword': decodeURIComponent(password), 'formId': 'Pkx52301', 'funcId': 'Pkx523', 'paramaterMap': { 'jugyoCd': lecture.jugyoCd, 'nendo': lecture.nendo }, 'password': null, 'userId': username };
        query = JSON.stringify(query);
        query = encodeURIComponent(query);
        url += '?webApiLoginInfo=' + query;
        return url;
    },
    GetNotificationUrl: async function(username, password) {
        let url = process.env.ENDPOINT + process.env.API_WEBACCESS;
        let query = { 'encryptedPassword': decodeURIComponent(password), 'formId': 'Bsd50701', 'funcId': 'Bsd507', 'paramaterMap': null, 'password': null, 'userId': username };
        query = JSON.stringify(query);
        query = encodeURIComponent(query);
        url += '?webApiLoginInfo=' + query;
        return url;
    },
    
    InputAttendCode: async function(username, password, code) {
        const browser = await chromium.launch(launchOptions);
        const page = await browser.newPage();
        page.setDefaultTimeout(60000);

        try {
            const url = await this.GetHomeUrl(username, password);
            await page.goto(url);
            await page.evaluate(() => { $('#menuPanel').panel('open'); });
            await page.locator('.ui-link:has-text("出席登録(スマートフォン)")').click();
            await page.waitForNavigation();
            if (await page.locator('label:has-text("出席確認終了")').count() > 0) {
                return (await page.screenshot()).toString('base64');
            }
            const inputs = page.locator('div.mainContent input');
            for (let i = 0; i < 4; i++) {
                await inputs.nth(i).fill(code[i]);
            }
            await page.locator('button:has-text("出席登録する")').click();
            await page.waitForNavigation();
            await page.mouse.click(1, 1);
            return (await page.screenshot()).toString('base64');
        } catch (e) {
            console.error("InputAttendCode failed:", e);
            if (page && !page.isClosed()) return (await page.screenshot()).toString('base64');
            return null;
        } finally {
            if (browser) await browser.close();
        }
    },

    GetUnreadNotificationCount: async function(username, password) {
        const browser = await chromium.launch(launchOptions);
        const page = await browser.newPage();
        page.setDefaultTimeout(30000);

        try {
            const url = await this.GetHomeUrl(username, password);
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            const countLocator = page.locator('span.noticeCount').first();
            const text = await countLocator.innerText({ timeout: 2000 }); 
            return text;
        } catch (error) {
            if (error.name === 'TimeoutError') {
                console.log("GetUnreadNotificationCount: 'span.noticeCount' not found, assuming 0 unread notifications.");
                return '0';
            }
            console.error("GetUnreadNotificationCount encountered an unexpected error:", error);
            return 'err';
        } finally {
            if (browser) await browser.close();
        }
    },
};