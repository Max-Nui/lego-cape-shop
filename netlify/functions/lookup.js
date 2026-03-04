const fetch = require('node-fetch');

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const { orderID, userEmail } = JSON.parse(event.body);
        const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
        const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
        const PAYPAL_API = 'https://api-m.sandbox.paypal.com';

        const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
        const tokenResponse = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
            method: 'POST',
            body: 'grant_type=client_credentials',
            headers: { 
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        const { access_token } = await tokenResponse.json();

        const orderResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        const orderData = await orderResponse.json();

        if (orderResponse.status === 404) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: "Order ID not found in archives." })
            };
        }

        if (orderData.status !== 'COMPLETED' && orderData.status !== 'APPROVED') {
            return {
                statusCode: 200,
                body: JSON.stringify({ 
                    status: "PENDING", 
                    message: "This order is not yet finalized." 
                })
            };
        }

        // 1. Validate Email
        const paypalEmail = orderData.payer?.email_address || "";
        if (paypalEmail.toLowerCase() !== userEmail.toLowerCase()) {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: "Email/Order ID mismatch." })
            };
        }

        // 2. Return the Clean Data
        return {
            statusCode: 200,
            body: JSON.stringify({
                status: orderData.status,
                items: orderData.purchase_units[0].items || []
            })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Server Error" }) };
    }
};