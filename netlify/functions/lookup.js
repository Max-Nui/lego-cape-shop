const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { orderID, userEmail } = JSON.parse(event.body);

    const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
    const PAYPAL_API = 'https://api-m.sandbox.paypal.com';

    // 1. Get Access Token from PayPal
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const tokenResponse = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: 'POST',
      body: 'grant_type=client_credentials',
      headers: { 
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Get Order Details
    const orderResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    const orderData = await orderResponse.json();

    // 3. Security: Check if email matches
    // Note: PayPal sometimes puts email in 'payer' or 'purchase_units'
    const paypalEmail = orderData.payer?.email_address || "";
    
    if (paypalEmail.toLowerCase() !== userEmail.toLowerCase()) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Email/Order ID mismatch." })
      };
    }

    // 4. Return the data to your website
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: orderData.status,
        items: orderData.purchase_units[0].items || []
      })
    };

  } catch (error) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: "Internal Server Error" }) 
    };
  }
};