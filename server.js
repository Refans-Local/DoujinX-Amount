const express = require('express');
const bodyParser = require('body-parser');
const cloudscraper = require('cloudscraper');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

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
        const response = await cloudscraper.get(verifyUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Referer': 'https://gift.truemoney.com/'
            }
        });

        const jsonResponse = JSON.parse(response);
        res.status(200).json(jsonResponse);

    } catch (error) {
        let errorDetails;

        try {
            errorDetails = JSON.parse(error.error);
        } catch (parseError) {
            errorDetails = { message: error.message };
        }

        res.status(500).json({
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
        const response = await cloudscraper.post(redeemUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Referer': 'https://gift.truemoney.com/'
            },
            body: JSON.stringify({
                mobile: mobile,
                voucher_hash: voucher_hash
            })
        });

        const jsonResponse = JSON.parse(response);
        res.status(200).json(jsonResponse);

    } catch (error) {
        let errorDetails;

        try {
            errorDetails = JSON.parse(error.error);
        } catch (parseError) {
            errorDetails = { message: error.message };
        }

        res.status(500).json({
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
