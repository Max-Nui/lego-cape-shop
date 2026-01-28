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

        let quantity = parseInt(selector.dataset.qty, 10) || 1;

        function updateDisplay() {
            valueEl.textContent = quantity;
            selector.dataset.qty = quantity;
        }

        incrementBtn.addEventListener("click", () => {
            quantity += 1;
            updateDisplay();
        });

        decrementBtn.addEventListener("click", () => {
            if (quantity > 1) {
                quantity -= 1;
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
        if (total < 5) {
            warningEl?.classList.remove("hidden");
        } else {
            warningEl?.classList.add("hidden");
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

                alert("Added to cart");
            });
        }



    renderCart();
});
