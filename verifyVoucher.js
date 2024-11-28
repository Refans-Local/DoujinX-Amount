const express = require('express');
const cloudscraper = require('cloudscraper');

const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());

// Helper function สำหรับการตอบกลับข้อผิดพลาด
function formatError(error) {
    let errorDetails;
    try {
        errorDetails = JSON.parse(error.error);
    } catch (parseError) {
        errorDetails = { message: error.message };
    }
    return errorDetails;
}

// API Endpoint สำหรับตรวจสอบ Voucher
app.post('/verify-voucher', async (req, res) => {
    const { voucher_id, mobile } = req.body;

    if (!voucher_id || !mobile) {
        return res.status(400).json({
            status: 'error',
            message: 'Missing voucher_id or mobile',
        });
    }

    const verifyUrl = `https://gift.truemoney.com/campaign/vouchers/${voucher_id}/verify?mobile=${mobile}`;

    try {
        const response = await cloudscraper.get(verifyUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Referer': 'https://gift.truemoney.com/',
            },
        });

        const jsonResponse = JSON.parse(response);
        return res.status(200).json({
            status: 'success',
            data: jsonResponse,
        });
    } catch (error) {
        const errorDetails = formatError(error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to verify voucher',
            error: errorDetails,
        });
    }
});

// เริ่มต้นเซิร์ฟเวอร์
app.listen(PORT, () => {
    console.log(`Verify Voucher API is running on http://localhost:${PORT}`);
});
