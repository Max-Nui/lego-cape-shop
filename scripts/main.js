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


});
