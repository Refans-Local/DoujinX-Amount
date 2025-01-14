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
            },
            agentOptions: {
                minVersion: 'TLSv1.3', // กำหนดให้ใช้ TLS 1.3
                maxVersion: 'TLSv1.3'  // จำกัดเวอร์ชันสูงสุดเป็น TLS 1.3
            }
        });

        // แปลงผลลัพธ์เป็น JSON และส่งกลับ
        const jsonResponse = JSON.parse(response);
        return res.status(200).json({
            status: 'success',
            data: jsonResponse
        });

    } catch (error) {
        let errorDetails;

        try {
            // พยายามแปลงข้อความใน error เป็น JSON
            errorDetails = JSON.parse(error.error);
        } catch (parseError) {
            // หากแปลงไม่ได้ แสดงข้อความดั้งเดิม
            errorDetails = { message: error.message };
        }

        return res.status(500).json({
            status: 'error',
            message: 'Failed to verify voucher',
            error: errorDetails
        });
    }
});

// เริ่มต้นเซิร์ฟเวอร์
app.listen(PORT, () => {
    console.log(`API is running on http://localhost:${PORT}`);
});
