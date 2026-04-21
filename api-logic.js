require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ─── Unique Appointment ID Generator ─────────────────────────────────────────
function generateAppointmentId() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let suffix = '';
    for (let i = 0; i < 6; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `LLH-${dateStr}-${suffix}`;
}

// ─── Nodemailer Transporters ──────────────────────────────────────────────────
function getTransporters() {
    const hospitalTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER_1,
            pass: process.env.EMAIL_PASS_1,
        }
    });

    const patientTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER_2,
            pass: process.env.EMAIL_PASS_2,
        }
    });

    return { hospitalTransporter, patientTransporter };
}

// ─── Hospital Email Template ──────────────────────────────────────────────────
function hospitalEmailTemplate({ appointmentId, fullName, email, phone, speciality, formattedDate, timeSlot, messages, bookedAt }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <style>
    body { margin:0; padding:0; background:#eef2f7; }
    .wrap { max-width:600px; margin:0 auto; background:#fff; font-family:'Segoe UI',Arial,sans-serif; }
    .header { background:linear-gradient(135deg,#0a3d73,#1a6bb5); padding:28px 20px; text-align:center; }
    .header p { margin:0 0 4px; color:rgba(255,255,255,0.75); font-size:11px; letter-spacing:2px; text-transform:uppercase; }
    .header h1 { margin:0; color:#fff; font-size:22px; font-weight:700; }
    .id-banner { background:#e8f4fd; border-left:5px solid #1a6bb5; padding:14px 20px; }
    .id-label { margin:0; color:#4a5568; font-size:10px; text-transform:uppercase; letter-spacing:1px; font-weight:600; }
    .id-value { margin:6px 0 0; color:#0a3d73; font-size:20px; font-weight:800; word-break:break-all; line-height:1.3; }
    .id-sub { margin:4px 0 0; color:#718096; font-size:11px; }
    .body { padding:20px; }
    .section-title { margin:0 0 12px; color:#0a3d73; font-size:14px; font-weight:700; padding-bottom:8px; border-bottom:2px solid #e2e8f0; }
    .details-table { width:100%; border-collapse:collapse; border-radius:8px; overflow:hidden; border:1px solid #e8edf2; margin-bottom: 20px; }
    .details-label { width:35%; padding:12px 14px; background:#f0f4f8; color:#718096; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #e8edf2; border-right:1px solid #e8edf2; vertical-align:top; }
    .details-value { width:65%; padding:12px 14px; background:#f8fafc; color:#1a202c; font-size:14px; font-weight:500; word-break:break-word; border-bottom:1px solid #e8edf2; vertical-align:top; line-height:1.4; }
    .footer { background:#0a3d73; padding:18px 20px; text-align:center; }
    .footer p { margin:0; color:rgba(255,255,255,0.8); font-size:12px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <p>L&amp;L Hospital · Malumichampatti</p>
      <h1>New Appointment Received</h1>
    </div>
    <div class="id-banner">
      <p class="id-label">Appointment Reference Number</p>
      <p class="id-value">${appointmentId}</p>
      <p class="id-sub">Received: ${bookedAt}</p>
    </div>
    <div class="body">
      <h2 class="section-title">Patient Information</h2>
      <table class="details-table" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="details-label">Full Name</td><td class="details-value">${fullName}</td></tr>
        <tr><td class="details-label">Email</td><td class="details-value">${email}</td></tr>
        <tr><td class="details-label">Phone</td><td class="details-value">${phone}</td></tr>
        <tr><td class="details-label">Dept</td><td class="details-value">${speciality}</td></tr>
        <tr><td class="details-label">Date</td><td class="details-value">${formattedDate}</td></tr>
        <tr><td class="details-label">Time</td><td class="details-value">${timeSlot}</td></tr>
        ${messages ? `<tr><td class="details-label">Notes</td><td class="details-value">${messages}</td></tr>` : ''}
      </table>
    </div>
    <div class="footer">
      <p>L&amp;L Hospital Appointment System</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Patient Confirmation Email Template ──────────────────────────────────────
function patientEmailTemplate({ appointmentId, fullName, speciality, formattedDate, timeSlot }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <style>
    body { margin:0; padding:0; background:#eef2f7; }
    .wrap { max-width:600px; margin:0 auto; background:#fff; font-family:'Segoe UI',Arial,sans-serif; }
    .header { background:linear-gradient(135deg,#0a3d73,#1a6bb5); padding:36px 20px; text-align:center; }
    .header h1 { margin:8px 0 0; color:#fff; font-size:24px; font-weight:700; }
    .body { padding:20px; }
    .id-box { background:#f0f7ff; border-radius:12px; padding:18px 16px; text-align:center; border:1px solid #bfdbfe; margin-bottom:20px; }
    .id-value { margin:8px 0 0; color:#0a3d73; font-size:22px; font-weight:800; word-break:break-all; }
    .card { border-radius:12px; overflow:hidden; border:1px solid #e2e8f0; margin-bottom:20px; }
    .detail-row { display:block; border-bottom:1px solid #f0f0f0; padding:12px 16px; }
    .detail-value { display:block; color:#1a202c; font-size:14px; font-weight:600; }
    .footer { background:#f8fafc; padding:20px; text-align:center; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>Appointment Confirmed</h1>
      <p>L&amp;L Hospital · Malumichampatti</p>
    </div>
    <div class="body">
      <p>Hi ${fullName}, your appointment has been successfully booked.</p>
      <div class="id-box">
        <p>Your Reference ID</p>
        <p class="id-value">${appointmentId}</p>
      </div>
      <div class="card">
        <span class="detail-row"><span class="detail-value">${speciality}</span></span>
        <span class="detail-row"><span class="detail-value">${formattedDate}</span></span>
        <span class="detail-row"><span class="detail-value">${timeSlot}</span></span>
      </div>
    </div>
    <div class="footer">
      <p>L&amp;L Hospital · Malumichampatti</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── API Endpoint ─────────────────────────────────────────────────────────────
app.post('/api/book-appointment', async (req, res) => {
    try {
        const { fullName, email, phone, speciality, date, timeSlot, messages } = req.body;

        if (!fullName || !email || !phone || !speciality || !date || !timeSlot) {
            return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
        }

        const appointmentId = generateAppointmentId();
        const bookedAt = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            weekday: 'long', year: 'numeric', month: 'long',
            day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const appointmentDate = new Date(date + 'T00:00:00');
        const formattedDate = appointmentDate.toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        const emailData = { appointmentId, fullName, email, phone, speciality, formattedDate, timeSlot, messages, bookedAt };
        const { hospitalTransporter, patientTransporter } = getTransporters();

        await hospitalTransporter.sendMail({
            from: `"L&L Hospital Booking" <${process.env.EMAIL_USER_1}>`,
            to: process.env.HOSPITAL_EMAIL,
            subject: `🏥 New Appointment [${appointmentId}]`,
            html: hospitalEmailTemplate(emailData),
        });

        await patientTransporter.sendMail({
            from: `"L&L Hospital" <${process.env.EMAIL_USER_2}>`,
            to: email,
            subject: `✅ Appointment Confirmed [${appointmentId}]`,
            html: patientEmailTemplate(emailData),
        });

        res.json({ success: true, appointmentId });
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'L&L Hospital API' });
});

module.exports = app;
