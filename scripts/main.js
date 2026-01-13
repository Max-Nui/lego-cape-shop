document.addEventListener("DOMContentLoaded", () => {
    // Select all images inside the gallery
    const slides = document.querySelectorAll(".gallery img");

    // Guard clause: do nothing if no gallery exists
    if (!slides || slides.length === 0) return;

    let currentIndex = 0;
    const intervalTime = 10000; // 10 seconds

    // Ensure only the first image is visible on load
    slides.forEach((slide, index) => {
        if (index !== 0) {
            slide.classList.remove("active");
        }
    });

    // Cycle through images
    setInterval(() => {
        slides[currentIndex].classList.remove("active");

        currentIndex = (currentIndex + 1) % slides.length;

        slides[currentIndex].classList.add("active");
    }, intervalTime);
});
