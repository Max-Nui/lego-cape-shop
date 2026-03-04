const fetch = require('node-fetch');

exports.handler = async (event) => {
    
  // --- NEW: CONFIG BOOTSTRAP ---
  // If the frontend calls this with GET, return the public config
  if (event.httpMethod === "GET") {
      return {
          statusCode: 200,
          body: JSON.stringify({
              mode: process.env.PAYPAL_MODE || 'live',
              clientID: process.env.PAYPAL_CLIENT_ID // Publicly needed for the SDK
          })
      };
  }
  
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const { orderID, userEmail } = JSON.parse(event.body);
        const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
        const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
        
        // Check the mode: defaults to live unless 'sandbox' is explicitly set
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

        // 2. Fetch Order Details
        const orderResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        const orderData = await orderResponse.json();

        if (orderResponse.status === 404) {
            return { statusCode: 404, body: JSON.stringify({ error: "Order not found." }) };
        }

        // 3. Validate Email
        const paypalEmail = orderData.payer?.email_address || "";
        if (paypalEmail.toLowerCase() !== userEmail.toLowerCase()) {
            return { statusCode: 403, body: JSON.stringify({ error: "Email mismatch." }) };
        }

        // 4. Extract Tracking (New Logic)
        const purchaseUnit = orderData.purchase_units[0];
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
        return { statusCode: 500, body: JSON.stringify({ error: "Server Error" }) };
    }
};