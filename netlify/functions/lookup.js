const fetch = require('node-fetch');

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        // Accept either searchID or orderID from the request payload
        const rawID = body.searchID || body.orderID;
        const userEmail = body.userEmail;

        if (!rawID || !userEmail) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing Order/Transaction ID or email." })
            };
        }

        const searchID = rawID.trim();
        const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
        const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
        
        // Dynamic URL logic
        const isSandbox = process.env.PAYPAL_MODE === 'sandbox';
        const PAYPAL_API = isSandbox 
            ? 'https://api-m.sandbox.paypal.com' 
            : 'https://api-m.paypal.com';

        // 1. Get Access Token
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

        let orderData = null;

        // 2. Attempt 1: Fetch as Order ID
        const orderResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders/${searchID}`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });

        if (orderResponse.status === 200) {
            orderData = await orderResponse.json();
        } else if (orderResponse.status === 404) {
            // 3. Attempt 2: Fallback to Capture/Transaction ID
            const captureResponse = await fetch(`${PAYPAL_API}/v2/payments/captures/${searchID}`, {
                headers: { 'Authorization': `Bearer ${access_token}` }
            });

            if (captureResponse.status === 200) {
                const captureData = await captureResponse.json();
                
                // Extract parent Order link from PayPal's HATEOAS links array
                const orderLink = captureData.links?.find(l => l.rel === 'up' || l.rel === 'order')?.href;

                if (orderLink) {
                    const parentOrderRes = await fetch(orderLink, {
                        headers: { 'Authorization': `Bearer ${access_token}` }
                    });
                    if (parentOrderRes.status === 200) {
                        orderData = await parentOrderRes.json();
                    }
                }
            }
        }

        // If neither Order ID nor Capture ID matched
        if (!orderData) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: "Order or Transaction ID not found in archives." })
            };
        }

        // 4. Email Validation
        const paypalEmail = orderData.payer?.email_address || "";
        if (paypalEmail.toLowerCase() !== userEmail.trim().toLowerCase()) {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: "Email and ID mismatch. Please check your credentials." })
            };
        }

        // 5. Extract Details & Tracking
        const purchaseUnit = orderData.purchase_units?.[0] || {};
        const trackingData = purchaseUnit.shipping?.trackings?.[0] || null;

        return {
            statusCode: 200,
            body: JSON.stringify({
                status: orderData.status,
                items: purchaseUnit.items || [],
                tracking: trackingData ? {
                    number: trackingData.tracking_number,
                    carrier: trackingData.carrier,
                    url: trackingData.tracking_number_url
                } : null
            })
        };

    } catch (error) {
        console.error("Lookup Error:", error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: "Technical error connecting to the workshop backend." }) 
        };
    }
};