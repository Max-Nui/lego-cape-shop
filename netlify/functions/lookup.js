const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { orderID, userEmail } = JSON.parse(event.body);
    const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
    const PAYPAL_API = 'https://api-m.sandbox.paypal.com';

    // 1. Auth Handshake
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

    // NEW DEBUG: See what PayPal is actually sending
    return {
        statusCode: 200,
        body: JSON.stringify({ 
            fullResponse: orderData 
        })
    };

    // 3. THE DEEP SCAN
    // Look in every possible place PayPal stores email
    const foundEmail = 
        orderData.payer?.email_address || 
        orderData.purchase_units?.[0]?.shipping?.email_address ||
        orderData.purchase_units?.[0]?.payee?.email_address || 
        "NOT_FOUND";

    // 4. Detailed Error Reporting
    if (foundEmail === "NOT_FOUND") {
        return {
            statusCode: 404,
            body: JSON.stringify({ 
                error: "Email missing from PayPal record.",
                debug: {
                    status: orderData.status,
                    hasPayer: !!orderData.payer,
                    hasPurchaseUnits: !!orderData.purchase_units
                }
            })
        };
    }

    if (foundEmail.toLowerCase() !== userEmail.toLowerCase()) {
      return {
        statusCode: 403,
        body: JSON.stringify({ 
            error: `Email Mismatch.`,
            found: foundEmail // Sending this back for your testing
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
    return { statusCode: 500, body: JSON.stringify({ error: "Server Error" }) };
  }
};