/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");

let selectedProducts = [];

productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card" data-product-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
        <p class="product-description">${product.description}</p>
        <button class="add-product-btn" onclick="addProductToSelection(${product.id})">
          <i class="fa-solid fa-plus"></i> Add to Routine
        </button>
      </div>
    </div>
  `
    )
    .join("");
}

categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

async function addProductToSelection(productId) {
  const products = await loadProducts();
  const product = products.find((p) => p.id === productId);

  if (selectedProducts.find((p) => p.id === productId)) {
    alert(
      "✨ That product is already in your routine! Try adding something different to complete your beauty regimen."
    );
    return;
  }

  selectedProducts.push(product);

  updateSelectedProductsDisplay();
}

function removeProductFromSelection(productId) {
  selectedProducts = selectedProducts.filter((p) => p.id !== productId);
  updateSelectedProductsDisplay();
}

function updateSelectedProductsDisplay() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `
      <p class="no-products">No products selected yet! Choose from the categories above to start building your perfect beauty routine. </p>
    `;
    return;
  }

  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
      <div class="selected-product">
        <img src="${product.image}" alt="${product.name}" class="selected-product-img">
        <div class="selected-product-info">
          <h4>${product.name}</h4>
          <p>${product.brand}</p>
          <p class="category">${product.category}</p>
        </div>
        <button class="remove-product-btn" onclick="removeProductFromSelection(${product.id})">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
    `
    )
    .join("");
}

generateRoutineBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    alert(
      "💄 Please select some products first! Browse the categories above to build your beauty routine."
    );
    return;
  }

  const productNames = selectedProducts
    .map((p) => `${p.brand} ${p.name}`)
    .join(", ");
  const productCategories = [
    ...new Set(selectedProducts.map((p) => p.category)),
  ].join(", ");

  const routineMessage = `Please create a comprehensive beauty routine using these specific products I've selected: ${productNames}. 

Product categories I have: ${productCategories}

Please provide:
🌅 Complete morning routine with step-by-step order
🌙 Complete evening routine with step-by-step order  
⏰ Timing and frequency for each product
💡 Pro tips for maximum effectiveness
⚠️ Any important warnings or considerations

Format your response with clear sections, emojis, and bullet points to make it easy to follow!`;

  chatWindow.innerHTML += `
    <div class="message user">
      Generate a routine with my selected products
    </div>
  `;

  chatWindow.innerHTML += `
    <div class="message ai">
      <em> Creating your personalized routine... This will be amazing!</em>
    </div>
  `;

  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    const aiResponse = await callOpenAIWorker(routineMessage);

    const messages = chatWindow.querySelectorAll(".message");
    const lastMessage = messages[messages.length - 1];
    lastMessage.innerHTML = formatAIResponse(aiResponse);
  } catch (error) {
    const messages = chatWindow.querySelectorAll(".message");
    const lastMessage = messages[messages.length - 1];
    lastMessage.innerHTML =
      "I'm having trouble creating your routine right now. Please try again! I promise to make it worth the wait! ";
  }

  chatWindow.scrollTop = chatWindow.scrollHeight;
});

document.addEventListener("DOMContentLoaded", () => {
  updateSelectedProductsDisplay();
});

function formatAIResponse(text) {
  let formatted = text
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")

    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

    .replace(/\*(.*?)\*/g, "<em>$1</em>")

    .replace(/^[•\-\*] (.*$)/gm, "<li>$1</li>")

    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>");

  formatted = formatted.replace(
    /(<li>.*?<\/li>)(\s*<br>\s*<li>.*?<\/li>)*/g,
    function (match) {
      return "<ul>" + match.replace(/<br>\s*/g, "") + "</ul>";
    }
  );

  formatted = formatted
    .replace(/<br><br>(<[uh][123l]>)/g, "$1")
    .replace(/(<\/[uh][123l]>)<br><br>/g, "$1<br>")
    .replace(/<br>(<[uh][123l]>)/g, "$1")
    .replace(/(<\/[uh][123l]>)<br>/g, "$1");

  return formatted;
}

async function callOpenAIWorker(userMessage) {
  try {
    const requestBody = {
      messages: [
        {
          role: "system",
          content: `You are a sophisticated L'Oréal Beauty AI advisor 💄✨. Your responses should be:

FORMATTING GUIDELINES:
- Use relevant emojis to make responses visually appealing
- Structure information with clear sections using headers
- Use bullet points (•) for lists
- Create simple tables when comparing products
- Use line breaks for better readability

CONTENT GUIDELINES:
- Provide detailed, helpful skincare/beauty advice
- You can reference real L'Oréal brands (CeraVe, La Roche-Posay, Vichy, Lancôme, etc.)
- For routine recommendations, include:
  🌅 Morning steps
  🌙 Evening steps
  ⏰ Application timing
  💡 Pro tips

RESPONSE STRUCTURE:
1. Friendly greeting with emoji
2. Main advice with proper formatting
3. Helpful tips or warnings if relevant
4. Encouraging closing

If asked about non-beauty topics, politely redirect: "I'm your beauty expert! 💄 Let's focus on skincare, haircare, or makeup questions."

Keep responses informative but conversational, like talking to a knowledgeable friend who works at Sephora.`,
        },
        { role: "user", content: userMessage },
      ],
    };

    const response = await fetch(
      "https://lo-real-worker.alejandrog3.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }

    const data = await response.json();

    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error fetching OpenAI API:", error);
    return "😔 I'm experiencing some technical difficulties right now! Please try again in a moment. I'm here to help you look and feel amazing! ✨💄";
  }
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userInput = document.getElementById("userInput");
  const userMessage = userInput.value.trim();

  if (!userMessage) return;

  chatWindow.innerHTML += `
    <div class="message user">
      ${userMessage}
    </div>
  `;

  chatWindow.innerHTML += `
    <div class="message ai">
      <em>💭 Thinking... Let me help you with that!</em>
    </div>
  `;

  userInput.value = "";

  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    const aiResponse = await callOpenAIWorker(userMessage);

    const messages = chatWindow.querySelectorAll(".message");
    const lastMessage = messages[messages.length - 1];
    lastMessage.innerHTML = formatAIResponse(aiResponse);
  } catch (error) {
    const messages = chatWindow.querySelectorAll(".message");
    const lastMessage = messages[messages.length - 1];
    lastMessage.innerHTML =
      "😔 Oops! I'm having trouble connecting right now. Please try again in a moment! 💄✨";
  }

  chatWindow.scrollTop = chatWindow.scrollHeight;
});
