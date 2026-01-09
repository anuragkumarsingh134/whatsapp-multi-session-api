
const BASE_URL = 'http://localhost:3000/api';
const HEADERS = {
    'x-api-key': 'test-api-key',
    'x-device-id': 'test-device-id',
    'Content-Type': 'application/json'
};

const testApi = async () => {
    try {
        console.log('Testing GET /status...');
        const statusRes = await fetch(`${BASE_URL}/status`, { headers: HEADERS });
        console.log('Status Response:', await statusRes.json());

        console.log('\nTesting GET /qr...');
        const qrRes = await fetch(`${BASE_URL}/qr`, { headers: HEADERS });
        const qrData = await qrRes.json();
        console.log('QR Response:', qrData.message || 'QR Code received (data hidden)');

        console.log('\nTesting GET /send-message (expecting error or success depending on connection)...');
        // If not connected, this will likely throw 500 or 400, but we want to fail gracefully in test
        const msgRes = await fetch(`${BASE_URL}/send-message?phone=1234567890&message=Hello`, { headers: HEADERS });
        console.log('Send Message Response:', await msgRes.json());

        console.log('\nTesting GET /logout...');
        const logoutRes = await fetch(`${BASE_URL}/logout`, { headers: HEADERS });
        console.log('Logout Response:', await logoutRes.json());

    } catch (error) {
        console.error('Test Failed:', error);
    }
};

const testAuthFail = async () => {
    try {
        console.log('\nTesting Auth Failure...');
        const res = await fetch(`${BASE_URL}/status`); // No headers
        if (res.status === 401) {
            console.log('Auth Failure Test Passed: 401 received');
        } else {
            console.error(`Auth Failure Test output unexpected: ${res.status}`);
        }
    } catch (error) {
        console.error('Auth check error:', error);
    }
};

(async () => {
    await testApi();
    await testAuthFail();
})();
