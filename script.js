document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.querySelector('.nav-list');

    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            navList.classList.toggle('active');
            // Change icon
            if (navList.classList.contains('active')) {
                menuToggle.classList.remove('fa-bars');
                menuToggle.classList.add('fa-xmark');
            } else {
                menuToggle.classList.remove('fa-xmark');
                menuToggle.classList.add('fa-bars');
            }
        });
    }

    // 2. Sticky Header Effects
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // close mobile menu when clicking a link
    const navLinks = document.querySelectorAll('.nav-list a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navList.classList.contains('active')) {
                navList.classList.remove('active');
                menuToggle.classList.remove('fa-xmark');
                menuToggle.classList.add('fa-bars');
            }
        });
    });

    // 3. Appointment Form Submission — Real API
    const appointmentForm = document.getElementById('appointmentForm');
    const formFeedback = document.getElementById('formFeedback');
    const formError = document.getElementById('formError');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const apptIdDisplay = document.getElementById('apptIdDisplay');
    const errorMsg = document.getElementById('errorMsg');

    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Collect form values
            const fullName = document.getElementById('fullName').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const speciality = document.getElementById('speciality').value;
            const date = document.getElementById('date').value;
            const timeSlot = document.getElementById('timeSlot').value;
            const messages = document.getElementById('messages').value.trim();

            // Hide previous feedback/error
            formFeedback.classList.add('hidden');
            formError.classList.add('hidden');

            // Show loading state
            btnText.style.display = 'none';
            btnSpinner.style.display = 'inline';
            submitBtn.disabled = true;

            try {
                const response = await fetch('/api/book-appointment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullName, email, phone, speciality, date, timeSlot, messages }),
                });

                const data = await response.json();

                if (data.success) {
                    // Show success with appointment ID
                    apptIdDisplay.textContent = data.appointmentId;
                    formFeedback.classList.remove('hidden');
                    appointmentForm.reset();

                    // Scroll to feedback
                    formFeedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    errorMsg.textContent = data.message || 'Something went wrong. Please try again.';
                    formError.classList.remove('hidden');
                    if (data.error) {
                        console.error('Backend Error:', data.error);
                        console.error('Stack Trace:', data.stack);
                    }
                }
            } catch (err) {
                errorMsg.textContent = 'Could not reach the server. Please ensure the backend is running.';
                formError.classList.remove('hidden');
            } finally {
                // Restore button
                btnText.style.display = 'inline';
                btnSpinner.style.display = 'none';
                submitBtn.disabled = false;
            }
        });
    }

    // Set minimum date for appointment (today)
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
});
