const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// Helper function สำหรับการตอบกลับข้อผิดพลาด
function formatError(error) {
    return { message: error.message || 'Unknown error occurred' };
}

// Helper function สำหรับ Puppeteer Request
async function performPuppeteerRequest(url, method, payload = null) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.0.0 Safari/537.36'
        );

        // ทำ POST หรือ GET request ผ่าน Puppeteer
        await page.goto(url, { waitUntil: 'networkidle2' });

        if (method === 'POST' && payload) {
            const response = await page.evaluate(async (url, payload) => {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });
                return await res.json();
            }, url, payload);

            return response;
        } else {
            const content = await page.content();
            return JSON.parse(content);
        }
    } finally {
        await browser.close();
    }
}

// API Endpoint สำหรับตรวจสอบ Voucher
app.post('/verify-voucher', async (req, res) => {
    const { voucher_id, mobile } = req.body;

    if (!voucher_id || !mobile) {
        return res.status(400).json({
            status: 'error',
            message: 'Missing voucher_id or mobile'
        });
    }

    const verifyUrl = `https://gift.truemoney.com/campaign/vouchers/${voucher_id}/verify?mobile=${mobile}`;

    try {
        const jsonResponse = await performPuppeteerRequest(verifyUrl, 'GET');
        return res.status(200).json({
            status: 'success',
            data: jsonResponse
        });
    } catch (error) {
        const errorDetails = formatError(error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to verify voucher',
            error: errorDetails
        });
    }
});

// API Endpoint สำหรับ Redeem Voucher
app.post('/redeem-voucher', async (req, res) => {
    const { mobile, voucher_hash } = req.body;

    if (!mobile || !voucher_hash) {
        return res.status(400).json({
            status: 'error',
            message: 'Missing mobile or voucher_hash'
        });
    }

    const redeemUrl = `https://gift.truemoney.com/campaign/vouchers/${voucher_hash}/redeem`;

    try {
        const jsonResponse = await performPuppeteerRequest(redeemUrl, 'POST', {
            mobile: mobile,
            voucher_hash: voucher_hash
        });
        return res.status(200).json({
            status: 'success',
            data: jsonResponse
        });
    } catch (error) {
        const errorDetails = formatError(error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to redeem voucher',
            error: errorDetails
        });
    }
});

// เริ่มต้นเซิร์ฟเวอร์
app.listen(PORT, () => {
    console.log(`API is running on http://localhost:${PORT}`);
});
