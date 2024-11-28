const express = require('express');
const bodyParser = require('body-parser');
const cloudscraper = require('cloudscraper');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Helper function สำหรับ Puppeteer
async function redeemVoucherWithPuppeteer(voucherHash, mobile) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(`https://gift.truemoney.com/campaign/vouchers/${voucherHash}/redeem`, {
            waitUntil: 'networkidle2',
        });

        // กรอกข้อมูลลงในฟอร์ม
        await page.evaluate(
            (mobile) => {
                document.querySelector('input[name="mobile"]').value = mobile;
                document.querySelector('input[name="voucher_hash"]').value = voucherHash;
                document.querySelector('form').submit();
            },
            mobile
        );

        // รอผลลัพธ์จากการ Redeem
        await page.waitForResponse((response) => response.url().includes('redeem') && response.status() === 200);

        // ดึงผลลัพธ์
        const result = await page.evaluate(() => {
            return JSON.parse(document.body.innerText);
        });

        return { status: 'success', data: result };
    } catch (error) {
        return { status: 'error', message: error.message };
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
            message: 'Missing voucher_id or mobile',
        });
    }

    const verifyUrl = `https://gift.truemoney.com/campaign/vouchers/${voucher_id}/verify?mobile=${mobile}`;

    try {
        const response = await cloudscraper.get(verifyUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.0.0 Safari/537.36',
                Accept: 'application/json',
                Referer: 'https://gift.truemoney.com/',
            },
        });

        const jsonResponse = JSON.parse(response);
        return res.status(200).json({
            status: 'success',
            data: jsonResponse,
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Failed to verify voucher',
            error: error.message,
        });
    }
});

// Helper function สำหรับ Redeem Voucher
async function redeemVoucherWithPuppeteer(voucherHash, mobile) {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    try {
        console.log(`Navigating to Redeem URL: https://gift.truemoney.com/campaign/vouchers/${voucherHash}/redeem`);

        // กำหนด Timeout
        await page.goto(`https://gift.truemoney.com/campaign/vouchers/${voucherHash}/redeem`, {
            waitUntil: 'networkidle2',
            timeout: 60000, // 60 วินาที
        });

        console.log('Page loaded successfully. Filling form...');
        
        // กรอกข้อมูลลงในฟอร์ม
        await page.evaluate(
            (mobile, voucherHash) => {
                document.querySelector('input[name="mobile"]').value = mobile;
                document.querySelector('input[name="voucher_hash"]').value = voucherHash;
                document.querySelector('form').submit();
            },
            mobile,
            voucherHash
        );

        console.log('Form submitted. Waiting for response...');

        // รอผลลัพธ์จากการ Redeem
        const response = await page.waitForResponse(
            (response) => response.url().includes('redeem') && response.status() === 200,
            { timeout: 60000 } // 60 วินาที
        );

        console.log('Response received. Parsing response...');
        
        const result = await response.json();
        return { status: 'success', data: result };
    } catch (error) {
        console.error('Puppeteer Error:', error.message);
        return { status: 'error', message: error.message };
    } finally {
        await browser.close();
    }
}

// API Endpoint สำหรับ Redeem Voucher
app.post('/redeem-voucher', async (req, res) => {
    const { mobile, voucher_hash } = req.body;

    if (!mobile || !voucher_hash) {
        return res.status(400).json({
            status: 'error',
            message: 'Missing mobile or voucher_hash',
        });
    }

    console.log(`Redeeming voucher for mobile: ${mobile}, voucher_hash: ${voucher_hash}`);

    const result = await redeemVoucherWithPuppeteer(voucher_hash, mobile);

    if (result.status === 'error') {
        return res.status(500).json(result);
    }

    return res.status(200).json(result);
});

// เริ่มต้นเซิร์ฟเวอร์
app.listen(PORT, () => {
    console.log(`API is running on http://localhost:${PORT}`);
});
