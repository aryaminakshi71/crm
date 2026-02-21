/**
 * Lead Capture Form Embed Script
 * Usage: <script src="https://yourdomain.com/embed/lead-form.js?token=YOUR_TOKEN"></script>
 */

(function () {
  const script = document.currentScript;
  const token = new URLSearchParams(script.src.split("?")[1] || "").get(
    "token",
  );

  if (!token) {
    console.error("Lead form: Token is required");
    return;
  }

  const apiUrl = script.src.split("/embed/")[0] || window.location.origin;

  // Create form container
  const formContainer = document.createElement("div");
  formContainer.id = "crm-lead-form-container";
  formContainer.innerHTML = `
    <style>
      #crm-lead-form-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 400px;
        margin: 20px auto;
        padding: 24px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      #crm-lead-form-container form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      #crm-lead-form-container input {
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
      }
      #crm-lead-form-container button {
        padding: 12px 24px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
      }
      #crm-lead-form-container button:hover {
        background: #2563eb;
      }
      #crm-lead-form-container button:disabled {
        background: #9ca3af;
        cursor: not-allowed;
      }
      #crm-lead-form-container .success {
        color: #10b981;
        font-size: 14px;
        margin-top: 8px;
      }
      #crm-lead-form-container .error {
        color: #ef4444;
        font-size: 14px;
        margin-top: 8px;
      }
    </style>
    <form id="crm-lead-form">
      <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Get Started</h3>
      <input type="text" name="firstName" placeholder="First Name" />
      <input type="text" name="lastName" placeholder="Last Name" />
      <input type="email" name="email" placeholder="Email *" required />
      <input type="tel" name="phone" placeholder="Phone" />
      <input type="text" name="companyName" placeholder="Company Name" />
      <button type="submit">Submit</button>
      <div id="crm-form-message"></div>
    </form>
  `;

  // Insert form into page
  const targetElement = script.getAttribute("data-target")
    ? document.querySelector(script.getAttribute("data-target"))
    : document.body;

  if (targetElement) {
    targetElement.appendChild(formContainer);
  }

  // Handle form submission
  const form = formContainer.querySelector("#crm-lead-form");
  const messageDiv = formContainer.querySelector("#crm-form-message");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = "Submitting...";
    messageDiv.innerHTML = "";

    const formData = new FormData(form);
    const data = {
      formToken: token,
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      companyName: formData.get("companyName"),
    };

    try {
      const response = await fetch(`${apiUrl}/api/public/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        messageDiv.innerHTML =
          '<div class="success">✓ Thank you! We\'ll be in touch soon.</div>';
        form.reset();
      } else {
        messageDiv.innerHTML = `<div class="error">${result.error || "Something went wrong. Please try again."}</div>`;
      }
    } catch (error) {
      messageDiv.innerHTML =
        '<div class="error">Network error. Please try again.</div>';
    } finally {
      button.disabled = false;
      button.textContent = "Submit";
    }
  });
})();
