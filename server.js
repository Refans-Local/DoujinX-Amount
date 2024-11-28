const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// Endpoint สำหรับตรวจสอบ Voucher
app.post('/verify-voucher', async (req, res) => {
    const { voucher_id, mobile } = req.body;

    if (!voucher_id || !mobile) {
        return res.status(400).json({
            status: 'error',
            message: 'Missing required fields: voucher_id or mobile'
        });
    }

    const verifyUrl = `https://gift.truemoney.com/campaign/vouchers/${voucher_id}/verify?mobile=${encodeURIComponent(mobile)}`;

    try {
        const response = await axios.get(verifyUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Referer': 'https://gift.truemoney.com/'
            }
        });

        // ส่งผลลัพธ์กลับไปยัง WooCommerce
        res.status(200).json(response.data);

    } catch (error) {
        console.error('Error verifying voucher:', error.response?.data || error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to verify voucher',
            error: error.response?.data || error.message
        });
    }
});

// เริ่มเซิร์ฟเวอร์
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
