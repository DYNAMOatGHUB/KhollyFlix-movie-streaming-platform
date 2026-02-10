// TMDB API Configuration
const TMDB_API_KEY = 'b9cd4ee40ca04611f564a0127bfbea03';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const moviesContainer = document.getElementById("movies");
let currentPage = 1;
let totalPages = 1;
let searchQuery = '';

// Fetch movies from TMDB
async function fetchMovies(page = 1, query = '') {
  try {
    let url;
    if (query) {
      url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
    } else {
      url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch movies');
    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}



function renderMovieCard(movie) {
  const posterUrl = movie.poster_path 
    ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` 
    : 'https://via.placeholder.com/500x750?text=No+Poster';
  
  const rating = movie.vote_average || 0;
  const ratingPercent = Math.round(rating * 10);
  
  return `
    <article class="movie-card" data-movie-id="${movie.id}">
      <div class="poster-container">
        <img src="${posterUrl}" alt="${movie.title} poster" class="movie-poster" loading="lazy">
        <div class="rating-badge">${ratingPercent}%</div>
        <div class="movie-overlay">
          <button class="watch-btn" onclick="openMoviePlayer(${movie.id}, '${movie.title.replace(/'/g, "\\'")}')">
            <span>▶</span> Watch Now
          </button>
        </div>
      </div>
      <div class="movie-info">
        <h3 class="movie-title">${movie.title}</h3>
        <p class="movie-meta">${movie.release_date?.split('-')[0] || 'N/A'}</p>
        <p class="movie-description">${movie.overview || 'No description available.'}</p>
      </div>
    </article>
  `;
}

async function renderMovies(page = 1) {
  try {
    currentPage = page;
    moviesContainer.innerHTML = '<div class="loading">⏳ Loading movies...</div>';
    
    const data = await fetchMovies(page, searchQuery);
    totalPages = data.total_pages;
    const movies = data.results.filter(m => m.poster_path);
    
    if (movies.length === 0) {
      moviesContainer.innerHTML = '<div class="error-state"><h3>No movies found</h3><p>Try a different search term</p></div>';
      return;
    }
    
    moviesContainer.innerHTML = movies.map(renderMovieCard).join('');
    updatePagination();
  } catch (error) {
    moviesContainer.innerHTML = `
      <div class="error-state">
        <h3>⚠️ Unable to load movies</h3>
        <p>Please check your connection or try again later.</p>
        <button onclick="renderMovies(1)">Retry</button>
      </div>
    `;
    console.error('Failed to render movies', error);
  }
}

function updatePagination() {
  const paginationContainer = document.getElementById('pagination');
  if (!paginationContainer) return;
  
  let html = '';
  
  if (currentPage > 1) {
    html += `<button class="page-btn" onclick="renderMovies(1)">« First</button>`;
    html += `<button class="page-btn" onclick="renderMovies(${currentPage - 1})">‹ Prev</button>`;
  }
  
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  
  for (let i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      html += `<button class="page-btn active">${i}</button>`;
    } else {
      html += `<button class="page-btn" onclick="renderMovies(${i})">${i}</button>`;
    }
  }
  
  if (currentPage < totalPages) {
    html += `<button class="page-btn" onclick="renderMovies(${currentPage + 1})">Next ›</button>`;
    html += `<button class="page-btn" onclick="renderMovies(${totalPages})">Last »</button>`;
  }
  
  paginationContainer.innerHTML = html;
}



// Fetch free movies from Internet Archive
async function searchFreeMovies(title) {
  try {
    const url = `https://archive.org/advancedsearch.php?q=title:%22${encodeURIComponent(title)}%22%20AND%20mediatype:movies&fl=identifier,title,description,format&output=json&rows=10`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to search Internet Archive');
    return response.json();
  } catch (error) {
    console.error('Error searching free movies:', error);
    return { response: { docs: [] } };
  }
}

// Generate links to legal streaming services
function generateStreamingLinks(title, year) {
  const encodedTitle = encodeURIComponent(title);
  
  return {
    netflix: `https://www.netflix.com/search?q=${encodedTitle}`,
    prime: `https://www.amazon.com/s?k=${encodedTitle}`,
    disney: `https://www.disneyplus.com/search?q=${encodedTitle}`,
    hotstar: `https://www.hotstar.com/search?query=${encodedTitle}`,
    sonyliv: `https://www.sonyliv.com/search/${encodedTitle}`,
    sunnxt: `https://www.sunnxt.com/search/${encodedTitle}`,
    tubi: `https://tubitv.com/search?q=${encodedTitle}`,
    archive: `https://archive.org/advancedsearch.php?q=title:%22${encodedTitle}%22&mediatype=movies`
  };
}

function openMoviePlayer(movieId, title) {
  // Directly show streaming options without YouTube trailers
  showStreamingOptions(movieId, title);
}

function showStreamingOptions(movieId, title) {
  const modal = document.getElementById('streaming-modal');
  const modalTitle = document.getElementById('streaming-title');
  const optionsContent = document.getElementById('streaming-options');
  
  modalTitle.textContent = `🎬 Watch: ${title}`;
  modal.style.display = 'block';
  
  // Store current title globally
  window.currentMovieTitle = title;
  window.currentMovieId = movieId;
  
  // Build OTT platform grid
  let html = `
    <div class="ott-platform-grid">
      <div class="ott-header">
        <h3>Select a Platform to Browse</h3>
        <p>All platforms available in one place</p>
      </div>
      
      <div class="ott-category">
        <h4 class="ott-category-title">🌍 Global Platforms</h4>
        <div class="ott-cards">
          <div class="ott-card" data-platform="netflix" onclick="handlePlatformClick('netflix')">
            <div class="ott-logo">🎥</div>
            <h4>Netflix</h4>
            <p>Premium</p>
          </div>
          <div class="ott-card" data-platform="prime" onclick="handlePlatformClick('prime')">
            <div class="ott-logo">📦</div>
            <h4>Prime Video</h4>
            <p>Rental/Subscribe</p>
          </div>
          <div class="ott-card" data-platform="disney" onclick="handlePlatformClick('disney')">
            <div class="ott-logo">✨</div>
            <h4>Disney+</h4>
            <p>Premium</p>
          </div>
        </div>
      </div>
      
      <div class="ott-category">
        <h4 class="ott-category-title">🇮🇳 Indian OTT</h4>
        <div class="ott-cards">
          <div class="ott-card" data-platform="hotstar" onclick="handlePlatformClick('hotstar')">
            <div class="ott-logo">⭐</div>
            <h4>Disney+ Hotstar</h4>
            <p>Hindi, Tamil, Telugu</p>
          </div>
          <div class="ott-card" data-platform="sonyliv" onclick="handlePlatformClick('sonyliv')">
            <div class="ott-logo">📺</div>
            <h4>SonyLiv</h4>
            <p>Hindi, Tamil</p>
          </div>
          <div class="ott-card" data-platform="sunnxt" onclick="handlePlatformClick('sunnxt')">
            <div class="ott-logo">☀️</div>
            <h4>Sun NXT</h4>
            <p>Tamil, Telugu</p>
          </div>
        </div>
      </div>
      
      <div class="ott-category">
        <h4 class="ott-category-title">✨ Free Platforms</h4>
        <div class="ott-cards">
          <div class="ott-card" data-platform="tubi" onclick="handlePlatformClick('tubi')">
            <div class="ott-logo">🎬</div>
            <h4>Tubi TV</h4>
            <p>10,000+ Free</p>
          </div>
          <div class="ott-card" data-platform="archive" onclick="handlePlatformClick('archive')">
            <div class="ott-logo">📚</div>
            <h4>Internet Archive</h4>
            <p>Public Domain</p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  optionsContent.innerHTML = html;
}

function handlePlatformClick(platform) {
  const title = window.currentMovieTitle;
  openOTTPlatform(platform, title);
}

function openOTTPlatform(platform, title) {
  const optionsContent = document.getElementById('streaming-options');
  const modalTitle = document.getElementById('streaming-title');
  
  modalTitle.textContent = `${title} - Browse on ${getPlatformName(platform)}`;
  
  let html = `
    <div class="ott-player-container">
      <button class="back-btn" onclick="showStreamingOptions(window.currentMovieId, window.currentMovieTitle)">← Back to Platforms</button>
      <div class="ott-embed-wrapper">
  `;
  
  // Generate embed for each platform
  switch(platform) {
    case 'tubi':
      const tubiUrl = `https://tubitv.com/search?q=${encodeURIComponent(title)}`;
      html += `<iframe src="${tubiUrl}" class="ott-iframe" title="Tubi TV"></iframe>`;
      break;
      
    case 'archive':
      html += `<div class="ott-search-results" id="archive-results">Loading search results...</div>`;
      break;
      
    case 'netflix':
      const netflixUrl = `https://www.netflix.com/search?q=${encodeURIComponent(title)}`;
      html += `<iframe src="${netflixUrl}" class="ott-iframe" title="Netflix"></iframe>`;
      break;
      
    case 'prime':
      const primeUrl = `https://www.amazon.com/s?k=${encodeURIComponent(title)}`;
      html += `<iframe src="${primeUrl}" class="ott-iframe" title="Prime Video"></iframe>`;
      break;
      
    case 'disney':
      const disneyUrl = `https://www.disneyplus.com/search?q=${encodeURIComponent(title)}`;
      html += `<iframe src="${disneyUrl}" class="ott-iframe" title="Disney+"></iframe>`;
      break;
      
    case 'hotstar':
      const hotstarUrl = `https://www.hotstar.com/search?query=${encodeURIComponent(title)}`;
      html += `<iframe src="${hotstarUrl}" class="ott-iframe" title="Disney+ Hotstar"></iframe>`;
      break;
      
    case 'sonyliv':
      const sonylivUrl = `https://www.sonyliv.com/search/${encodeURIComponent(title)}`;
      html += `<iframe src="${sonylivUrl}" class="ott-iframe" title="SonyLiv"></iframe>`;
      break;
      
    case 'sunnxt':
      const sunnxtUrl = `https://www.sunnxt.com/search/${encodeURIComponent(title)}`;
      html += `<iframe src="${sunnxtUrl}" class="ott-iframe" title="Sun NXT"></iframe>`;
      break;
  }
  
  html += `
      </div>
    </div>
  `;
  
  optionsContent.innerHTML = html;
  
  // Load archive results if needed
  if(platform === 'archive') {
    loadArchiveResults(title);
  }
}

function loadArchiveResults(title) {
  const resultsContainer = document.getElementById('archive-results');
  const url = `https://archive.org/advancedsearch.php?q=title:%22${encodeURIComponent(title)}%22&mediatype=movies&output=json`;
  
  fetch(url)
    .then(r => r.json())
    .then(data => {
      if(data.response?.docs?.length > 0) {
        let html = '<div class="archive-grid">';
        data.response.docs.slice(0, 12).forEach(item => {
          const itemUrl = `https://archive.org/details/${item.identifier}`;
          html += `
            <a href="${itemUrl}" target="_blank" class="archive-item">
              <div class="archive-thumb">📹</div>
              <h4>${item.title}</h4>
              <p>${item.format?.[0]?.split(',')[0] || 'Video'}</p>
            </a>
          `;
        });
        html += '</div>';
        resultsContainer.innerHTML = html;
      } else {
        resultsContainer.innerHTML = `
          <div class="no-results">
            <p>No results found on Internet Archive</p>
            <p>Try a different search or visit archive.org directly</p>
          </div>
        `;
      }
    })
    .catch(err => {
      resultsContainer.innerHTML = `<p>Error loading results: ${err.message}</p>`;
    });
}

function getPlatformName(platform) {
  const names = {
    netflix: 'Netflix',
    prime: 'Prime Video',
    disney: 'Disney+',
    hotstar: 'Disney+ Hotstar',
    sonyliv: 'SonyLiv',
    sunnxt: 'Sun NXT',
    tubi: 'Tubi TV',
    archive: 'Internet Archive'
  };
  return names[platform] || platform;
}

function closeStreamingModal() {
  document.getElementById('streaming-modal').style.display = 'none';
}

function searchMovies(event) {
  event.preventDefault();
  const input = document.getElementById('search-input');
  searchQuery = input.value.trim();
  currentPage = 1;
  renderMovies(1);
}

function clearSearch() {
  searchQuery = '';
  document.getElementById('search-input').value = '';
  currentPage = 1;
  renderMovies(1);
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
  const trailerModal = document.getElementById('trailer-modal');
  const streamingModal = document.getElementById('streaming-modal');
  
  if (event.target === trailerModal) closeTrailerModal();
  if (event.target === streamingModal) closeStreamingModal();
});

// Initialize the app
window.addEventListener('DOMContentLoaded', () => {
  renderMovies(1);
});
