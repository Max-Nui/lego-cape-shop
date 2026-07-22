//==================================================
// CART CORE SETUP
//==================================================
const Cart = {
    storageKey: "cart",

    get() {
        return JSON.parse(localStorage.getItem(this.storageKey)) || [];
    },

    set(cart) {
        localStorage.setItem(this.storageKey, JSON.stringify(cart));
    },

    // Accept optional 'url' parameter
    addItem({ id, name, price, color, quantity, url }) {
        const cart = Cart.get();
        const existing = cart.find(item => item.id === id && item.color === color);

        if (existing) {
            existing.quantity += quantity;
            // Backfill URL if missing from an older item entry
            if (!existing.url && url) existing.url = url;
        } else {
            cart.push({ 
                id, 
                name, 
                price, 
                color, 
                quantity, 
                url: url || window.location.pathname 
            });
        }
        this.set(cart);
    }
};

//==================================================
// UTILITY FUNCTIONS
//==================================================
function buildPayPalItems(cart) {
    return cart.map(item => ({
        name: `${item.name} (${item.color})`,
        unit_amount: {
            currency_code: "USD",
            value: item.price.toFixed(2)
        },
        quantity: item.quantity.toString()
    }));
}

function calculateCartTotal(cart) {
    return cart.reduce((sum, item) => {
        return sum + item.price * item.quantity;
    }, 0).toFixed(2);
}

//==================================================
// NAV CART & MINI-CART DROPDOWN LOGIC
//==================================================
function updateNavCart() {
    const cart = Cart.get();
    const countEl = document.querySelector(".cart-count");
    const dropdownItemsEl = document.querySelector(".cart-dropdown-items");
    const dropdownTotalEl = document.querySelector(".cart-dropdown-total");

    // 1. Calculate total individual items (summing quantities)
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (countEl) countEl.textContent = totalCount;

    // 2. Render Mini-Cart Dropdown
    if (dropdownItemsEl && dropdownTotalEl) {
        dropdownItemsEl.innerHTML = "";
        let total = 0;

        if (cart.length === 0) {
            dropdownItemsEl.innerHTML = `<p class="empty-msg">Your cart is empty.</p>`;
        } else {
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                total += itemTotal;

                const row = document.createElement("div");
                row.className = "dropdown-item";
                row.innerHTML = `
                    <div class="item-info">
                        <strong>${item.name}</strong>
                        <span>Color: ${item.color} | Qty: ${item.quantity}</span>
                    </div>
                    <span class="item-price">$${itemTotal.toFixed(2)}</span>
                `;
                dropdownItemsEl.appendChild(row);
            });
        }

        dropdownTotalEl.textContent = total.toFixed(2);
    }
}

//==================================================
// DOM CONTENT LOADED
//==================================================
document.addEventListener("DOMContentLoaded", () => {
    let paypalRendered = false;

    // --- NAV CART & MINI-CART DROPDOWN LOGIC (NEW) ---
    function updateNavCart() {
        if (typeof Cart === "undefined") return;
        const cart = Cart.get();
        const countEl = document.querySelector(".cart-count");
        const dropdownItemsEl = document.querySelector(".cart-dropdown-items");
        const dropdownTotalEl = document.querySelector(".cart-dropdown-total");

        // 1. Calculate total individual items (summing quantities)
        const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (countEl) countEl.textContent = totalCount;

        // 2. Render Mini-Cart Dropdown
        if (dropdownItemsEl && dropdownTotalEl) {
            dropdownItemsEl.innerHTML = "";
            let total = 0;

            if (cart.length === 0) {
                dropdownItemsEl.innerHTML = `<p class="empty-msg">Your cart is empty.</p>`;
            } else {
                cart.forEach(item => {
                    const itemTotal = item.price * item.quantity;
                    total += itemTotal;
                    const itemUrl = item.url || "/pages/cart.html"; // Fallback URL

                    const row = document.createElement("div");
                    row.className = "dropdown-item";
                    row.innerHTML = `
                        <div class="item-info">
                            <a href="${itemUrl}"><strong>${item.name}</strong></a>
                            <span>Color: ${item.color} | Qty: ${item.quantity}</span>
                        </div>
                        <span class="item-price">$${itemTotal.toFixed(2)}</span>
                    `;
                    dropdownItemsEl.appendChild(row);
                });
            }

            dropdownTotalEl.textContent = total.toFixed(2);
        }
    }

    // --- HOME PAGE GALLERY ---
    const slides = document.querySelectorAll(".gallery img");
    if (slides.length > 0) {
        let homeIndex = 0;
        slides.forEach((slide, index) => slide.classList.toggle("active", index === 0));
        setInterval(() => {
            slides[homeIndex].classList.remove("active");
            homeIndex = (homeIndex + 1) % slides.length;
            slides[homeIndex].classList.add("active");
        }, 10000);
    }

    // --- ITEM PAGE GALLERY ---
    const itemGallery = document.querySelector(".item-gallery");
    if (itemGallery) {
        const images = itemGallery.querySelectorAll("img");
        const prevBtn = itemGallery.querySelector(".prev");
        const nextBtn = itemGallery.querySelector(".next");
        let itemIndex = 0;

        function showImage(index) {
            images.forEach((img, i) => img.classList.toggle("active", i === index));
        }

        prevBtn?.addEventListener("click", () => {
            itemIndex = (itemIndex - 1 + images.length) % images.length;
            showImage(itemIndex);
        });

        nextBtn?.addEventListener("click", () => {
            itemIndex = (itemIndex + 1) % images.length;
            showImage(itemIndex);
        });
    }

    // --- QUANTITY SELECTOR ---
    document.querySelectorAll(".quantity-selector").forEach(selector => {
        const valueEl = selector.querySelector(".qty-value");
        selector._quantity = parseInt(selector.dataset.qty, 10) || 1;

        const updateDisplay = () => {
            valueEl.textContent = selector._quantity;
            selector.dataset.qty = selector._quantity;
        };

        selector.querySelector(".increment")?.addEventListener("click", () => {
            selector._quantity += 1;
            updateDisplay();
        });

        selector.querySelector(".decrement")?.addEventListener("click", () => {
            if (selector._quantity > 1) {
                selector._quantity -= 1;
                updateDisplay();
            }
        });
        updateDisplay();
    });

    // --- COLOR SELECTOR ---
    const colorList = document.querySelector(".color-options");
    const selectedColorText = document.querySelector(".selected-color-text strong");
    if (colorList && selectedColorText) {
        colorList.querySelectorAll("li").forEach(colorItem => {
            colorItem.addEventListener("click", () => {
                colorList.querySelectorAll("li").forEach(li => li.classList.remove("selected"));
                colorItem.classList.add("selected");
                selectedColorText.textContent = colorItem.dataset.color;
            });
        });
    }

    // --- CART RENDERING ---
    function renderCart() {
        const cartItemsEl = document.querySelector(".cart-items");
        const totalEl = document.querySelector(".cart-total");
        const warningEl = document.querySelector(".cart-warning");
        if (!cartItemsEl || !totalEl) return;

        const cart = Cart.get();
        cartItemsEl.innerHTML = "";
        let total = 0;

        if (cart.length === 0) {
            cartItemsEl.innerHTML = `<p class="empty-cart-msg">Your cart is currently empty.</p>`;
        } else {
            // Optional: Header Row for desktop
            const headerRow = document.createElement("div");
            headerRow.className = "cart-header";
            headerRow.innerHTML = `
                <span>Item</span>
                <span>Color</span>
                <span>Qty</span>
                <span>Price</span>
                <span></span>
            `;
            cartItemsEl.appendChild(headerRow);

            cart.forEach((item, index) => {
                const itemTotal = item.price * item.quantity;
                total += itemTotal;
                const itemUrl = item.url || '#';

                const row = document.createElement("div");
                row.className = "cart-item";
                row.innerHTML = `
                    <div class="col-name">
                        <a href="${itemUrl}"><strong>${item.name}</strong></a>
                    </div>
                    <div class="col-color">Color: ${item.color}</div>
                    <div class="col-qty">Qty: ${item.quantity}</div>
                    <div class="col-price">$${itemTotal.toFixed(2)}</div>
                    <div class="col-action">
                        <button data-index="${index}" class="remove-item">Remove</button>
                    </div>
                `;
                cartItemsEl.appendChild(row);
            });
        }

        totalEl.textContent = `Total: $${total.toFixed(2)} USD`;

        const paypalContainer = document.querySelector("#paypal-button-container");
        if (total < 5) {
            warningEl?.classList.remove("hidden");
            if (paypalRendered && paypalContainer) {
                paypalContainer.innerHTML = "";
                paypalRendered = false;
            }
        } else {
            warningEl?.classList.add("hidden");
            if (!paypalRendered) {
                renderPayPalButton();
                paypalRendered = true;
            }
        }
        setupRemoveButtons();
        updateNavCart();
    }

    function setupRemoveButtons() {
        document.querySelectorAll(".remove-item").forEach(btn => {
            btn.addEventListener("click", () => {
                const cart = Cart.get();
                cart.splice(btn.dataset.index, 1);
                Cart.set(cart);
                renderCart();
                updateNavCart(); // (UPDATED) Update navbar immediately when item is removed
            });
        });
    }

    // --- ADD TO CART LISTENER ---
    const addToCartBtn = document.querySelector(".add-to-cart-button");
    if (addToCartBtn) {
        addToCartBtn.addEventListener("click", () => {
            const id = addToCartBtn.dataset.id;
            const name = addToCartBtn.dataset.name;
            const price = parseFloat(addToCartBtn.dataset.price);
            const qtyVal = document.querySelector(".qty-value")?.textContent || "1";
            const quantity = parseInt(qtyVal, 10);
            const selectedColorEl = document.querySelector(".color-options li.selected");

            if (!selectedColorEl) return alert("Please select a color.");

            Cart.addItem({
                id: id,
                name: name,
                price: price,
                color: selectedColorEl.dataset.color,
                quantity,
                url: window.location.pathname // Captures the exact product page path
            });

            const selector = document.querySelector(".quantity-selector");
            if (selector) {
                selector._quantity = 1;
                selector.querySelector(".qty-value").textContent = "1";
            }

            updateNavCart();

            const btnText = addToCartBtn.querySelector("h3") || addToCartBtn;
            const originalText = btnText.textContent;
            btnText.textContent = "Added to Cart!";
            addToCartBtn.style.backgroundColor = "lightseagreen";
            addToCartBtn.style.color = "white";
            
            setTimeout(() => { 
                btnText.textContent = originalText; 
                addToCartBtn.style.backgroundColor = "";
                addToCartBtn.style.color = "";
            }, 1200);
        });
    }

    // --- PAYPAL BUTTON RENDER ---
    function renderPayPalButton() {
        const container = document.querySelector("#paypal-button-container");
        if (!container || typeof paypal === "undefined") return;
        container.innerHTML = "";

        paypal.Buttons({
            createOrder: (data, actions) => {
                const cart = Cart.get();
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            currency_code: "USD",
                            value: calculateCartTotal(cart),
                            breakdown: { item_total: { currency_code: "USD", value: calculateCartTotal(cart) } }
                        },
                        items: buildPayPalItems(cart)
                    }]
                });
            },
            onApprove: (data, actions) => {
                return actions.order.capture().then(details => {
                    const captureId = details.purchase_units[0].payments.captures[0].id;
                    const orderId = data.orderID;

                    console.log("Order ID:", orderId);
                    console.log("Capture/Transaction ID:", captureId);

                    //TODO: Send both orderid and capture id to netlify backend database

                    Cart.set([]);
                    window.location.href = '/pages/order-confirmation.html?order=' + orderId + '&tx=' + captureId;
                });
            },
            onError: (err) => {
                console.error("PayPal Error:", err);
                alert("Payment could not be processed.");
            }
        }).render("#paypal-button-container");
    }

    // --- ORDER LOOKUP LOGIC ---
    const lookupForm = document.getElementById('order-lookup-form');
    if (lookupForm) {
        lookupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Grab either Order ID or Transaction ID typed into the field
            const searchID = document.getElementById('order-id').value.trim();
            const userEmail = document.getElementById('email').value.trim();
            
            const resultsDiv = document.getElementById('results');
            const statusText = document.getElementById('status-text');
            const itemsList = document.getElementById('items-list');
            const trackingDiv = document.getElementById('tracking-info');
            const submitBtn = lookupForm.querySelector('button');
            const idDisplayDiv = document.getElementById('id-display');

            submitBtn.disabled = true;
            submitBtn.textContent = "Searching Archives...";

            try {
                const response = await fetch('/.netlify/functions/lookup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // Send searchID which can be orderID OR transactionID
                    body: JSON.stringify({ searchID, orderID: searchID, userEmail }) 
                });

                const data = await response.json();

                if (response.ok) {
                    const statusMap = {
                        'COMPLETED': 'Order Tailored & Dispatched!',
                        'APPROVED': 'Fabric Selected / Awaiting Tailoring',
                        'CREATED': 'Pattern Drafted'
                    };

                    if (resultsDiv) resultsDiv.style.display = 'block';
                    if (statusText) statusText.innerText = statusMap[data.status] || data.status;

                    // Optional: Render both returned IDs in your lookup UI
                    if (idDisplayDiv) {
                        idDisplayDiv.innerHTML = `
                            <p><strong>Order ID:</strong> ${data.orderID}</p>
                            <p><strong>Transaction ID:</strong> ${data.transactionID}</p>
                        `;
                    }

                    if (trackingDiv) {
                        if (data.tracking) {
                            trackingDiv.innerHTML = `
                                <p><strong>Tracking:</strong> ${data.tracking.carrier} 
                                <a href="${data.tracking.url}" target="_blank">${data.tracking.number}</a></p>
                            `;
                        } else {
                            trackingDiv.innerHTML = `<p><em>Tracking will generate once your package ships (orders over $50 USD qualify for free tracking).</em></p>`;
                        }
                    }

                    if (itemsList) {
                        if (data.items && data.items.length > 0) {
                            itemsList.innerHTML = `<ul>${data.items.map(i => `<li>${i.quantity}x ${i.name}</li>`).join('')}</ul>`;
                        } else {
                            itemsList.innerText = "Custom Order - Details in Transit";
                        }
                    }
                } else {
                    alert(data.error || "Order not found. Please verify your ID and email.");
                }
            } catch (err) {
                alert("Technical error connecting to the workshop backend.");
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = "Track My Order";
            }
        });
    }

    // --- ORDER CONFIRMATION PAGE LOGIC ---
    const confirmationBox = document.querySelector(".confirmation-box");
    if (confirmationBox) {
        // Read query params from URL: ?order=...&tx=...
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('order') || 'Not Available';
        const txId = urlParams.get('tx') || 'Not Available';

        const orderEl = document.getElementById("display-order-id");
        const txEl = document.getElementById("display-tx-id");

        if (orderEl) orderEl.textContent = orderId;
        if (txEl) txEl.textContent = txId;

        // Clipboard Copy Handler
        document.querySelectorAll(".copy-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const targetId = btn.dataset.target;
                const textToCopy = document.getElementById(targetId)?.textContent;

                if (textToCopy && textToCopy !== 'Not Available') {
                    navigator.clipboard.writeText(textToCopy);
                    const originalText = btn.textContent;
                    btn.textContent = "Copied!";
                    setTimeout(() => { btn.textContent = originalText; }, 1500);
                }
            });
        });
    }

    // --- INITIAL PAGE LOAD SYNC ---
    renderCart();
    updateNavCart(); // (NEW) Ensures the navbar cart count and dropdown populate as soon as any page loads
});