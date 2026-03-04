const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { orderID, userEmail } = JSON.parse(event.body);
    const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
    const PAYPAL_API = 'https://api-m.sandbox.paypal.com';

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
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Get Order Details
    const orderResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    const orderData = await orderResponse.json();

    // --- DEEP SEARCH FOR EMAIL ---
    const payerEmail = orderData.payer?.email_address;
    const shippingEmail = orderData.purchase_units?.[0]?.shipping?.email_address;
    const infoEmail = orderData.purchase_units?.[0]?.payee?.email_address;

    // Use whichever one we find first
    const paypalEmail = (payerEmail || shippingEmail || infoEmail || "").toLowerCase();
    
    console.log("Found PayPal Email:", paypalEmail);

    if (!paypalEmail) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "PayPal did not return an email for this order record." })
      };
    }

    if (paypalEmail !== userEmail.toLowerCase()) {
      return {
        statusCode: 403,
        body: JSON.stringify({ 
            error: `Email Mismatch. You entered: ${userEmail}. PayPal has: ${paypalEmail}` 
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: orderData.status,
        items: orderData.purchase_units[0].items || []
      })
    };

  } catch (error) {
    console.error("Function Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
  }
};