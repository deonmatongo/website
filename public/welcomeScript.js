document.addEventListener("DOMContentLoaded", function () {
    const startBtn = document.getElementById("start-btn");
    const uniqueCodeInput = document.getElementById("unique-code");
    const errorMsg = document.getElementById("error-msg");
    const welcomeContainer = document.getElementById("welcome-container");

    // Check if the test has been completed
    const testCompleted = localStorage.getItem("testCompleted");
    if (testCompleted === "true") {
        welcomeContainer.innerHTML = `<h1>Thank you for completing the test!</h1>
                                      <p>We have received your submission. Further feedback will be provided soon.</p>`;
        return;
    }

    startBtn.addEventListener("click", function () {
        const uniqueCode = uniqueCodeInput.value;
        const selectedLanguage = document.getElementById("language-select").value;
        fetch('/validateCode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                uniqueCode: uniqueCode,
                selectedLanguage: selectedLanguage
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.valid) {
                localStorage.setItem("unique-code", uniqueCode);
                localStorage.setItem("accessGranted", "true");
                localStorage.setItem("selectedLanguage", selectedLanguage);
                window.location.href = "/test";
            } else {
                console.log('not valid')
                errorMsg.textContent = data.message || "An error occurred. Please try again.";
            }
        })
        .catch(error => {
            console.error('Error:', error);
            errorMsg.textContent = "An error occurred. Please try again.";
        });
    });
});
