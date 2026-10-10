// ========================================
// SMART SCHOOL LOGIN
// ========================================


const loginForm = document.getElementById("loginForm");


// ========================================
// LOGIN
// ========================================

if (loginForm) {

    loginForm.addEventListener("submit", function(event) {

        // Stop page from refreshing
        event.preventDefault();


        // Get username
        const username =
            document.getElementById("username").value.trim();


        // Get password
        const password =
            document.getElementById("password").value;


        // ========================================
        // CHECK LOGIN DETAILS
        // ========================================

        if (
            username === "admin" &&
            password === "1234"
        ) {

            alert("Login successful!");


            // Open dashboard
            window.location.href = "dashboard.html";

        }

        else {

            alert("Wrong username or password!");

        }

    });

}


// ========================================
// SHOW / HIDE PASSWORD
// ========================================

const passwordInput =
    document.getElementById("password");


const showPassword =
    document.getElementById("showPassword");


if (
    passwordInput &&
    showPassword
) {

    showPassword.addEventListener(
        "click",
        function() {

            if (
                passwordInput.type === "password"
            ) {

                passwordInput.type = "text";


                showPassword.classList.remove(
                    "fa-eye"
                );


                showPassword.classList.add(
                    "fa-eye-slash"
                );

            }

            else {

                passwordInput.type = "password";


                showPassword.classList.remove(
                    "fa-eye-slash"
                );


                showPassword.classList.add(
                    "fa-eye"
                );

            }

        }
    );

}