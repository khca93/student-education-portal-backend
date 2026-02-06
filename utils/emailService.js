const sendOtpEmail = async ({ to, name, otp }) => {
  const mailOptions = {
    from: `"Knowledge Hunt" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your Login OTP – Knowledge Hunt',
    html: `
      <p>Hello <b>${name || 'Student'}</b>,</p>

      <p>Your OTP for login is:</p>

      <h2 style="color:#2563eb">${otp}</h2>

      <p>This OTP is valid for <b>5 minutes</b>.</p>

      <p>If you did not request this, please ignore.</p>

      <br>
      <p>Regards,<br>
      <b>Knowledge Hunt Computer Academy</b></p>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendStatusEmail,
  sendOtpEmail
};
