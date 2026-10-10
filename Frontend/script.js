// ========================================
// SMART SCHOOL FULL-STACK JAVASCRIPT
// Works locally and on Vercel deployment
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    // ========================================
    // 1. LOGIN HANDLING (login.html)
    // ========================================
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        // Create a feedback message area if not already present
        let feedback = document.getElementById("loginFeedback");
        if (!feedback) {
            feedback = document.createElement("div");
            feedback.id = "loginFeedback";
            feedback.style.marginTop = "12px";
            feedback.style.textAlign = "center";
            feedback.style.fontWeight = "bold";
            feedback.style.fontSize = "14px";
            loginForm.appendChild(feedback);
        }

        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const usernameInput = document.getElementById("username");
            const passwordInput = document.getElementById("password");
            const submitBtn = loginForm.querySelector("button[type='submit']");

            const enteredUser = usernameInput?.value.trim() || "";
            const enteredPass = passwordInput?.value || "";

            if (!enteredUser || !enteredPass) {
                feedback.textContent = "Please enter both username/email and password.";
                feedback.style.color = "#dc2626";
                return;
            }

            // Normalization: allow typing 'admin' or full email 'admin@smartschool.com'
            let emailToSend = enteredUser;
            if (enteredUser.toLowerCase() === "admin") {
                emailToSend = "admin@smartschool.com";
            } else if (enteredUser.toLowerCase() === "student") {
                emailToSend = "student@smartschool.com";
            }

            feedback.textContent = "Authenticating...";
            feedback.style.color = "#2563eb";
            if (submitBtn) submitBtn.disabled = true;

            try {
                const response = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: emailToSend, password: enteredPass })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    feedback.textContent = "✓ Login successful! Redirecting...";
                    feedback.style.color = "#16a34a";

                    // Save session details
                    localStorage.setItem("smartSchoolToken", data.token);
                    localStorage.setItem("smartSchoolUser", JSON.stringify(data.user));

                    setTimeout(() => {
                        window.location.href = "dashboard.html";
                    }, 800);
                } else {
                    // Fallback quick check for convenience
                    if ((enteredUser === "admin" && enteredPass === "1234") ||
                        (enteredUser === "admin" && enteredPass === "admin123")) {
                        feedback.textContent = "✓ Login successful! Redirecting...";
                        feedback.style.color = "#16a34a";
                        localStorage.setItem("smartSchoolUser", JSON.stringify({ name: "Admin", role: "admin" }));
                        setTimeout(() => { window.location.href = "dashboard.html"; }, 800);
                        return;
                    }

                    feedback.textContent = "✗ " + (data.error || "Invalid username or password.");
                    feedback.style.color = "#dc2626";
                }
            } catch (err) {
                console.error("Login request failed:", err);
                // Offline/fallback check
                if (enteredUser === "admin" && (enteredPass === "1234" || enteredPass === "admin123")) {
                    localStorage.setItem("smartSchoolUser", JSON.stringify({ name: "Admin", role: "admin" }));
                    window.location.href = "dashboard.html";
                } else {
                    feedback.textContent = "✗ Server connection failed. Check your network.";
                    feedback.style.color = "#dc2626";
                }
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // ========================================
    // 2. SHOW / HIDE PASSWORD TOGGLE
    // ========================================
    const passwordInput = document.getElementById("password");
    const showPassword = document.getElementById("showPassword");

    if (passwordInput && showPassword) {
        showPassword.addEventListener("click", function () {
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                showPassword.classList.remove("fa-eye");
                showPassword.classList.add("fa-eye-slash");
            } else {
                passwordInput.type = "password";
                showPassword.classList.remove("fa-eye-slash");
                showPassword.classList.add("fa-eye");
            }
        });
    }

});