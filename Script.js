const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");

menuBtn.addEventListener("click", () => {
  sidebar.classList.toggle("active");
});

function switchTab(tabId) {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.remove("active");
  });

  document.getElementById(tabId).classList.add("active");
  sidebar.classList.remove("active");
}

function addTask() {
  const task = prompt("Enter new task:");
  if (!task) return;

  const li = document.createElement("li");
  li.innerHTML = `<input type="checkbox" /> ${task}`;
  document.getElementById("taskList").appendChild(li);
}

function handleChat(event) {
  if (event.key === "Enter") {
    const input = document.getElementById("chatInput");
    const chatBox = document.getElementById("chatBox");

    const userMessage = document.createElement("p");
    userMessage.textContent = "You: " + input.value;
    chatBox.appendChild(userMessage);

    const aiMessage = document.createElement("p");
    aiMessage.textContent = "AI: Stay focused! You’ve got this 💪";
    chatBox.appendChild(aiMessage);

    input.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}
