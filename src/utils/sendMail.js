import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  service: "Gmail",
  secure: true,
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: "gffdf0101@gmail.com",
    pass: "fboocnzprurpelbc",
  },
});

function sendE_Mail(to, sub, msg) {
  try {
    transporter.sendMail({
      to: to,
      subject: sub,
      html: msg,
    });
    console.log("Email sent successfully");
  } catch (error) {
    console.log(error);
  }
}
sendE_Mail(
  "dynamic90xyz@gmail.com",
  "Test Email",
  "<h1>Test Email</h1><br><p>This is a test email</p>"
);
