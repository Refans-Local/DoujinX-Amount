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

    // ตรวจสอบค่าที่ส่งเข้ามา
    if (!voucher_id || !mobile) {
        return res.status(400).json({
            status: 'error',
            message: 'Missing voucher_id or mobile'
        });
    }

    // สร้าง URL สำหรับตรวจสอบ
    const verifyUrl = `https://gift.truemoney.com/campaign/vouchers/${voucher_id}/verify?mobile=${mobile}`;

    try {
        // ส่งคำขอผ่าน Cloudscraper
        const response = await cloudscraper.get(verifyUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Referer': 'https://gift.truemoney.com/'
            }
        });

        // แปลงผลลัพธ์เป็น JSON และส่งกลับ
        const jsonResponse = JSON.parse(response);
        res.status(200).json(jsonResponse);

    } catch (error) {
        console.error('Cloudflare Bypass Failed:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to verify voucher',
            error: error.message
        });
    }
});

// เริ่มต้นเซิร์ฟเวอร์
app.listen(PORT, () => {
    console.log(`API is running on http://localhost:${PORT}`);
});
