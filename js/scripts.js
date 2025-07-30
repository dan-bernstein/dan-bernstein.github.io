particlesJS('particles-js', {
  particles: {
    number: { value: 80, density: { enable: true, value_area: 800 } },
    color: { value: '#888888' },
    shape: { type: 'circle', stroke: { width: 0, color: '#000000' }, polygon: { nb_sides: 5 } },
    opacity: { value: 0.5, random: true, anim: { enable: false, speed: 1, opacity_min: 0.1, sync: false } },
    size: { value: 3, random: true, anim: { enable: false, speed: 40, size_min: 0.1, sync: false } },
    line_linked: { enable: true, distance: 125, color: '#888888', opacity: 0.4, width: 1 },
    move: { enable: true, speed: 6, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false, attract: { enable: false, rotateX: 600, rotateY: 1200 } }
  },
  interactivity: {
    detect_on: 'canvas',
    events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true }, resize: true },
    modes: { grab: { distance: 400, line_linked: { opacity: 1 } }, bubble: { distance: 400, size: 40, duration: 2, opacity: 8, speed: 3 }, repulse: { distance: 200, duration: 0.4 }, push: { particles_nb: 4 }, remove: { particles_nb: 2 } }
  },
  retina_detect: true
});

const postsList = document.getElementById('posts-list');
const projectsList = document.getElementById('projects-list');
const listeningList = document.getElementById('listening-list');
const converter = new showdown.Converter({
  simpleLineBreaks: true,
  strikethrough: true,
  tables: true,
});

// Before/After Slider Implementation
class BeforeAfterSlider {
  constructor(container) {
    this.container = container;
    this.afterImage = container.querySelector('.after-image');
    this.handle = container.querySelector('.slider-handle');
    this.isDragging = false;
    
    // Ensure images are loaded before initializing
    this.waitForImages().then(() => {
      this.init();
    });
  }
  
  waitForImages() {
    const images = [
      this.container.querySelector('.before-image'),
      this.afterImage
    ];
    
    const promises = images.map(img => {
      if (img.complete) {
        return Promise.resolve();
      }
      return new Promise(resolve => {
        img.addEventListener('load', resolve);
        img.addEventListener('error', resolve);
      });
    });
    
    return Promise.all(promises);
  }
  
  init() {
    // Mouse events - listen on the entire container
    this.container.addEventListener('mousedown', this.startDrag.bind(this));
    document.addEventListener('mousemove', this.drag.bind(this));
    document.addEventListener('mouseup', this.stopDrag.bind(this));
    
    // Touch events for mobile
    this.container.addEventListener('touchstart', this.startDrag.bind(this));
    document.addEventListener('touchmove', this.drag.bind(this));
    document.addEventListener('touchend', this.stopDrag.bind(this));
    
    // Prevent default drag behavior on images
    const images = this.container.querySelectorAll('img');
    images.forEach(img => {
      img.addEventListener('dragstart', e => e.preventDefault());
    });
  }
  
  startDrag(e) {
    this.isDragging = true;
    e.preventDefault();
    this.updateSlider(e);
  }
  
  stopDrag() {
    this.isDragging = false;
  }
  
  drag(e) {
    if (!this.isDragging) return;
    e.preventDefault();
    this.updateSlider(e);
  }
  
  updateSlider(e) {
    const rect = this.container.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    
    // Update handle position
    this.handle.style.left = `${percentage}%`;
    
    // Update after image clip-path
    this.afterImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
  }
}

async function fetchMarkdownFiles(folder, files, container, maxVisibleItems) {
  let itemCount = 0;
  for (const file of files) {
    if (file.endsWith('.md')) {
      try {
        const filePath = `${folder}/${file}`;
        const fileRes = await fetch(filePath);
        if (!fileRes.ok) {
          console.error(`Failed to load ${filePath}: ${fileRes.statusText}`);
          continue;
        }
        const mdContent = await fileRes.text();
        const mdWithLineBreaks = mdContent.replace(/\n/g, '  \n');
        const htmlContent = converter.makeHtml(mdWithLineBreaks);
        const title = mdContent.split('\n')[0].replace(/^#+\s*/, '');
        const contentWithoutTitle = mdContent.replace(/^.+\n/, '');
        const htmlContentWithoutTitle = converter.makeHtml(contentWithoutTitle);
        const fileCard = `
          <div class="markdown-container bg-white p-4 rounded shadow-md transition-colors duration-200 hover:bg-gray-100 w-200 h-200 overflow-auto flex-none mx-2 my-2">
            <h2 class="text-xl font-semibold mb-2">${title}</h2>
            <div>${htmlContentWithoutTitle}</div>
          </div>
        `;
        if (itemCount < maxVisibleItems) {
          container.innerHTML += fileCard;
        } else {
          const hiddenCard = `<div class='hidden'>${fileCard}</div>`;
          container.innerHTML += hiddenCard;
        }
        itemCount++;
      } catch (error) {
        console.error(`Error loading ${file}: ${error.message}`);
      }
    }
  }
  if (itemCount > maxVisibleItems) {
    createShowMoreButton(container);
  }
}

const createShowLessButton = (container) => {
  const button1 = document.createElement('button');
  button1.innerHTML = '➖ Show Less';
  button1.classList.add('show-less');
  button1.style.color = 'gray';
  button1.style.marginTop = '10px';
  container.after(button1);
  button1.addEventListener('click', () => {
    const hiddenItems = container.querySelectorAll('.shown');
    hiddenItems.forEach(item => item.classList.remove('shown'));
    hiddenItems.forEach(item => item.classList.add('hidden'));
    button1.remove();
    createShowMoreButton(container);
  });
};

const createShowMoreButton = (container) => {
  const button = document.createElement('button');
  button.innerHTML = '➕ Show More';
  button.classList.add('show-more');
  button.style.color = 'gray';
  button.style.marginTop = '10px';
  container.after(button);
  button.addEventListener('click', () => {
    const hiddenItems = container.querySelectorAll('.hidden');
    hiddenItems.forEach(item => item.classList.remove('hidden'));
    hiddenItems.forEach(item => item.classList.add('shown'));
    button.remove();
    createShowLessButton(container);
  });
};

async function loadFilesAndRender() {
  try {
    const response = await fetch('files.json');
    if (!response.ok) {
      console.error(`Failed to load files.json: ${response.statusText}`);
      return;
    }
    const fileLists = await response.json();
    const folders = [
      { name: 'posts', files: fileLists.posts || [], container: postsList, maxVisibleItems: 3 },
      { name: 'projects', files: fileLists.projects || [], container: projectsList, maxVisibleItems: 2 }
    ];
    folders.forEach(({ name, files, container, maxVisibleItems }) => {
      fetchMarkdownFiles(name, files, container, maxVisibleItems);
    });
  } catch (error) {
    console.error(`Error loading files.json: ${error.message}`);
  }
}

loadFilesAndRender();

const elevator = new Elevator({ duration: 2000 });
const footer = document.createElement("footer");
footer.className = "mt-8 mb-4";
const footerContent = document.createElement("div");
footerContent.className = "flex items-center justify-between";
footer.appendChild(footerContent);
const copyright = document.createElement("div");
copyright.className = "hidden md:flex";
copyright.innerHTML = '  © ' + (new Date().getFullYear()) + ' Dan Bernstein';
footerContent.appendChild(copyright);
const madeWith = document.createElement("div");
madeWith.className = "hidden md:flex";
madeWith.innerHTML = '';
footerContent.appendChild(madeWith);
const elevatorBtnDiv = document.createElement("div");
elevatorBtnDiv.innerHTML = 'To the Top  <i class="fas fa-angle-up"></i>  ';
elevatorBtnDiv.className = "text-center flex justify-center items-center cursor-pointer mt-4";
elevatorBtnDiv.onclick = () => { elevator.elevate(); };
footerContent.appendChild(elevatorBtnDiv);
document.body.appendChild(footer);

const scrollDownBtn = document.getElementById('scroll-down-btn');
const headerContainer = document.getElementById('header-container');
const toggleScrollButtonVisibility = () => {
  if (window.pageYOffset === 0) {
    scrollDownBtn.style.display = 'flex';
  } else {
    scrollDownBtn.style.display = 'none';
  }
};
scrollDownBtn.addEventListener('click', () => {
  const yOffset = headerContainer.getBoundingClientRect().bottom + window.pageYOffset;
  window.scrollTo({top: yOffset, behavior: 'smooth'});
});
window.addEventListener('scroll', toggleScrollButtonVisibility);
toggleScrollButtonVisibility();

// Initialize before/after sliders when DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Wait a bit for any dynamically loaded content
  setTimeout(() => {
    const sliders = document.querySelectorAll('.before-after-slider');
    sliders.forEach(slider => new BeforeAfterSlider(slider));
  }, 500);
});
