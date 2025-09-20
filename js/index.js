// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// --- Configure email transport (use SendGrid, Gmail, etc. later) ---
const transporter = nodemailer.createTransport({
  service: "gmail", // change later
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.pass,
  },
});

// --- Cloud Function: Invite Employee ---
exports.inviteEmployee = functions.https.onCall(async (data, context) => {
  const email = data.email;
  if (!email) throw new functions.https.HttpsError("invalid-argument", "Email required");

  try {
    // Create user if doesn’t exist
    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
    } catch {
      user = await admin.auth().createUser({ email });
    }

    // Generate password reset link
    const link = await admin.auth().generatePasswordResetLink(email);

    // Send invite email
    const mailOptions = {
      from: "Dowson Farms <no-reply@dowsonfarms.com>",
      to: email,
      subject: "Dowson Farms App — You’re Invited",
      text: `Hi,\n\nYou’ve been invited to the Dowson Farms app.\n\nClick here to create your password: ${link}\n\n— Dowson Farms`,
    };
    await transporter.sendMail(mailOptions);

    return { success: true, message: "Invite sent" };
  } catch (err) {
    console.error(err);
    throw new functions.https.HttpsError("internal", err.message);
  }
});
