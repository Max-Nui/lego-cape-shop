//==================================================
// CART CORE SETUP
//==================================================
const Cart = 
{
    storageKey: "cart",

    get() 
    {
        return JSON.parse(localStorage.getItem(this.storageKey)) || [];
    },

    set(cart) 
    {
        localStorage.setItem(this.storageKey, JSON.stringify(cart));
    }
};

//Add Item to Cart
Cart.addItem = function ({id, name, price, color, quantity})
{
    const cart = this.get();

    const existing = cart.find(item => item.id === id && item.color === color);

    if(existing)
    {
        existing.quantity += quantity;
    }
    else
    {
        cart.push({id, name, price, color, quantity});
    }
    this.set(cart);
}




document.addEventListener("DOMContentLoaded", () => {

    let paypalRendered = false;

    // =====================================================
    // HOME PAGE GALLERY (auto-advance)
    // =====================================================
    const slides = document.querySelectorAll(".gallery img");

    if (slides.length > 0) {
        let homeIndex = 0;
        const intervalTime = 10000; // 10 seconds

        slides.forEach((slide, index) => {
            slide.classList.toggle("active", index === 0);
        });

        setInterval(() => {
            slides[homeIndex].classList.remove("active");
            homeIndex = (homeIndex + 1) % slides.length;
            slides[homeIndex].classList.add("active");
        }, intervalTime);
    }

    // =====================================================
    // ITEM PAGE GALLERY (manual buttons)
    // =====================================================
    const itemGallery = document.querySelector(".item-gallery");

    if (itemGallery) {
        const images = itemGallery.querySelectorAll("img");
        const prevBtn = itemGallery.querySelector(".prev");
        const nextBtn = itemGallery.querySelector(".next");

        let itemIndex = 0;

        function showImage(index) {
            images.forEach((img, i) => {
                img.classList.toggle("active", i === index);
            });
        }

        prevBtn.addEventListener("click", () => {
            itemIndex = (itemIndex - 1 + images.length) % images.length;
            showImage(itemIndex);
        });

        nextBtn.addEventListener("click", () => {
            itemIndex = (itemIndex + 1) % images.length;
            showImage(itemIndex);
        });
    }


    // =====================================================
    // QUANTITY SELECTOR (DISPLAY-ONLY)
    // =====================================================
    document.querySelectorAll(".quantity-selector").forEach(selector => {
        const valueEl = selector.querySelector(".qty-value");
        const incrementBtn = selector.querySelector(".increment");
        const decrementBtn = selector.querySelector(".decrement");

        // Use a property on the element
        selector._quantity = parseInt(selector.dataset.qty, 10) || 1;

        function updateDisplay() {
            valueEl.textContent = selector._quantity;
            selector.dataset.qty = selector._quantity;
        }

        incrementBtn.addEventListener("click", () => {
            selector._quantity += 1;
            updateDisplay();
        });

        decrementBtn.addEventListener("click", () => {
            if (selector._quantity > 1) {
                selector._quantity -= 1;
                updateDisplay();
            }
        });

        updateDisplay();
    });

    // =====================================================
    // COLOR SELECTOR
    // =====================================================
    const colorList = document.querySelector(".color-options");
    const selectedColorText = document.querySelector(".selected-color-text strong");

    if (colorList && selectedColorText) {
        let selectedColor = null;

        colorList.querySelectorAll("li").forEach(colorItem => {
            colorItem.addEventListener("click", () => {
                // Remove previous selection
                colorList.querySelectorAll("li").forEach(li =>
                    li.classList.remove("selected")
                );

                // Set new selection
                colorItem.classList.add("selected");
                selectedColor = colorItem.dataset.color;

                // Update confirmation text
                selectedColorText.textContent = selectedColor;
            });
        });
    }

    // =====================================================
    // CART RENDERING
    // =====================================================
    function getCart() 
    {
        return Cart.get();
    }

    function renderCart() 
    {
        const cartItemsEl = document.querySelector(".cart-items");
        const totalEl = document.querySelector(".cart-total");
        const warningEl = document.querySelector(".cart-warning");

        if (!cartItemsEl || !totalEl) return;

        const cart = getCart();
        cartItemsEl.innerHTML = "";

        let total = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            const row = document.createElement("div");
            row.className = "cart-item";
            row.innerHTML = `
                <div class="cart-item-details">
                <p><strong>${item.name}</strong></p>
                <p>Color: ${item.color}</p>
                <p>Qty: ${item.quantity}</p>
                <p>$${itemTotal.toFixed(2)}</p>
                </div>
                <button data-index="${index}" class="remove-item">Remove</button>
                
            `;

            cartItemsEl.appendChild(row);
        });

        totalEl.textContent = `Total: $${total.toFixed(2)} USD`;

        // Minimum order enforcement
        const paypalContainer = document.querySelector("#paypal-button-container");

        if (total < 5) {
            warningEl?.classList.remove("hidden");

            // If PayPal is currently rendered, remove it
            if (paypalRendered) {
                paypalContainer.innerHTML = ""; // clears the button
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
    }

    function setupRemoveButtons() 
    {
        document.querySelectorAll(".remove-item").forEach(btn => {
            btn.addEventListener("click", () => {
                const index = btn.dataset.index;
                const cart = getCart();
                cart.splice(index, 1);
                localStorage.setItem("cart", JSON.stringify(cart));
                renderCart();
            });
        });
    }

    const addToCartBtn = document.querySelector(".add-to-cart-button");

    if (addToCartBtn) 
        {
            addToCartBtn.addEventListener("click", () => {
                const quantity = parseInt(
                    document.querySelector(".qty-value").textContent,
                    10
                );

                const selectedColorEl =
                    document.querySelector(".color-options li.selected");

                if (!selectedColorEl) {
                    alert("Please select a color.");
                    return;
                }

                Cart.addItem({
                    id: "standard-cape",
                    name: "Standard Cape",
                    price: 0.5,
                    color: selectedColorEl.dataset.color,
                    quantity
                });

                // Reset the quantity counter
                const quantitySelector = document.querySelector(".quantity-selector");
                const qtyValueEl = quantitySelector?.querySelector(".qty-value");

                if (quantitySelector && qtyValueEl) {
                    qtyValueEl.textContent = "0";
                    quantitySelector.dataset.qty = 0;

                    // IMPORTANT: also update the closure variable used by increment/decrement
                    quantitySelector._quantity = 0;      // new property to track state
                }

                alert("Added to cart");
            });
        }


       function buildPayPalItems(cart) 
       {
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


    
    //=====================================================================
    //Paypal Render Function
    //=====================================================================
    function renderPayPalButton() {
        const container = document.querySelector("#paypal-button-container");
        if (!container || typeof paypal === "undefined") return;

        // Clear previous button (important!)
        container.innerHTML = "";

        paypal.Buttons({
            createOrder: function (data, actions) {
                const cart = Cart.get();

                if (cart.length === 0) {
                    alert("Your cart is empty.");
                    return;
                }

                const total = calculateCartTotal(cart);
                const items = buildPayPalItems(cart);

                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            currency_code: "USD",
                            value: total,
                            breakdown: {
                                item_total: {
                                    currency_code: "USD",
                                    value: total
                                }
                            }
                        },
                        items: items
                    }]
                });
            },

            onApprove: function (data, actions) {
                return actions.order.capture().then(function (details) {
                    // This 'data.orderID' is the one you need for your Lookup tool!
                    console.log("SUCCESS! Use this ID for Lookup:", data.orderID);
                    
                    alert(`Payment completed! Your Order ID is: ${data.orderID}`);

                    Cart.set([]);
                    renderCart();
                });
            },

            onError: function (err) {
                console.error("PayPal Checkout Error:", err);
                alert("Something went wrong with the payment.");
            }
        }).render("#paypal-button-container");

    }

    // =====================================================
    // ORDER LOOKUP LOGIC
    // =====================================================
    const lookupForm = document.getElementById('order-lookup-form');
    
    if (lookupForm) {
        lookupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // 1. Grab values from your HTML form
            const orderID = document.getElementById('order-id').value.trim();
            const userEmail = document.getElementById('email').value.trim();
            const resultsDiv = document.getElementById('results');
            const statusText = document.getElementById('status-text');
            const itemsList = document.getElementById('items-list');

            // Feedback for the user while they wait
            const submitBtn = lookupForm.querySelector('button');
            submitBtn.disabled = true;
            submitBtn.textContent = "Searching Archives...";

            try {
                // 2. Call your Netlify Function
                const response = await fetch('/.netlify/functions/lookup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderID, userEmail })
                });

                const data = await response.json();

                if (response.ok) {
                    // 3. Map PayPal's "COMPLETED" to your brand's voice
                    const statusMap = {
                        'COMPLETED': 'Order Tailored & Shipped!',
                        'APPROVED': 'Awaiting Tailoring',
                        'PENDING': 'Processing Fabric'
                    };

                    resultsDiv.style.display = 'block';
                    statusText.innerText = statusMap[data.status] || data.status;

                    // 4. Format the items list nicely
                    if (data.items && data.items.length > 0) {
                        const itemsHtml = data.items.map(item => 
                            `<li>${item.quantity}x ${item.name}</li>`
                        ).join('');
                        itemsList.innerHTML = `<ul>${itemsHtml}</ul>`;
                    } else {
                        itemsList.innerText = "Custom Order / Details Unavailable";
                    }

                } else {
                    alert(data.error || "Order not found. Check your ID and email.");
                }
            } catch (err) {
                console.error("Lookup Error:", err);
                alert("Technical error connecting to the tailor's database.");
            } finally {
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.textContent = "Track My Order";
            }
        });
    }


    renderCart();
});
