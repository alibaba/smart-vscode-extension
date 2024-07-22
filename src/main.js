// Assuming vscode is properly initialized here for message passing

document.addEventListener('DOMContentLoaded', () => {
  console.log('Webview loaded!');
  const input = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  const messagesList = document.getElementById('messagesList');

  // Function to send message to extension and display in view
  function sendMessage() {
      const message = input.value.trim();
      if (message) {
          vscode.postMessage({ command: 'input', text: message });
          input.value = ''; // Clear the input box after sending
          displayMessage(message); // Display the message in the WebView
      }
  }

  // Function to display messages in the list view
  function displayMessage(message) {
      const messageElement = document.createElement('li');
      messageElement.textContent = message;
      messagesList.appendChild(messageElement);
  }

  // Event listener for the send button
  sendButton.addEventListener('click', sendMessage);

  // Optionally handle enter to send the message
  input.addEventListener('keypress', function (event) {
      if (event.key === 'Enter') {
          event.preventDefault(); // Prevent the default action to stop form submission
          sendMessage();
      }
  });

  // Listen for messages from the extension
  window.addEventListener('message', event => {
      const {command, content} = event.data;
      if (command === 'showInputAndAnswer') {
          displayMessage(content); // If the extension sends a message back, display it
      }
  });
});
