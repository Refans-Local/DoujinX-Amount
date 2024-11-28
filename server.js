const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const redis = require('redis');

const app = express();
const PORT = 3000;

// Redis Client
const client = redis.createClient();

client.on('error', (err) => {
    console.error('Redis error:', err);
});

// Middleware
app.use(bodyParser.json());

// Helper Function: ใช้ Puppeteer เพื่อลดการโหลดทรัพยากร
async function performPuppeteerRequest(url) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // ปิดการโหลดทรัพยากรที่ไม่จำเป็น
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
            req.abort();
        } else {
            req.continue();
        }
    });

    await page.goto(url, { waitUntil: 'networkidle2' });
    const content = await page.content();
    await browser.close();
    return content;
}

// API Endpoint สำหรับตรวจสอบ Voucher พร้อม Caching
app.post('/verify-voucher', async (req, res) => {
    const { voucher_id, mobile } = req.body;

    if (!voucher_id || !mobile) {
        return res.status(400).json({
            status: 'error',
            message: 'Missing voucher_id or mobile'
        });
    }

    const cacheKey = `verify-${voucher_id}-${mobile}`;
    client.get(cacheKey, async (err, cachedData) => {
        if (cachedData) {
            console.log('Cache hit for:', cacheKey);
            return res.status(200).json(JSON.parse(cachedData));
        }

        const verifyUrl = `https://gift.truemoney.com/campaign/vouchers/${voucher_id}/verify?mobile=${mobile}`;

        try {
            const response = await performPuppeteerRequest(verifyUrl);
            const jsonResponse = JSON.parse(response);

            // Cache the response for 5 minutes
            client.setex(cacheKey, 300, JSON.stringify(jsonResponse));

            return res.status(200).json({
                status: 'success',
                data: jsonResponse
            });
        } catch (error) {
            console.error('Error verifying voucher:', error.message);
            return res.status(500).json({
                status: 'error',
                message: 'Failed to verify voucher',
                error: error.message
            });
        }
    });
});

// API Endpoint สำหรับ Redeem Voucher พร้อม Caching
app.post('/redeem-voucher', async (req, res) => {
    const { mobile, voucher_hash } = req.body;

    if (!mobile || !voucher_hash) {
        return res.status(400).json({
            status: 'error',
            message: 'Missing mobile or voucher_hash'
        });
    }

    const cacheKey = `redeem-${voucher_hash}-${mobile}`;
    client.get(cacheKey, async (err, cachedData) => {
        if (cachedData) {
            console.log('Cache hit for:', cacheKey);
            return res.status(200).json(JSON.parse(cachedData));
        }

        const redeemUrl = `https://gift.truemoney.com/campaign/vouchers/${voucher_hash}/redeem`;

        try {
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();

            await page.goto(redeemUrl, { waitUntil: 'networkidle2' });
            await page.evaluate((mobile, voucher_hash) => {
                return fetch(redeemUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ mobile, voucher_hash })
                });
            }, mobile, voucher_hash);

            const response = await page.content();
            await browser.close();

            const jsonResponse = JSON.parse(response);

            // Cache the response for 5 minutes
            client.setex(cacheKey, 300, JSON.stringify(jsonResponse));

            return res.status(200).json({
                status: 'success',
                data: jsonResponse
            });
        } catch (error) {
            console.error('Error redeeming voucher:', error.message);
            return res.status(500).json({
                status: 'error',
                message: 'Failed to redeem voucher',
                error: error.message
            });
        }
    });
});

// เริ่มต้นเซิร์ฟเวอร์
app.listen(PORT, () => {
    console.log(`API is running on http://localhost:${PORT}`);
});
