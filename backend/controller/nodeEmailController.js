// emailReminder.js
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const pool = require("../config/db");
const dotenv = require("dotenv");

dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendMail() {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const query = `
      SELECT 
        usm.username,
        usm.useremail,
        sp.title,
        sp.description,
        sp.issue_date,
        sp.expire_date,
        um.unitname,
        ca.categoryname,
        CASE
            WHEN sp.expire_date < CURRENT_DATE THEN 'Expired'
            WHEN sp.expire_date <= CURRENT_DATE + INTERVAL '5 days' THEN 'Expiring Soon'
            ELSE 'Valid'
        END AS status
      FROM 
        statutory_parameters sp
      JOIN unitmaster um ON um.unitid = sp.unitid
      JOIN category ca ON ca.categoryid = sp.category
      JOIN usermaster usm ON usm.userid = sp.userid
      WHERE sp.expire_date < CURRENT_DATE + INTERVAL '6 days'
      ORDER BY sp.parameterid;
    `;

    const poolquery = await pool.query(query);

    if (poolquery.rows.length === 0) {
      console.log("✅ No emails to send.");
      return;
    }

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "noreply@malabarmilma.coop",
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    for (const detail of poolquery.rows) {
      const mailOptions = {
        from: 'noreply ❤ <noreply@malabarmilma.coop>',
        to: detail.useremail,
        subject: `${detail.title} is Expiring Soon`,
        html: `<h2>${detail.description}</h2>`,
      };

      try {
        const result = await transport.sendMail(mailOptions);
        console.log(`📧 Email sent to ${detail.useremail}: ${result.messageId}`);
      } catch (error) {
        console.error(`❌ Failed to send email to ${detail.useremail}: ${error.message}`);
      }
    }

    return "✅ All emails processed.";
  } catch (error) {
    console.error("❌ Error in sendMail:", error.message);
  }
}

module.exports = sendMail;
