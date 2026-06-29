import axios from "axios";

const PESAPAL_ENV = process.env.PESAPAL_ENV || "sandbox";

const BASE_URL =
  PESAPAL_ENV === "live"
    ? "https://pay.pesapal.com/v3"
    : "https://cybqa.pesapal.com/pesapalv3";

let cachedToken = null;
let tokenExpiresAt = 0;

export async function getPesapalToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const response = await axios.post(`${BASE_URL}/api/Auth/RequestToken`, {
    consumer_key: process.env.PESAPAL_CONSUMER_KEY,
    consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
  });

  if (!response.data?.token) {
    throw new Error("Failed to get Pesapal token: " + JSON.stringify(response.data));
  }

  cachedToken = response.data.token;
  tokenExpiresAt = now + 4 * 60 * 1000;
  return cachedToken;
}

let cachedIpnId = null;

export async function registerIpnUrl() {
  if (cachedIpnId) return cachedIpnId;

  const token = await getPesapalToken();
  const ipnUrl = `${process.env.BACKEND_PUBLIC_URL}/payments/ipn`;

  const response = await axios.post(
    `${BASE_URL}/api/URLSetup/RegisterIPN`,
    { url: ipnUrl, ipn_notification_type: "GET" },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.data?.ipn_id) {
    throw new Error("Failed to register IPN: " + JSON.stringify(response.data));
  }

  cachedIpnId = response.data.ipn_id;
  return cachedIpnId;
}

export async function submitOrderRequest({
  amount,
  currency = "UGX",
  description,
  merchantReference,
  callbackUrl,
  email,
  phoneNumber,
  firstName,
  lastName,
}) {
  const token = await getPesapalToken();
  const ipnId = await registerIpnUrl();

  const response = await axios.post(
    `${BASE_URL}/api/Transactions/SubmitOrderRequest`,
    {
      id: merchantReference,
      currency,
      amount,
      description,
      callback_url: callbackUrl,
      notification_id: ipnId,
      billing_address: {
        email_address: email,
        phone_number: phoneNumber || "",
        first_name: firstName || "",
        last_name: lastName || "",
        country_code: "UG",
      },
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.data?.order_tracking_id) {
    throw new Error("Failed to submit order: " + JSON.stringify(response.data));
  }

  return response.data;
}

export async function getTransactionStatus(orderTrackingId) {
  const token = await getPesapalToken();

  const response = await axios.get(
    `${BASE_URL}/api/Transactions/GetTransactionStatus`,
    {
      params: { orderTrackingId },
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return response.data;
}
