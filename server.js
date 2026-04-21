const app = require('./api-logic');
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`\n🏥 L&L Hospital Local API Server`);
    console.log(`✅ Running on http://localhost:${PORT}`);
    console.log(`📧 Hospital alerts → ${process.env.HOSPITAL_EMAIL}`);
    console.log(`─────────────────────────────────\n`);
});
