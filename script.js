let postsData;
let currentSlide = 0;
let activePost = null;
let images, nav;

const main = document.querySelector("main");

const hamburger = document.getElementById('hamburger');

function toggleSidebarOverlay(open) {
  if (open === undefined) document.body.classList.toggle('sidebar-open');
  else document.body.classList.toggle('sidebar-open', !!open);

  const isOpen = document.body.classList.contains('sidebar-open');
  if (hamburger) hamburger.setAttribute('aria-expanded', String(isOpen));

  // Keep CSS and DOM in sync: when the overlay state changes, add/remove
  // the `.open` class on the `nav` element so the mobile dropdown shows.
  const siteNav = document.querySelector('nav');
  if (siteNav) siteNav.classList.toggle('open', isOpen);
}

if (hamburger) {
  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSidebarOverlay();
  });
}

// clicking main area should close the overlay on mobile
if (main) {
  main.addEventListener('click', () => {
    if (document.body.classList.contains('sidebar-open')) {
      toggleSidebarOverlay(false);
    }
  });
}

// Load JSON data
fetch("posts.json")
  .then(res => res.json())
  .then(data => {
    postsData = data;
  });

fetch("posts.json")
  .then(res => res.json())
  .then(data => {
    postsData = data;

    // Generate sidebar dynamically
    const sidebar = document.getElementById("sidebar");
    sidebar.innerHTML = "";

    Object.keys(postsData).forEach(section => {
      // Section header
      const liSection = document.createElement("li");
      liSection.className = "section";
      liSection.textContent = section
      sidebar.appendChild(liSection);
      // Subitems
      const ulSub = document.createElement("ul");
      ulSub.className = "subitems";

      Object.keys(postsData[section]).forEach(postKey => {
        const postData = postsData[section][postKey];
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "#";
        a.dataset.section = section;
        a.dataset.post = postKey;
        a.textContent = postData.title; 
        li.appendChild(a);
        ulSub.appendChild(li);
      });

      liSection.appendChild(ulSub);
      sidebar.appendChild(liSection);
    });

    // (About is provided inside `posts.json` as a post named "about"
    // so no static insertion is necessary here.)

    // Add click listeners
    document.querySelectorAll("#sidebar a[data-section][data-post]").forEach(link => {
      link.addEventListener("click", e => {
        e.preventDefault();
        const section = link.dataset.section;
        const post = link.dataset.post;
        // close the overlay (mobile) when a post is selected
        if (document.body.classList.contains('sidebar-open')) toggleSidebarOverlay(false);
        loadPost(section, post);
      });
    });
  });


// Handle sidebar clicks
document.querySelectorAll("nav a[data-section][data-post]").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    const section = link.dataset.section;
    const post = link.dataset.post;
    loadPost(section, post);
  });
});

function loadPost(section, post) {
  if (activePost === `${section}/${post}`) return;
  activePost = `${section}/${post}`;

  // mark that a post is open (used by CSS to show hamburger)
  document.body.classList.add('post-open');
  // ensure sidebar overlay is closed when loading a post
  document.body.classList.remove('sidebar-open');
  if (hamburger) hamburger.setAttribute('aria-expanded', 'false');

  const postData = postsData[section][post];

  // If the post has images, render a carousel; otherwise render just the text.
  if (postData.images && postData.images.length > 0) {
    main.innerHTML = `
      <div class="post">
        <div class="carousel">
          <div class="image-container">
            ${postData.images.map((src, i) =>
              `<img src="${src}" class="${i === 0 ? "active" : ""}">`
            ).join("")}
          </div>
          <div class="carousel-nav"></div>
        </div>
        <div class="post-text"><p>${postData.text}</p></div>
      </div>
    `;

    currentSlide = 0;
    images = document.querySelectorAll(".carousel img");
    nav = document.querySelector(".carousel-nav");

    // build carousel numbers
    nav.innerHTML = "";
    images.forEach((_, i) => {
      const span = document.createElement("span");
      span.textContent = i + 1;
      span.addEventListener("click", () => showSlide(i));
      if (i === 0) span.classList.add("active");
      nav.appendChild(span);
    });

    // Update visibility of the carousel-nav depending on whether
    // the image container horizontally overflows the carousel.
    function updateCarouselNavVisibility() {
      const container = document.querySelector('.image-container');
      const carouselNav = document.querySelector('.carousel-nav');
      if (!container || !carouselNav) return;

      // If scrollWidth is greater than clientWidth, there is overflow
      const hasOverflow = container.scrollWidth > container.clientWidth + 1; // small tolerance
      carouselNav.style.display = hasOverflow ? '' : 'none';

    }

    // Call immediately (some images may still be loading)
    updateCarouselNavVisibility();

    // Re-check when images load (in case sizes change) and on resize
    images.forEach(img => img.addEventListener('load', updateCarouselNavVisibility));
    window.addEventListener('resize', updateCarouselNavVisibility);

    // A small delayed check to account for layout timing
    setTimeout(updateCarouselNavVisibility, 50);


  } else {
    // No images: render only text block
    main.innerHTML = `
      <div class="post">
        <div class="post-text"><p>${postData.text}</p></div>
      </div>
    `;

    // Ensure variables reflect there's no carousel
    images = [];
    nav = null;
  }

  // Update visibility of the carousel-nav depending on whether
  // the image container horizontally overflows the carousel.
  function updateCarouselNavVisibility() {
    const container = document.querySelector('.image-container');
    const carouselNav = document.querySelector('.carousel-nav');
    if (!container || !carouselNav) return;

    // If scrollWidth is greater than clientWidth, there is overflow
    const hasOverflow = container.scrollWidth > container.clientWidth + 1; // small tolerance
    carouselNav.style.display = hasOverflow ? '' : 'none';

  }

  // Call immediately (some images may still be loading)
  updateCarouselNavVisibility();

  // Re-check when images load (in case sizes change) and on resize
  images.forEach(img => img.addEventListener('load', updateCarouselNavVisibility));
  window.addEventListener('resize', updateCarouselNavVisibility);

  // A small delayed check to account for layout timing
  setTimeout(updateCarouselNavVisibility, 50);

}

function showSlide(index) {
  // remove active class from current
  images[currentSlide].classList.remove("active");
  nav.children[currentSlide].classList.remove("active");

  currentSlide = index;

  // add active class to new image
  images[currentSlide].classList.add("active");
  nav.children[currentSlide].classList.add("active");

  // scroll image container so that the active image is fully visible
  const img = images[currentSlide];
  const container = img.parentElement; // .image-container
  const containerRect = container.getBoundingClientRect();
  const imgRect = img.getBoundingClientRect();

  // calculate how much to scroll
  const scrollLeft = img.offsetLeft - container.offsetLeft;
  container.scrollTo({
    left: scrollLeft,
    behavior: "smooth"
  });
}
